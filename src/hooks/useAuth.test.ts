import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import * as api from '../api/client';

vi.mock('../api/client', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: vi.fn(),
  getAuthRole: vi.fn(),
  getAuthCountry: vi.fn(),
  getExpiresAt: vi.fn(),
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct auth state', () => {
    vi.mocked(api.isAuthenticated).mockReturnValue(true);
    vi.mocked(api.getAuthRole).mockReturnValue('ADMIN');
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loggedIn).toBe(true);
    expect(result.current.authRole).toBe('ADMIN');
  });

  it('handles login failure', async () => {
    vi.mocked(api.isAuthenticated).mockReturnValue(false);
    vi.mocked(api.login).mockRejectedValue({
      response: { data: { detail: 'Invalid creds' } }
    });

    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      const success = await result.current.login('wrong', 'wrong');
      expect(success).toBe(false);
    });

    expect(result.current.authError).toBe('Invalid creds');
    expect(result.current.loggedIn).toBe(false);
  });
});
