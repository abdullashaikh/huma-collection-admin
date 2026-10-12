const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api/v1';

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('huma_admin_refresh_token');
  if (!refreshToken) return null;

  try {
    const url = `${API_BASE}/auth/admin/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data?.data?.accessToken) {
      const newAccessToken = data.data.accessToken;
      localStorage.setItem('huma_admin_token', newAccessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('huma_admin_refresh_token', data.data.refreshToken);
      }
      return newAccessToken;
    }
  } catch {
    // Network or server error during refresh
  }

  return null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = localStorage.getItem('huma_admin_token');

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 token expiration with silent refresh
  if (response.status === 401 && !endpoint.includes('/auth/admin/login') && !endpoint.includes('/auth/admin/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptTokenRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    } else {
      localStorage.removeItem('huma_admin_token');
      localStorage.removeItem('huma_admin_refresh_token');
      localStorage.removeItem('huma_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('huma_admin_token');
      localStorage.removeItem('huma_admin_refresh_token');
      localStorage.removeItem('huma_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data?.error?.code);
  }

  return data?.data !== undefined ? data.data : data;
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  postFormData: <T = any>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, { method: 'POST', body: formData }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  putFormData: <T = any>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: formData }),
  patch: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
