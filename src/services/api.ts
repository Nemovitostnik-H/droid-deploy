import { appConfig } from "@/config/app.config";

const API_BASE = appConfig.api.baseUrl;

export interface ApkFile {
  id: number;
  name: string;
  package_name: string;
  version: string;
  version_code: number;
  build?: string;
  file_path: string;
  file_size: number;
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
    const response = await fetchWithAuth(`${API_BASE}/apk/scan`, {
      method: 'POST',
    });
    // Backend returns data.total, data.added, data.skipped
    return {
      success: response.success,
      scanned: response.data.total,
      added: response.data.added,
      skipped: response.data.skipped
    };
  },

  // List all APKs
  list: async (): Promise<{ success: boolean; apks: ApkFile[] }> => {
    const response = await fetchWithAuth(`${API_BASE}/apk/list`);
    // Backend returns data array
    return {
      success: response.success,
      apks: response.data
    };
  },

  // Get APK metadata
  metadata: async (id: number): Promise<{ success: boolean; apk: ApkFile }> => {
    const response = await fetchWithAuth(`${API_BASE}/apk/metadata/${id}`);
    return {
      success: response.success,
      apk: response.data
    };
  },

  // Upload APK file
  upload: async (file: File): Promise<{ success: boolean; apk: any }> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('apk', file);

    const response = await fetch(`${API_BASE}/apk/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Authentication required");
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload APK');
    }

    return {
      success: true,
      apk: data.data
    };
  },
};

// Publication endpoints
export const publicationApi = {
  // Create new publication
  create: async (apkId: number, platform: string): Promise<{ success: boolean; publication: Publication }> => {
    const response = await fetchWithAuth(`${API_BASE}/publications/create`, {
      method: 'POST',
      body: JSON.stringify({ apk_id: apkId, platform }),
    });
    return {
      success: response.success,
      publication: response.data
    };
  },

  // List all publications
  list: async (): Promise<{ success: boolean; publications: Publication[] }> => {
    const response = await fetchWithAuth(`${API_BASE}/publications/list`);
    return {
      success: response.success,
      publications: response.data
    };
  },

  // Get publication status
  status: async (id: number): Promise<{ success: boolean; publication: Publication }> => {
    const response = await fetchWithAuth(`${API_BASE}/publications/${id}/status`);
    return {
      success: response.success,
      publication: response.data
    };
  },
};
