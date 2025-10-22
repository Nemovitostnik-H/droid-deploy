import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db/client';

const router = Router();
const APK_DIRECTORY = process.env.APK_DIRECTORY || '/data/apk';

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
      
      if (!match) {
        skipped++;
        continue;
      }

      const [, name, version, build] = match;
      
      try {
        await pool.query(
          `INSERT INTO apk_files (name, package_name, version, version_code, build, file_path, file_size)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (package_name, version_code) DO NOTHING`,
          [name, name.toLowerCase().replace(/\s+/g, '.'), version, parseInt(build || '0'), build || null, filePath, stats.size]
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

export default router;
