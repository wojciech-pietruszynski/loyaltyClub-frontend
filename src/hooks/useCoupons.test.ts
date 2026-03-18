import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCoupons } from './useCoupons';
import api from '../api/client';

vi.mock('../api/client');

describe('useCoupons hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches coupons and templates', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/coupons') return Promise.resolve({ data: [{ id: 'c1' }] });
      if (url === '/coupon-templates') return Promise.resolve({ data: [{ id: 't1' }] });
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useCoupons());
    
    await act(async () => {
      await result.current.fetchCoupons();
      await result.current.fetchTemplates();
    });

    expect(result.current.coupons).toHaveLength(1);
    expect(result.current.couponTemplates).toHaveLength(1);
  });

  it('issues a coupon successfully', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCoupons());
    
    await act(async () => {
      const success = await result.current.issueCoupon({ customerId: '1', couponTemplateId: 't1', reason: 'POINTS_EXCHANGE' });
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalledWith('/coupons/issue', expect.anything());
  });
});
