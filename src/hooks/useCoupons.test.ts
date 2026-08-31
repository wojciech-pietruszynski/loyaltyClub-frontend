import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCoupons } from './useCoupons';
import api from '../api/client';
import type { TranslationKey } from '../i18n';
import { makeCoupon, makeCouponTemplate } from '../test/fixtures';

vi.mock('../api/client');

const t = (key: TranslationKey) => key;

describe('useCoupons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches coupons and templates', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/coupons') return Promise.resolve({ data: [makeCoupon()] });
      if (url === '/coupon-templates') return Promise.resolve({ data: [makeCouponTemplate()] });
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCoupons(t));

    await act(async () => {
      await result.current.fetchCoupons();
      await result.current.fetchTemplates();
    });

    expect(result.current.coupons).toHaveLength(1);
    expect(result.current.couponTemplates).toHaveLength(1);
  });

  it('converts identifiers to numbers when issuing a coupon', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCoupons(t));

    await act(async () => {
      const success = await result.current.issueCoupon({ customerId: '1', couponTemplateId: '7', reason: 'POINTS_EXCHANGE' });
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalledWith('/coupons/issue', {
      customerId: 1,
      couponTemplateId: 7,
      reason: 'POINTS_EXCHANGE',
    });
  });

  it('converts the template fields to numbers before sending', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCoupons(t));

    await act(async () => {
      await result.current.createTemplate({
        couponValue: '25.50',
        minimumPurchaseValue: '100',
        requiredPoints: '500',
        country: 'PL',
        validityDays: '30',
        couponPrefix: 'KUPPL',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/coupon-templates', {
      couponValue: 25.5,
      minimumPurchaseValue: 100,
      requiredPoints: 500,
      country: 'PL',
      validityDays: 30,
      couponPrefix: 'KUPPL',
    });
  });

  it('reports a translated message when issuing fails', async () => {
    vi.mocked(api.post).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useCoupons(t));

    await act(async () => {
      const success = await result.current.issueCoupon({ customerId: '1', couponTemplateId: '7', reason: 'COMPLAINT' });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('issueCouponError');
  });
});
