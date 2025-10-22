import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { pool } from '../db/client';

const router = Router();
const APK_DIRECTORY = process.env.APK_DIRECTORY || '/data/apk';
const STAGING_DIRECTORY = path.join(APK_DIRECTORY, 'staging');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(STAGING_DIRECTORY, { recursive: true });
      cb(null, STAGING_DIRECTORY);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Only .apk files are allowed'));
    }
  }
});

// GET /api/apk/list - List all APK files
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, name, package_name, version, version_code, 
        build, file_path, file_size, created_at
       FROM apk_files 
       ORDER BY created_at DESC`
    );

    // Check if files still exist on filesystem
    const apksWithStatus = await Promise.all(
      result.rows.map(async (apk) => {
        try {
          await fs.access(apk.file_path);
          return { ...apk, exists: true };
        } catch {
          return { ...apk, exists: false };
        }
      })
    );

    res.json({
      success: true,
      data: apksWithStatus
    });
  } catch (error) {
    console.error('Error listing APKs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list APK files'
    });
  }
});

// GET /api/apk/metadata/:id - Get APK metadata
router.get('/metadata/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM apk_files WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'APK not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting APK metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get APK metadata'
    });
  }
});

// POST /api/apk/scan - Scan APK directory and update database
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(APK_DIRECTORY);
    const apkFiles = files.filter(f => f.endsWith('.apk'));
    
    let added = 0;
    let skipped = 0;

    for (const filename of apkFiles) {
      const filePath = path.join(APK_DIRECTORY, filename);
      const stats = await fs.stat(filePath);
      
      // Parse filename (assuming format: AppName-v1.2.3-build123.apk)
      const match = filename.match(/^(.+?)-v?(\d+\.\d+\.\d+)(?:-build(\d+))?\.apk$/i);

      // Fallback: accept any .apk if pattern doesn't match
      let name: string;
      let version: string;
      let build: string | null;
      let versionCode: number;

      if (match) {
        name = match[1];
        version = match[2];
        build = match[3] ?? null;
        versionCode = parseInt(match[3] || '0');
      } else {
        name = filename.replace(/\.apk$/i, '');
        version = '0.0.0';
        build = null;
        versionCode = 0;
      }
      
      try {
        await pool.query(
          `INSERT INTO apk_files (name, package_name, version, version_code, build, file_path, file_size)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (package_name, version_code) DO NOTHING`,
          [
            name,
            name.toLowerCase().replace(/\s+/g, '.'),
            version,
            versionCode,
            build,
            filePath,
            stats.size
          ]
        );
        added++;
      } catch (err) {
        skipped++;
      }
    }

    res.json({
      success: true,
      data: {
        total: apkFiles.length,
        added,
        skipped
      }
    });
  } catch (error) {
    console.error('Error scanning APK directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan APK directory'
    });
  }
});

// POST /api/apk/upload - Upload APK file (admin only)
router.post('/upload', authenticateToken, upload.single('apk'), async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    
    // Check if user is admin
    if (authReq.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can upload APK files'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filename = req.file.filename;
    const filePath = req.file.path;
    const fileSize = req.file.size;

    // Parse filename (assuming format: AppName-v1.2.3-build123.apk)
    const match = filename.match(/^(.+?)-v?(\d+\.\d+\.\d+)(?:-build(\d+))?\.apk$/i);

    let name: string;
    let version: string;
    let build: string | null;
    let versionCode: number;

    if (match) {
      name = match[1];
      version = match[2];
      build = match[3] ?? null;
      versionCode = parseInt(match[3] || '0');
    } else {
      name = filename.replace(/\.apk$/i, '');
      version = '0.0.0';
      build = null;
      versionCode = 0;
    }

    try {
      const result = await pool.query(
        `INSERT INTO apk_files (name, package_name, version, version_code, build, file_path, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (package_name, version_code) DO UPDATE
         SET file_path = EXCLUDED.file_path,
             file_size = EXCLUDED.file_size,
             created_at = NOW()
         RETURNING id`,
        [
          name,
          name.toLowerCase().replace(/\s+/g, '.'),
          version,
          versionCode,
          build,
          filePath,
          fileSize
        ]
      );

      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          name,
          version,
          build,
          filename,
          size: fileSize
        }
      });
    } catch (dbError: any) {
      // If database insert fails, delete the uploaded file
      await fs.unlink(filePath).catch(() => {});
      throw dbError;
    }
  } catch (error) {
    console.error('Error uploading APK:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload APK file'
    });
  }
});

export default router;
