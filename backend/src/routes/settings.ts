import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { pool } from '../db/client';

const router = Router();

// GET /api/settings - Get all settings (authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT key, value, description, updated_at FROM settings ORDER BY key'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

// GET /api/settings/:key - Get specific setting
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await pool.query(
      'SELECT key, value, description, updated_at FROM settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get setting'
    });
  }
});

// PUT /api/settings/:key - Update setting (admin only)
router.put('/:key', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    
    // Check if user is admin
    if (authReq.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can update settings'
      });
    }

    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        error: 'Value is required'
      });
    }

    const result = await pool.query(
      `UPDATE settings 
       SET value = $1, updated_at = NOW(), updated_by = $2 
       WHERE key = $3 
       RETURNING key, value, description, updated_at`,
      [value, authReq.user.userId, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update setting'
    });
  }
});

// Helper function to get setting value with fallback to ENV
export async function getSetting(key: string, envFallback?: string): Promise<string> {
  try {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    if (result.rows.length > 0) {
      return result.rows[0].value;
    }
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
  }
  
  // Fallback to environment variable
  return envFallback || '';
}

export default router;
