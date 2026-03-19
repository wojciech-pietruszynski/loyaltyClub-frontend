import { useState, useCallback } from 'react';
import api from '../api/client';
import type { StorePromotion } from '../types';
import type { PromotionFormState } from '../types/ui';

export function usePromotions() {
  const [storePromotions, setStorePromotions] = useState<StorePromotion[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCouponPrefixes, setAvailableCouponPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      const { data } = await api.get<StorePromotion[]>('/store-promotions');
      setStorePromotions(data);
    } catch (err: any) {
      setError('Failed to fetch promotions');
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [countries, prefixes] = await Promise.all([
        api.get<string[]>('/config/countries'),
        api.get<string[]>('/config/coupon-prefixes'),
      ]);
      setAvailableCountries(countries.data);
      setAvailableCouponPrefixes(prefixes.data);
    } catch (err: any) {
      setError('Failed to fetch metadata');
    }
  }, []);

  const savePromotion = useCallback(async (form: PromotionFormState, id?: number) => {
    setLoading(true);
    try {
      if (id) {
        await api.put(`/store-promotions/${id}`, form);
      } else {
        await api.post('/store-promotions', form);
      }
      await fetchPromotions();
      return true;
    } catch (err: any) {
      setError('Failed to save promotion');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPromotions]);

  const togglePromotion = useCallback(async (id: number, enabled: boolean) => {
    try {
      await api.patch(`/store-promotions/${id}/status`, { enabled });
      await fetchPromotions();
      return true;
    } catch (err: any) {
      setError('Failed to toggle promotion status');
      return false;
    }
  }, [fetchPromotions]);

  return {
    storePromotions,
    availableCountries,
    availableCouponPrefixes,
    loading,
    error,
    fetchPromotions,
    fetchMetadata,
    savePromotion,
    togglePromotion,
    setError,
  };
}
