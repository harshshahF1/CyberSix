/**
 * InventoryTrack FastAPI client.
 * Set VITE_API_BASE_URL in frontend/.env to the backend origin.
 * The existing UI currently runs in demo/localStorage mode; use this client
 * when wiring a screen to the persistent API.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\\/$/, '');
const TOKEN_KEY = 'inventorytrack_access_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch { /* response was not JSON */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function loginWithApi(email: string, password: string): Promise<ApiUser> {
  const result = await apiRequest<{access_token: string; user: ApiUser}>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(result.access_token);
  return result.user;
}

export async function logoutFromApi(): Promise<void> {
  try { await apiRequest('/api/auth/logout', { method: 'POST' }); }
  finally { setAccessToken(null); }
}
