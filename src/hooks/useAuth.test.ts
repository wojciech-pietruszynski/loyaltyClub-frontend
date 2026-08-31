import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import * as api from '../api/client';
import type { TranslationKey } from '../i18n';

vi.mock('../api/client', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: vi.fn(),
  getAuthRole: vi.fn(),
  getAuthCountry: vi.fn(),
  getExpiresAt: vi.fn(),
}));

const t = (key: TranslationKey) => key;

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts from the state kept in the session storage', () => {
    vi.mocked(api.isAuthenticated).mockReturnValue(true);
    vi.mocked(api.getAuthRole).mockReturnValue('ADMIN');
    vi.mocked(api.getAuthCountry).mockReturnValue('PL');

    const { result } = renderHook(() => useAuth(t));

    expect(result.current.loggedIn).toBe(true);
    expect(result.current.authRole).toBe('ADMIN');
    expect(result.current.authCountry).toBe('PL');
  });

  it('shows the message from the backend when logging in fails', async () => {
    vi.mocked(api.isAuthenticated).mockReturnValue(false);
    vi.mocked(api.login).mockRejectedValue({ response: { data: { detail: 'Invalid creds' } } });

    const { result } = renderHook(() => useAuth(t));

    await act(async () => {
      const success = await result.current.login('wrong', 'wrong');
      expect(success).toBe(false);
    });

    expect(result.current.authError).toBe('Invalid creds');
    expect(result.current.loggedIn).toBe(false);
  });

  it('falls back to a translated message when the backend gives no detail', async () => {
    vi.mocked(api.isAuthenticated).mockReturnValue(false);
    vi.mocked(api.login).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useAuth(t));

    await act(async () => {
      await result.current.login('wrong', 'wrong');
    });

    expect(result.current.authError).toBe('loginFailed');
  });
});
