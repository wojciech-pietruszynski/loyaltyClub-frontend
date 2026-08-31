import { useCallback, useState } from 'react';
import api from '../api/client';
import { isStorePromotion, isStringArray, parseList, parseObject } from '../api/schema';
import type { StorePromotion } from '../types';
import type { PromotionFormState, StateSetter, Translator } from '../types/ui';
import { toNumber, toTextOrNull } from '../lib/numbers';
import { useApiErrorMessage } from './useApiError';
import { useEnsure } from './useEnsure';

export type PromotionsApi = {
  storePromotions: StorePromotion[];
  availableCountries: string[];
  availableCouponPrefixes: string[];
  loading: boolean;
  error: string | null;
  fetchPromotions: () => Promise<void>;
  ensurePromotions: () => Promise<void>;
  fetchMetadata: () => Promise<void>;
  ensureMetadata: () => Promise<void>;
  savePromotion: (form: PromotionFormState, id?: number) => Promise<boolean>;
  togglePromotion: (id: number, enabled: boolean) => Promise<boolean>;
  setError: StateSetter<string | null>;
};

export function usePromotions(t: Translator): PromotionsApi {
  const [storePromotions, setStorePromotions] = useState<StorePromotion[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCouponPrefixes, setAvailableCouponPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const fetchPromotions = useCallback(async () => {
    try {
      const { data } = await api.get<unknown>('/store-promotions');
      setStorePromotions(parseList('/store-promotions', data, isStorePromotion));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchPromotionsError'));
    }
  }, [toMessage]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [countries, prefixes] = await Promise.all([
        api.get<unknown>('/config/countries'),
        api.get<unknown>('/config/coupon-prefixes'),
      ]);
      setAvailableCountries(parseObject('/config/countries', countries.data, isStringArray));
      setAvailableCouponPrefixes(parseObject('/config/coupon-prefixes', prefixes.data, isStringArray));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchMetadataError'));
    }
  }, [toMessage]);

  // `pointsPerCurrency` jest w formularzu łańcuchem znaków — konwersja następuje
  // na granicy wysyłki, a nie w deserializatorze backendu.
  const savePromotion = useCallback(async (form: PromotionFormState, id?: number) => {
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        country: form.country,
        pointsPerCurrency: toNumber(form.pointsPerCurrency),
        startsAt: toTextOrNull(form.startsAt),
        endsAt: toTextOrNull(form.endsAt),
        enabled: form.enabled,
      };
      if (id) {
        await api.put(`/store-promotions/${id}`, payload);
      } else {
        await api.post('/store-promotions', payload);
      }
      await fetchPromotions();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'promotionSaveError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPromotions, toMessage]);

  /**
   * Aktualizacja optymistyczna: przełącznik odpowiada natychmiast, a stan wraca
   * do poprzedniej wartości, jeśli żądanie się nie powiedzie. Zamiast pobierania
   * całej kolekcji po każdej zmianie flagi.
   */
  const togglePromotion = useCallback(async (id: number, enabled: boolean) => {
    const applyLocally = (value: boolean) => {
      setStorePromotions((previous) => previous.map(
        (promotion) => (promotion.id === id ? { ...promotion, enabled: value } : promotion),
      ));
    };

    applyLocally(enabled);
    try {
      await api.patch(`/store-promotions/${id}/status`, { enabled });
      setError(null);
      return true;
    } catch (err: unknown) {
      applyLocally(!enabled);
      setError(toMessage(err, 'promotionStatusUpdateError'));
      return false;
    }
  }, [toMessage]);

  // Pobranie odroczone: wołane przy wejściu na trasę, wykonuje się raz.
  const ensurePromotions = useEnsure(fetchPromotions);
  const ensureMetadata = useEnsure(fetchMetadata);

  return {
    storePromotions,
    availableCountries,
    availableCouponPrefixes,
    loading,
    error,
    fetchPromotions,
    ensurePromotions,
    fetchMetadata,
    ensureMetadata,
    savePromotion,
    togglePromotion,
    setError,
  };
}
