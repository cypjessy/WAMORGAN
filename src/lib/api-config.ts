const DEFAULT_DEPLOYED_URL = 'http://localhost:3000';

export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    !!(window as any).Capacitor?.isNativePlatform?.() ||
    (window as any).CapacitorPlatforms?.currentPlatform === 'android' ||
    (window as any).CapacitorPlatforms?.currentPlatform === 'ios' ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'http-extension:'
  );
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (isCapacitor()) {
      const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
      if (configuredUrl) return configuredUrl;
      return DEFAULT_DEPLOYED_URL;
    }
  }
  return '';
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const [pathPart, queryString] = path.split('?');
  const cleanPathPart = (pathPart.startsWith('/') ? pathPart : `/${pathPart}`).replace(/\/?$/, '/');
  const cleanPath = queryString != null ? `${cleanPathPart}?${queryString}` : cleanPathPart;
  if (!base) return cleanPath;
  return `${base.replace(/\/$/, '')}${cleanPath}`;
}

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = buildApiUrl(endpoint);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const apiGet = async (endpoint: string) => apiFetch(endpoint, { method: 'GET' });
export const apiPost = async (endpoint: string, data?: any) => apiFetch(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
export const apiPut = async (endpoint: string, data?: any) => apiFetch(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
export const apiDelete = async (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' });

export default getApiBaseUrl;
