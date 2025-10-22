import { pool } from './client';
import fs from 'fs';
import path from 'path';

export async function initDatabase() {
  try {
    console.log('🔍 Checking database initialization...');
    
    // Check if settings table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📦 Database not initialized, running schema...');
      
      // Read and execute schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await pool.query(schema);
      
      console.log('✅ Database initialized successfully');
    } else {
      console.log('✅ Database already initialized');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}
