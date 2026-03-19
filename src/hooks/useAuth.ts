import { useState, useCallback, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, isAuthenticated, getAuthRole, getAuthCountry, getExpiresAt, type AuthRole } from '../api/client';

export function useAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => isAuthenticated());
  const [authRole, setAuthRole] = useState<AuthRole | null>(() => getAuthRole());
  const [authCountry, setAuthCountry] = useState<string | null>(() => getAuthCountry());
  const [expiresAt, setExpiresAt] = useState<number>(() => getExpiresAt());
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    try {
      await apiLogin(username, password);
      setLoggedIn(true);
      setAuthRole(getAuthRole());
      setAuthCountry(getAuthCountry());
      setExpiresAt(getExpiresAt());
      setAuthError(null);
      return true;
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Login failed');
      return false;
    }
  }, []);

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
