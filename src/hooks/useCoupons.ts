import { useState, useCallback } from 'react';
import api from '../api/client';
import type { Coupon, CouponTemplate } from '../types';
import type { CouponFormState, CouponTemplateFormState } from '../types/ui';

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponTemplates, setCouponTemplates] = useState<CouponTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    try {
      const { data } = await api.get<Coupon[]>('/coupons');
      setCoupons(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch coupons');
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get<CouponTemplate[]>('/coupon-templates');
      setCouponTemplates(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch templates');
    }
  }, []);

  const issueCoupon = useCallback(async (form: CouponFormState) => {
    setLoading(true);
    try {
      await api.post('/coupons/issue', form);
      await fetchCoupons();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to issue coupon');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCoupons]);

  const createTemplate = useCallback(async (form: CouponTemplateFormState) => {
    setLoading(true);
    try {
      await api.post('/coupon-templates', form);
      await fetchTemplates();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create template');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  return {
    coupons,
    couponTemplates,
    loading,
    error,
    fetchCoupons,
    fetchTemplates,
    issueCoupon,
    createTemplate,
    setCoupons,
    setCouponTemplates,
    setError,
  };
}
