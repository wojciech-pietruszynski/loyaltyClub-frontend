import { useCallback, useState } from 'react';
import api from '../api/client';
import { isHierarchyPromotion, parseList } from '../api/schema';
import type { HierarchyPromotion } from '../types';
import type { HierarchyPromotionFormState, StateSetter, Translator } from '../types/ui';
import { toNumberOrNull, toTextOrNull } from '../lib/numbers';
import { useApiErrorMessage } from './useApiError';
import { useEnsure } from './useEnsure';

export type HierarchyPromotionsApi = {
  hierarchyPromotions: HierarchyPromotion[];
  loading: boolean;
  error: string | null;
  fetchHierarchyPromotions: () => Promise<void>;
  ensureHierarchyPromotions: () => Promise<void>;
  saveHierarchyPromotion: (form: HierarchyPromotionFormState, id?: number) => Promise<boolean>;
  toggleHierarchyPromotion: (id: number, enabled: boolean) => Promise<boolean>;
  setError: StateSetter<string | null>;
};

export function useHierarchyPromotions(t: Translator): HierarchyPromotionsApi {
  const [hierarchyPromotions, setHierarchyPromotions] = useState<HierarchyPromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const fetchHierarchyPromotions = useCallback(async () => {
    try {
      const { data } = await api.get<unknown>('/hierarchy-promotions');
      setHierarchyPromotions(parseList('/hierarchy-promotions', data, isHierarchyPromotion));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchHierarchyPromotionsError'));
    }
  }, [toMessage]);

  const saveHierarchyPromotion = useCallback(async (form: HierarchyPromotionFormState, id?: number) => {
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        country: form.country,
        hierarchy: toTextOrNull(form.hierarchy),
        productClass: toTextOrNull(form.productClass),
        subclass: toTextOrNull(form.subclass),
        type: form.type,
        multiplier: form.type === 'MULTIPLIER' ? toNumberOrNull(form.multiplier) : null,
        startsAt: toTextOrNull(form.startsAt),
        endsAt: toTextOrNull(form.endsAt),
        enabled: form.enabled,
      };
      if (id) {
        await api.put(`/hierarchy-promotions/${id}`, payload);
      } else {
        await api.post('/hierarchy-promotions', payload);
      }
      await fetchHierarchyPromotions();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'hierarchyPromotionSaveError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchHierarchyPromotions, toMessage]);

  /** Aktualizacja optymistyczna z wycofaniem — jak w `usePromotions`. */
  const toggleHierarchyPromotion = useCallback(async (id: number, enabled: boolean) => {
    const applyLocally = (value: boolean) => {
      setHierarchyPromotions((previous) => previous.map(
        (promotion) => (promotion.id === id ? { ...promotion, enabled: value } : promotion),
      ));
    };

    applyLocally(enabled);
    try {
      await api.patch(`/hierarchy-promotions/${id}/status`, { enabled });
      setError(null);
      return true;
    } catch (err: unknown) {
      applyLocally(!enabled);
      setError(toMessage(err, 'hierarchyPromotionStatusError'));
      return false;
    }
  }, [toMessage]);

  // Pobranie odroczone: wołane przy wejściu na trasę, wykonuje się raz.
  const ensureHierarchyPromotions = useEnsure(fetchHierarchyPromotions);

  return {
    hierarchyPromotions,
    loading,
    error,
    fetchHierarchyPromotions,
    ensureHierarchyPromotions,
    saveHierarchyPromotion,
    toggleHierarchyPromotion,
    setError,
  };
}
