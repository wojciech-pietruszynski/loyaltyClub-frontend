import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTechnicalUsers } from './useTechnicalUsers';
import api from '../api/client';
import type { TranslationKey } from '../i18n';
import { makeTechnicalUser } from '../test/fixtures';

vi.mock('../api/client');

const t = (key: TranslationKey) => key;

describe('useTechnicalUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches technical accounts', async () => {
    const users = [makeTechnicalUser()];
    vi.mocked(api.get).mockResolvedValue({ data: users });

    const { result } = renderHook(() => useTechnicalUsers(t));

    await act(async () => {
      await result.current.fetchTechnicalUsers();
    });

    expect(result.current.technicalUsers).toEqual(users);
  });

  it('creates a technical account', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTechnicalUsers(t));

    await act(async () => {
      const success = await result.current.createTechnicalUser({ username: ' tech-de ', password: 'tajne123', country: 'DE', enabled: true });
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalledWith('/technical-users', {
      username: 'tech-de',
      password: 'tajne123',
      country: 'DE',
      enabled: true,
    });
  });

  it('updates the password', async () => {
    vi.mocked(api.patch).mockResolvedValue({});

    const { result } = renderHook(() => useTechnicalUsers(t));

    await act(async () => {
      const success = await result.current.updatePassword(1, 'noweHaslo1');
      expect(success).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith('/technical-users/1/password', { password: 'noweHaslo1' });
  });

  it('reports a translated message when the password update fails', async () => {
    vi.mocked(api.patch).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useTechnicalUsers(t));

    await act(async () => {
      const success = await result.current.updatePassword(1, 'noweHaslo1');
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('technicalUserPasswordUpdateError');
  });
});
