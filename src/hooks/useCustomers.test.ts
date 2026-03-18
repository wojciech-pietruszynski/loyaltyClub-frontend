import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCustomers } from './useCustomers';
import api from '../api/client';

vi.mock('../api/client');

describe('useCustomers hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useCustomers());
    expect(result.current.customers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches customers successfully', async () => {
    const mockCustomers = [{ id: '1', firstName: 'Jan' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockCustomers });

    const { result } = renderHook(() => useCustomers());
    
    act(() => {
      void result.current.fetchCustomers();
    });

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.customers).toEqual(mockCustomers);
    expect(api.get).toHaveBeenCalledWith('/customers');
  });

  it('handles fetch error', async () => {
    vi.mocked(api.get).mockRejectedValue({
      response: { data: { detail: 'Error message' } }
    });

    const { result } = renderHook(() => useCustomers());
    
    await act(async () => {
      await result.current.fetchCustomers();
    });

    expect(result.current.error).toBe('Error message');
    expect(result.current.customers).toEqual([]);
  });

  it('adds customer and refetches', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: '1' }] });

    const { result } = renderHook(() => useCustomers());
    
    await act(async () => {
      const success = await result.current.addCustomer({ firstName: 'Jan' } as any);
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalled();
    expect(api.get).toHaveBeenCalled(); // Should refetch
  });
});
