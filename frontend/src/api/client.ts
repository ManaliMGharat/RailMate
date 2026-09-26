/**
 * RailOne Production API Client
 *
 * Features:
 * - VITE_API_BASE_URL / VITE_API_URL support
 * - Automatic /api normalization
 * - Production localhost protection
 * - JWT Authorization support
 * - Network / CORS / timeout / server error handling
 * - Does NOT automatically delete the user's token on a 401
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

/**
 * Get API base URL.
 */
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

  /**
   * Production safety:
   * Never silently call localhost from a deployed website.
   */
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return '';
  }

  /**
   * Local development.
   */
  return 'http://localhost:8000/api';
}

export const API_BASE = getApiBaseUrl();

/**
 * Get the currently stored authentication token.
 */
function getAuthToken(): string | null {
  return (
    localStorage.getItem('railone_token') ||
    localStorage.getItem('railmate_token')
  );
}

/**
 * API request helper.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBaseUrl();

  if (!base) {
    throw new ApiError(
      'API Base URL is not configured. Please set VITE_API_BASE_URL in the frontend environment variables.',
      {
        isMissingUrl: true,
        code: 'MISSING_API_URL',
      }
    );
  }

  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  /**
   * Preserve headers supplied by the caller.
   */
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  /**
   * Attach JWT when available (if caller did not specify an explicit Authorization header).
   */
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = `${base}${cleanEndpoint}`;

  console.log('[API]', options.method || 'GET', url);

  if (token) {
    console.log('[API] Authorization token attached');
  } else {
    console.log('[API] No authentication token available');
  }

  /**
   * Render free-tier backend can take time to wake up.
   */
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. The backend server may be waking up from Render sleep. Please try again.',
        {
          isTimeout: true,
          code: 'TIMEOUT',
        }
      );
    }

    const isHttps =
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:';

    const isTargetHttp = base.startsWith('http://');

    let message =
      'Unable to connect to backend server. Please verify that the backend service is running and accessible.';

    if (isHttps && isTargetHttp) {
      message =
        'Mixed Content Error: the HTTPS website cannot connect to an HTTP backend. Please use an HTTPS backend URL.';
    }

    throw new ApiError(message, {
      isNetworkError: true,
      isCorsError: true,
      code: 'NETWORK_ERROR',
    });
  } finally {
    clearTimeout(timeoutId);
  }

  /**
   * Handle HTTP errors.
   */
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let errorCode = 'API_ERROR';

    try {
      const errorData = await response.json();

      errorMessage =
        errorData?.message ||
        errorData?.detail ||
        errorMessage;

      if (errorData?.error_code) {
        errorCode = errorData.error_code;
      }
    } catch {
      // Response was not valid JSON.
    }

    /**
     * IMPORTANT:
     *
     * Do NOT automatically delete the token here.
     *
     * A protected endpoint such as /notifications can return
     * 401 when the user is not logged in. Removing the token
     * automatically can log the user out unexpectedly.
     */
    if (response.status === 401) {
      console.warn(
        '[API] 401 Unauthorized:',
        url,
        'Authentication may be required for this endpoint.'
      );
    }

    throw new ApiError(errorMessage, {
      status: response.status,
      code: errorCode,
    });
  }

  /**
   * Handle empty responses.
   */
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return (undefined as unknown) as T;
  }

  return response.json();
}