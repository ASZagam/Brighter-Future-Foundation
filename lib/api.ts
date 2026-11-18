/**
 * Fetch utility that automatically handles JWT token refresh
 */

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
  });

  // If unauthorized and it's not the refresh endpoint, try to refresh token
  if (response.status === 401 && !url.includes('/auth/refresh')) {
    try {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Retry original request with new token
        response = await fetch(url, {
          ...options,
          credentials: 'include',
        });
      } else {
        // Refresh failed, likely need to re-login
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      window.location.href = '/auth/login';
    }
  }

  return response;
}

function formatApiError(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatApiError).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([field, detail]) => {
        const message = formatApiError(detail);
        return message ? `${field}: ${message}` : '';
      })
      .filter(Boolean)
      .join('; ');
  }
  return '';
}

/**
 * Make an authenticated API call to Django backend
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api/backend${endpoint}`;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetchWithAuth(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: unknown = await response.json().catch(() => ({}));
    const message = error && typeof error === 'object'
      ? formatApiError(Reflect.get(error, 'detail') ?? Reflect.get(error, 'error')) || `API call failed: ${response.status}`
      : `API call failed: ${response.status}`;
    const apiError = new Error(message) as Error & { status?: number };
    apiError.status = response.status;
    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Type-safe API GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

/**
 * Type-safe API POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Type-safe API PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Type-safe API PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Type-safe API DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}
