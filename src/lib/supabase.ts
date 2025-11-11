import { createClient } from '@supabase/supabase-js';

// Runtime ENV injection support
declare global {
  interface Window {
    __ENV__?: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    };
  }
}

// Try runtime ENV first (Docker), fallback to build-time ENV (dev)
const supabaseUrl = window.__ENV__?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = window.__ENV__?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Types for database tables
export type AppRole = 'admin' | 'publisher' | 'developer' | 'viewer';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface ApkFile {
  id: string;
  name: string;
  package_name: string;
  version: string;
  version_code: number;
  build: string | null;
  storage_path: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Publication {
  id: string;
  apk_id: string;
  platform: 'development' | 'release-candidate' | 'production';
  published_by: string | null;
  status: 'pending' | 'publishing' | 'completed' | 'failed';
  error_message: string | null;
  target_path: string | null;
  created_at: string;
  completed_at: string | null;
  apk?: ApkFile;
}

export interface AppSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}
