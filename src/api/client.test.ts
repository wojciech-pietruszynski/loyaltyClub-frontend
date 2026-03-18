import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isAuthenticated, logout, getAuthRole, getExpiresAt } from './client';

describe('api/client auth logic', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should return not authenticated when localStorage is empty', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('should be authenticated when valid token and future expiresAt exists', () => {
    localStorage.setItem('auth_token', 'fake-token');
    localStorage.setItem('auth_expires_at', String(Date.now() + 10000));
    expect(isAuthenticated()).toBe(true);
  });

  it('should not be authenticated when token expired', () => {
    localStorage.setItem('auth_token', 'fake-token');
    localStorage.setItem('auth_expires_at', String(Date.now() - 10000));
    expect(isAuthenticated()).toBe(false);
  });

  it('should clear localStorage on logout', () => {
    localStorage.setItem('auth_token', 'fake-token');
    localStorage.setItem('auth_role', 'ADMIN');
    
    logout();
    
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_role')).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('should return correct role and expiresAt', () => {
    localStorage.setItem('auth_role', 'TECHNICAL');
    localStorage.setItem('auth_expires_at', '123456789');
    
    expect(getAuthRole()).toBe('TECHNICAL');
    expect(getExpiresAt()).toBe(123456789);
  });
});
