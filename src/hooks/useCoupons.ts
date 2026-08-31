import { useCallback, useState } from 'react';
import api from '../api/client';
import { isCoupon, isCouponTemplate, parseList } from '../api/schema';
import type { Coupon, CouponTemplate } from '../types';
import type { CouponFormState, CouponTemplateFormState, StateSetter, Translator } from '../types/ui';
import { toInteger, toNumber } from '../lib/numbers';
import { useApiErrorMessage } from './useApiError';
import { useEnsure } from './useEnsure';

export type CouponsApi = {
  coupons: Coupon[];
  couponTemplates: CouponTemplate[];
  loading: boolean;
  error: string | null;
  fetchCoupons: () => Promise<void>;
  ensureCoupons: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  ensureTemplates: () => Promise<void>;
  issueCoupon: (form: CouponFormState) => Promise<boolean>;
  createTemplate: (form: CouponTemplateFormState) => Promise<boolean>;
  setCoupons: StateSetter<Coupon[]>;
  setCouponTemplates: StateSetter<CouponTemplate[]>;
  setError: StateSetter<string | null>;
};

export function useCoupons(t: Translator): CouponsApi {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponTemplates, setCouponTemplates] = useState<CouponTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const fetchCoupons = useCallback(async () => {
    try {
      const { data } = await api.get<unknown>('/coupons');
      setCoupons(parseList('/coupons', data, isCoupon));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchCouponsError'));
    }
  }, [toMessage]);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get<unknown>('/coupon-templates');
      setCouponTemplates(parseList('/coupon-templates', data, isCouponTemplate));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchCouponTemplatesError'));
    }
  }, [toMessage]);

  // Identyfikatory z pól `<select>` są łańcuchami — konwersja przy wysyłce.
  const issueCoupon = useCallback(async (form: CouponFormState) => {
    setLoading(true);
    try {
      await api.post('/coupons/issue', {
        customerId: toInteger(form.customerId),
        couponTemplateId: toInteger(form.couponTemplateId),
        reason: form.reason,
      });
      await fetchCoupons();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'issueCouponError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCoupons, toMessage]);

  const createTemplate = useCallback(async (form: CouponTemplateFormState) => {
    setLoading(true);
    try {
      await api.post('/coupon-templates', {
        couponValue: toNumber(form.couponValue),
        minimumPurchaseValue: toNumber(form.minimumPurchaseValue),
        requiredPoints: toInteger(form.requiredPoints),
        country: form.country,
        validityDays: toInteger(form.validityDays),
        couponPrefix: form.couponPrefix,
      });
      await fetchTemplates();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'couponTemplateSaveError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates, toMessage]);

  // Pobranie odroczone: wołane przy wejściu na trasę, wykonuje się raz.
  const ensureCoupons = useEnsure(fetchCoupons);
  const ensureTemplates = useEnsure(fetchTemplates);

  return {
    coupons,
    couponTemplates,
    loading,
    error,
    fetchCoupons,
    ensureCoupons,
    fetchTemplates,
    ensureTemplates,
    issueCoupon,
    createTemplate,
    setCoupons,
    setCouponTemplates,
    setError,
  };
}
