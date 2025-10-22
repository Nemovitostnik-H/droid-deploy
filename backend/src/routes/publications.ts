import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db/client';
import { getSetting } from './settings';

const router = Router();

// Get platform directories from settings with fallback to ENV
async function getPlatformPaths(): Promise<Record<string, string>> {
  return {
    development: await getSetting('platform_dev_directory', process.env.PLATFORM_DEV || '/data/apk/development'),
    release_candidate: await getSetting('platform_rc_directory', process.env.PLATFORM_RC || '/data/apk/release-candidate'),
    production: await getSetting('platform_prod_directory', process.env.PLATFORM_PROD || '/data/apk/production')
  };
}

// GET /api/publications/list - List all publications
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id, p.apk_id, p.platform, p.status, p.created_at, p.published_at,
        a.name as apk_name, a.version, a.build,
        u.name as user_name
       FROM publications p
       JOIN apk_files a ON p.apk_id = a.id
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error listing publications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list publications'
    });
  }
});

// POST /api/publications/create - Create new publication
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { apkId, platform } = req.body;
    const userId = (req as any).user.id;

    // Get platform paths from settings
    const PLATFORM_PATHS = await getPlatformPaths();

    // Validate platform
    if (!PLATFORM_PATHS[platform]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform'
      });
    }

    // Get APK info
    const apkResult = await pool.query(
      'SELECT * FROM apk_files WHERE id = $1',
      [apkId]
    );

    if (apkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'APK not found'
      });
    }

    const apk = apkResult.rows[0];

    // Create publication record
    const pubResult = await pool.query(
      `INSERT INTO publications (apk_id, user_id, platform, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [apkId, userId, platform]
    );

    const publication = pubResult.rows[0];

    // Copy APK file to target platform directory
    try {
      const targetDir = PLATFORM_PATHS[platform];
      await fs.mkdir(targetDir, { recursive: true });
      
      const filename = path.basename(apk.file_path);
      const targetPath = path.join(targetDir, filename);
      
      await fs.copyFile(apk.file_path, targetPath);
      
      // Update publication status
      await pool.query(
        `UPDATE publications 
         SET status = 'published', published_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [publication.id]
      );

      res.json({
        success: true,
        data: {
          id: publication.id,
          status: 'published',
          targetPath
        }
      });
    } catch (error) {
      console.error('Error copying APK:', error);
      
      // Update publication status to failed
      await pool.query(
        `UPDATE publications SET status = 'failed' WHERE id = $1`,
        [publication.id]
      );

      res.status(500).json({
        success: false,
        error: 'Failed to copy APK file'
      });
    }
  } catch (error) {
    console.error('Error creating publication:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create publication'
    });
  }
});

// GET /api/publications/:id/status - Get publication status
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get platform paths from settings
    const PLATFORM_PATHS = await getPlatformPaths();

    const result = await pool.query(
      `SELECT 
        p.*, 
        a.name as apk_name, 
        a.version, 
        a.file_path
       FROM publications p
       JOIN apk_files a ON p.apk_id = a.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Publication not found'
      });
    }

    const publication = result.rows[0];

    // If pending, check if file exists in target directory
    if (publication.status === 'pending') {
      const targetDir = PLATFORM_PATHS[publication.platform];
      const filename = path.basename(publication.file_path);
      const targetPath = path.join(targetDir, filename);

      try {
        await fs.access(targetPath);
        
        // File exists, update status
        await pool.query(
          `UPDATE publications 
           SET status = 'published', published_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [id]
        );

        publication.status = 'published';
      } catch {
        // File doesn't exist yet
      }
    }

    res.json({
      success: true,
      data: {
        id: publication.id,
        status: publication.status,
        platform: publication.platform,
        created_at: publication.created_at,
        published_at: publication.published_at
      }
    });
  } catch (error) {
    console.error('Error getting publication status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get publication status'
    });
  }
});

export default router;
