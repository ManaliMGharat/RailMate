/**
 * RailOne Production API Client
 * Features:
 * - Environment variable resolution (VITE_API_BASE_URL or VITE_API_URL)
 * - Automatic URL normalization (trailing slash & /api suffix)
 * - Production localhost fallback guard (avoids Mixed Content / connection refused)
 * - Detailed error classification (Network, CORS, Missing URL, Timeout, Server)
 * - Render free-tier cold start handling (30s timeout with helpful alert)
 */

export class ApiError extends Error {
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isCorsError?: boolean;
  isMissingUrl?: boolean;
  isTimeout?: boolean;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      isNetworkError?: boolean;
      isCorsError?: boolean;
      isMissingUrl?: boolean;
      isTimeout?: boolean;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.isNetworkError = options?.isNetworkError;
    this.isCorsError = options?.isCorsError;
    this.isMissingUrl = options?.isMissingUrl;
    this.isTimeout = options?.isTimeout;
  }
}

export function getApiBaseUrl(): string {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ''
  ).trim();

  if (envUrl) {
    let clean = envUrl.replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
    return clean;
  }

  // Deployed production detection: if running on a remote host (e.g. *.vercel.app)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    // In production without an environment variable set, DO NOT silently fall back to localhost
    return '';
  }

  // Local development default
  return 'http://localhost:8000/api';
}

export const API_BASE = getApiBaseUrl();

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBaseUrl();

  if (!base) {
    throw new ApiError(
      'API Base URL is not configured. Please set the VITE_API_BASE_URL environment variable in your Vercel project settings (e.g. https://railone-backend.onrender.com/api) and redeploy.',
      { isMissingUrl: true, code: 'MISSING_API_URL' }
    );
  }

  const token =
    localStorage.getItem('railone_token') ||
    localStorage.getItem('railmate_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${cleanEndpoint}`;

  // 30-second timeout to handle free-tier cloud container cold-starts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. The backend server might be waking up from sleep (Render free tier spin-up can take 30-50s). Please retry in a few moments.',
        { isTimeout: true, code: 'TIMEOUT' }
      );
    }

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isTargetHttp = base.startsWith('http://');

    let msg = 'Unable to connect to backend server. Please verify your backend service is running and accessible.';
    if (isHttps && isTargetHttp) {
      msg = 'Mixed Content Error: This HTTPS website cannot send requests to an insecure HTTP backend. Please use an HTTPS backend URL (e.g. https://...).';
    }

    throw new ApiError(msg, {
      isNetworkError: true,
      isCorsError: true,
      code: 'NETWORK_ERROR',
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    let errorCode = 'API_ERROR';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.detail || errorMsg;
      if (errorData.error_code) errorCode = errorData.error_code;
    } catch {
      // JSON parse failed
    }

    if (response.status === 401) {
      // Clear expired credentials
      localStorage.removeItem('railone_token');
      localStorage.removeItem('railmate_token');
    }

    throw new ApiError(errorMsg, {
      status: response.status,
      code: errorCode,
    });
  }

  return response.json();
}
