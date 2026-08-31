import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePromotions } from './usePromotions';
import api from '../api/client';
import type { TranslationKey } from '../i18n';
import { makeStorePromotion } from '../test/fixtures';

vi.mock('../api/client');

const t = (key: TranslationKey) => key;

describe('usePromotions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches promotions', async () => {
    const promotions = [makeStorePromotion()];
    vi.mocked(api.get).mockResolvedValue({ data: promotions });

    const { result } = renderHook(() => usePromotions(t));

    await act(async () => {
      await result.current.fetchPromotions();
    });

    expect(result.current.storePromotions).toEqual(promotions);
    expect(api.get).toHaveBeenCalledWith('/store-promotions');
  });

  it('fetches the configuration dictionaries', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/config/countries') return Promise.resolve({ data: ['PL', 'DE'] });
      if (url === '/config/coupon-prefixes') return Promise.resolve({ data: ['KUPPL'] });
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => usePromotions(t));

    await act(async () => {
      await result.current.fetchMetadata();
    });

    expect(result.current.availableCountries).toEqual(['PL', 'DE']);
    expect(result.current.availableCouponPrefixes).toEqual(['KUPPL']);
  });

  it('converts the conversion rate to a number before sending', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => usePromotions(t));

    await act(async () => {
      const success = await result.current.savePromotion({
        id: null,
        name: ' Promocja ',
        country: 'PL',
        pointsPerCurrency: '2.5',
        startsAt: '2026-09-01T00:00',
        endsAt: '',
        enabled: true,
      });
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalledWith('/store-promotions', {
      name: 'Promocja',
      country: 'PL',
      pointsPerCurrency: 2.5,
      startsAt: '2026-09-01T00:00',
      endsAt: null,
      enabled: true,
    });
  });

  it('updates the status locally without refetching the collection', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeStorePromotion({ enabled: true })] });
    vi.mocked(api.patch).mockResolvedValue({});

    const { result } = renderHook(() => usePromotions(t));

    await act(async () => {
      await result.current.fetchPromotions();
    });

    vi.mocked(api.get).mockClear();

    await act(async () => {
      const success = await result.current.togglePromotion(1, false);
      expect(success).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith('/store-promotions/1/status', { enabled: false });
    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.storePromotions[0].enabled).toBe(false);
  });

  it('rolls the status back when the request fails', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeStorePromotion({ enabled: true })] });
    vi.mocked(api.patch).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => usePromotions(t));

    await act(async () => {
      await result.current.fetchPromotions();
    });

    await act(async () => {
      const success = await result.current.togglePromotion(1, false);
      expect(success).toBe(false);
    });

    expect(result.current.storePromotions[0].enabled).toBe(true);
    expect(result.current.error).toBe('promotionStatusUpdateError');
  });
});
