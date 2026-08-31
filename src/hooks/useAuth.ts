import { useCallback, useEffect, useState } from 'react';
import {
  getAuthCountry,
  getAuthRole,
  getExpiresAt,
  isAuthenticated,
  login as apiLogin,
  logout as apiLogout,
  type AuthRole,
} from '../api/client';
import type { StateSetter, Translator } from '../types/ui';
import { useApiErrorMessage } from './useApiError';

export type AuthApi = {
  loggedIn: boolean;
  authRole: AuthRole | null;
  authCountry: string | null;
  expiresAt: number;
  authError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setAuthError: StateSetter<string | null>;
};

export function useAuth(t: Translator): AuthApi {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => isAuthenticated());
  const [authRole, setAuthRole] = useState<AuthRole | null>(() => getAuthRole());
  const [authCountry, setAuthCountry] = useState<string | null>(() => getAuthCountry());
  const [expiresAt, setExpiresAt] = useState<number>(() => getExpiresAt());
  const [authError, setAuthError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const login = useCallback(async (username: string, password: string) => {
    try {
      await apiLogin(username, password);
      setLoggedIn(true);
      setAuthRole(getAuthRole());
      setAuthCountry(getAuthCountry());
      setExpiresAt(getExpiresAt());
      setAuthError(null);
      return true;
    } catch (err: unknown) {
      setAuthError(toMessage(err, 'loginFailed'));
      return false;
    }
  }, [toMessage]);

  const logout = useCallback(() => {
    apiLogout();
    setLoggedIn(false);
    setAuthRole(null);
    setAuthCountry(null);
    setExpiresAt(0);
  }, []);

  // Timer tylko do wylogowania — bez setState co sekundę, żeby nie re-renderować App
  useEffect(() => {
    if (!loggedIn) return;
    const timer = setInterval(() => {
      if (getExpiresAt() - Date.now() <= 0) {
        logout();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [loggedIn, logout]);

  return {
    loggedIn,
    authRole,
    authCountry,
    expiresAt,
    authError,
    login,
    logout,
    setAuthError,
  };
}
