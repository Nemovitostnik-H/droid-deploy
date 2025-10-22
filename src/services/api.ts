import { appConfig } from "@/config/app.config";

const API_BASE = appConfig.api.baseUrl;

export interface ApkFile {
  id: number;
  package_name: string;
  version_name: string;
  version_code: number;
  file_name: string;
  file_path: string;
  file_size: number;
  min_sdk_version?: number;
  target_sdk_version?: number;
  created_at: string;
  exists?: boolean;
}

export interface Publication {
  id: number;
  apk_id: number;
  platform: 'development' | 'release_candidate' | 'production';
  status: 'pending' | 'published' | 'failed';
  requested_by: number;
  requested_by_name?: string;
  requested_at: string;
  published_at?: string;
  error_message?: string;
  apk_name?: string;
  version?: string;
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

// Generic fetch wrapper with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Authentication required");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// APK endpoints
export const apkApi = {
  // Scan APK directory
  scan: async (): Promise<{ success: boolean; scanned: number; added: number; skipped: number }> => {
    return fetchWithAuth(`${API_BASE}/apk/scan`, {
      method: 'POST',
    });
  },

  // List all APKs
  list: async (): Promise<{ success: boolean; apks: ApkFile[] }> => {
    return fetchWithAuth(`${API_BASE}/apk/list`);
  },

  // Get APK metadata
  metadata: async (id: number): Promise<{ success: boolean; apk: ApkFile }> => {
    return fetchWithAuth(`${API_BASE}/apk/metadata/${id}`);
  },
};

// Publication endpoints
export const publicationApi = {
  // Create new publication
  create: async (apkId: number, platform: string): Promise<{ success: boolean; publication: Publication }> => {
    return fetchWithAuth(`${API_BASE}/publications/create`, {
      method: 'POST',
      body: JSON.stringify({ apk_id: apkId, platform }),
    });
  },

  // List all publications
  list: async (): Promise<{ success: boolean; publications: Publication[] }> => {
    return fetchWithAuth(`${API_BASE}/publications/list`);
  },

  // Get publication status
  status: async (id: number): Promise<{ success: boolean; publication: Publication }> => {
    return fetchWithAuth(`${API_BASE}/publications/${id}/status`);
  },
};
