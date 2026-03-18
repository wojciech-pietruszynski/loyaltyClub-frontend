import { useState, useCallback, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, isAuthenticated, getAuthRole, getAuthCountry, getExpiresAt, type AuthRole } from '../api/client';

export function useAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => isAuthenticated());
  const [authRole, setAuthRole] = useState<AuthRole | null>(() => getAuthRole());
  const [authCountry, setAuthCountry] = useState<string | null>(() => getAuthCountry());
  const [sessionLeftMs, setSessionLeftMs] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    try {
      await apiLogin(username, password);
      setLoggedIn(true);
      setAuthRole(getAuthRole());
      setAuthCountry(getAuthCountry());
      setAuthError(null);
      return true;
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Login failed');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setLoggedIn(false);
    setAuthRole(null);
    setAuthCountry(null);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    const timer = setInterval(() => {
      const left = getExpiresAt() - Date.now();
      setSessionLeftMs(Math.max(0, left));
      if (left <= 0) {
        logout();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [loggedIn, logout]);

  return {
    loggedIn,
    authRole,
    authCountry,
    sessionLeftMs,
    authError,
    login,
    logout,
    setAuthError,
  };
}
