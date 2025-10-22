import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://apkmanager:apkmanager@postgres:5432/apkmanager';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
  process.exit(-1);
});

export default pool;
