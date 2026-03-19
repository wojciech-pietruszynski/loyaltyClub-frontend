import { useState, useCallback } from 'react';
import api from '../api/client';
import type { HierarchyPromotion } from '../types';
import type { HierarchyPromotionFormState } from '../types/ui';

export function useHierarchyPromotions() {
  const [hierarchyPromotions, setHierarchyPromotions] = useState<HierarchyPromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchyPromotions = useCallback(async () => {
    try {
      const { data } = await api.get<HierarchyPromotion[]>('/hierarchy-promotions');
      setHierarchyPromotions(data);
    } catch {
      setError('Failed to fetch hierarchy promotions');
    }
  }, []);

  const saveHierarchyPromotion = useCallback(async (form: HierarchyPromotionFormState, id?: number): Promise<boolean> => {
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        country: form.country,
        hierarchy: form.hierarchy || null,
        productClass: form.productClass || null,
        subclass: form.subclass || null,
        type: form.type,
        multiplier: form.type === 'MULTIPLIER' && form.multiplier ? parseFloat(form.multiplier) : null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        enabled: form.enabled,
      };
      if (id) {
        await api.put(`/hierarchy-promotions/${id}`, payload);
      } else {
        await api.post('/hierarchy-promotions', payload);
      }
      await fetchHierarchyPromotions();
      return true;
    } catch {
      setError('Failed to save hierarchy promotion');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchHierarchyPromotions]);

  const toggleHierarchyPromotion = useCallback(async (id: number, enabled: boolean): Promise<boolean> => {
    try {
      await api.patch(`/hierarchy-promotions/${id}/status`, { enabled });
      await fetchHierarchyPromotions();
      return true;
    } catch {
      setError('Failed to toggle hierarchy promotion status');
      return false;
    }
  }, [fetchHierarchyPromotions]);

  return {
    hierarchyPromotions,
    loading,
    error,
    fetchHierarchyPromotions,
    saveHierarchyPromotion,
    toggleHierarchyPromotion,
    setError,
  };
}
