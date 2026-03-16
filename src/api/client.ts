import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'auth_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const ROLE_KEY = 'auth_role';
const COUNTRY_KEY = 'auth_country';

export type AuthRole = 'ADMIN' | 'TECHNICAL';

type AuthResponse = {
  token: string;
  expiresAt: number;
  role: AuthRole;
  country: string | null;
};

const authApi = axios.create({
  baseURL: '/api/admin/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<void> | null = null;

function setSession(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(EXPIRES_AT_KEY, String(auth.expiresAt));
  localStorage.setItem(ROLE_KEY, auth.role);
  if (auth.country) {
    localStorage.setItem(COUNTRY_KEY, auth.country);
  } else {
    localStorage.removeItem(COUNTRY_KEY);
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getExpiresAt(): number {
  const value = localStorage.getItem(EXPIRES_AT_KEY);
  return value ? Number(value) : 0;
}

export function isAuthenticated(): boolean {
  const token = getToken();
  const expiresAt = getExpiresAt();
  return Boolean(token) && Date.now() < expiresAt;
}

export function getAuthRole(): AuthRole | null {
  const role = localStorage.getItem(ROLE_KEY);
  return role === 'ADMIN' || role === 'TECHNICAL' ? role : null;
}

export function getAuthCountry(): string | null {
  return localStorage.getItem(COUNTRY_KEY);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(COUNTRY_KEY);
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await authApi.post<AuthResponse>('/login', { username, password });
  setSession(data);
  return data;
}

async function refreshToken(): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Missing token');
  }

  const { data } = await authApi.post<AuthResponse>(
    '/refresh',
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setSession(data);
}

async function ensureFreshSession(): Promise<void> {
  if (!isAuthenticated()) {
    logout();
    throw new Error('Session expired');
  }

  if (!refreshPromise) {
    refreshPromise = refreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.url && !config.url.startsWith('/auth/')) {
      await ensureFreshSession();
    }

    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;
