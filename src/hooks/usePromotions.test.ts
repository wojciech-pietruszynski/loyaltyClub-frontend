import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePromotions } from './usePromotions';
import api from '../api/client';

vi.mock('../api/client');

describe('usePromotions hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches promotions successfully', async () => {
    const mockPromos = [{ id: 1, name: 'P1' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockPromos });

    const { result } = renderHook(() => usePromotions());
    
    await act(async () => {
      await result.current.fetchPromotions();
    });

    expect(result.current.storePromotions).toEqual(mockPromos);
    expect(api.get).toHaveBeenCalledWith('/store-promotions');
  });

  it('fetches metadata successfully', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/countries') return Promise.resolve({ data: ['PL', 'EN'] });
      if (url === '/coupon-prefixes') return Promise.resolve({ data: ['ABC'] });
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePromotions());
    
    await act(async () => {
      await result.current.fetchMetadata();
    });

    expect(result.current.availableCountries).toEqual(['PL', 'EN']);
    expect(result.current.availableCouponPrefixes).toEqual(['ABC']);
  });

  it('saves promotion successfully', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => usePromotions());
    
    await act(async () => {
      const success = await result.current.savePromotion({ name: 'P1' } as any);
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalled();
  });

  it('toggles promotion status', async () => {
    vi.mocked(api.patch).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => usePromotions());
    
    await act(async () => {
      const success = await result.current.togglePromotion(1, true);
      expect(success).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith('/store-promotions/1/status', { enabled: true });
  });
});
