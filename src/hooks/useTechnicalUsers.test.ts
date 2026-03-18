import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTechnicalUsers } from './useTechnicalUsers';
import api from '../api/client';

vi.mock('../api/client');

describe('useTechnicalUsers hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches technical users successfully', async () => {
    const mockUsers = [{ id: 1, username: 'tech1' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockUsers });

    const { result } = renderHook(() => useTechnicalUsers());
    
    await act(async () => {
      await result.current.fetchTechnicalUsers();
    });

    expect(result.current.technicalUsers).toEqual(mockUsers);
  });

  it('creates technical user', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTechnicalUsers());
    
    await act(async () => {
      const success = await result.current.createTechnicalUser({ username: 'newtech' } as any);
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalled();
  });

  it('updates technical user password', async () => {
    vi.mocked(api.patch).mockResolvedValue({});

    const { result } = renderHook(() => useTechnicalUsers());
    
    await act(async () => {
      const success = await result.current.updatePassword(1, 'newpass');
      expect(success).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith('/technical-users/1/password', { password: 'newpass' });
  });
});
