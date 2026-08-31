import type { Dispatch, SetStateAction } from 'react';
import type { Language, TranslationKey } from '../i18n';

export type Tab = 'customers' | 'add-points' | 'coupons' | 'promotions' | 'reports' | 'tools';
export type CustomerModalTab = 'profile' | 'balance' | 'issue-coupon' | 'coupon-history';
export type Theme = 'light' | 'dark';

export type Translator = (key: TranslationKey, params?: Record<string, string | number>) => string;

export type PurchaseHistoryPoint = {
  date: string;
  total: number;
};

export type PurchaseHistorySeries = {
  points: PurchaseHistoryPoint[];
  maxTotal: number;
};

export type PromotionFormState = {
  id: number | null;
  name: string;
  country: string;
  pointsPerCurrency: string;
  startsAt: string;
  endsAt: string;
  enabled: boolean;
};

export type HierarchyPromotionFormState = {
  id: number | null;
  name: string;
  country: string;
  hierarchy: string;
  productClass: string;
  subclass: string;
  type: 'MULTIPLIER' | 'EXCLUSION';
  multiplier: string;
  startsAt: string;
  endsAt: string;
  enabled: boolean;
};

export type TechnicalUserFormState = {
  username: string;
  password: string;
  country: string;
  enabled: boolean;
};

export type NewCustomerFormState = {
  firstName: string;
  lastName: string;
  email: string;
  customerNumber: string;
  phoneNumber: string;
  country: string;
  referrerCustomerNumber: string;
};

export type NewPointsFormState = {
  customerId: string;
  // Wszystkie pola liczbowe formularzy są łańcuchami znaków; konwersja następuje
  // na granicy wysyłki (src/lib/numbers.ts), nie w deserializatorze backendu.
  points: string;
  description: string;
};

export type CouponFormState = {
  customerId: string;
  couponTemplateId: string;
  reason: string;
};

export type CouponTemplateFormState = {
  couponValue: string;
  minimumPurchaseValue: string;
  requiredPoints: string;
  country: string;
  validityDays: string;
  couponPrefix: string;
};

export type CustomerEditFormState = {
  firstName: string;
  lastName: string;
  email: string;
  customerNumber: string;
  phoneNumber: string;
  country: string;
};

export type CustomerCouponFormState = {
  couponTemplateId: string;
  reason: string;
};

export type StateSetter<T> = Dispatch<SetStateAction<T>>;

export const localeByLanguage: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-US',
  de: 'de-DE',
};
