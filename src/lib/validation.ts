/**
 * Walidacja formularzy po stronie klienta.
 *
 * Do tej pory jedyną walidacją były atrybuty HTML (`required`, `type="email"`),
 * więc każdy błąd reguły biznesowej wykrywał dopiero backend. Poniższe reguły
 * skracają pętlę zwrotną — odpowiednik walidacji lokalnej, którą ma SDK w Javie.
 *
 * Walidatory zwracają klucze tłumaczeń, nie gotowe teksty: komunikat powstaje
 * dopiero w komponencie, przez `t(key, params)`.
 */

import type { TranslationKey } from '../i18n';
import type {
  CouponFormState,
  CouponTemplateFormState,
  CustomerEditFormState,
  HierarchyPromotionFormState,
  NewCustomerFormState,
  NewPointsFormState,
  PromotionFormState,
  TechnicalUserFormState,
} from '../types/ui';
import { toNumberOrNull } from './numbers';

export type FieldError = {
  key: TranslationKey;
  params?: Record<string, string | number>;
};

export type FieldErrors<T> = Partial<Record<keyof T, FieldError>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s-]{6,20}$/;

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;

const err = (key: TranslationKey, params?: Record<string, string | number>): FieldError => ({ key, params });

export function requiredText(value: string, maxLength = MAX_NAME_LENGTH): FieldError | null {
  if (value.trim() === '') return err('validationRequired');
  if (value.trim().length > maxLength) return err('validationMaxLength', { count: maxLength });
  return null;
}

export function emailRule(value: string): FieldError | null {
  const missing = requiredText(value, 254);
  if (missing) return missing;
  return EMAIL_PATTERN.test(value.trim()) ? null : err('validationEmail');
}

export function phoneRule(value: string): FieldError | null {
  const missing = requiredText(value, 20);
  if (missing) return missing;
  return PHONE_PATTERN.test(value.trim()) ? null : err('validationPhone');
}

export function positiveNumberRule(value: string, { integer = false } = {}): FieldError | null {
  if (value.trim() === '') return err('validationRequired');
  const parsed = toNumberOrNull(value);
  if (parsed === null) return err('validationNumber');
  if (integer && !Number.isInteger(parsed)) return err('validationInteger');
  return parsed > 0 ? null : err('validationPositive');
}

export function nonNegativeNumberRule(value: string): FieldError | null {
  if (value.trim() === '') return err('validationRequired');
  const parsed = toNumberOrNull(value);
  if (parsed === null) return err('validationNumber');
  return parsed >= 0 ? null : err('validationNonNegative');
}

export function dateRangeRule(startsAt: string, endsAt: string): FieldError | null {
  if (!startsAt || !endsAt) return null;
  return new Date(endsAt).getTime() >= new Date(startsAt).getTime() ? null : err('validationEndBeforeStart');
}

/** Odsiewa puste wyniki, żeby `Object.keys(errors).length` był miarodajny. */
function collect<T>(candidates: Partial<Record<keyof T, FieldError | null>>): FieldErrors<T> {
  const result: FieldErrors<T> = {};
  (Object.keys(candidates) as (keyof T)[]).forEach((field) => {
    const value = candidates[field];
    if (value) {
      result[field] = value;
    }
  });
  return result;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

export function validateNewCustomer(form: NewCustomerFormState): FieldErrors<NewCustomerFormState> {
  return collect<NewCustomerFormState>({
    firstName: requiredText(form.firstName),
    lastName: requiredText(form.lastName),
    email: emailRule(form.email),
    customerNumber: requiredText(form.customerNumber, 50),
    phoneNumber: phoneRule(form.phoneNumber),
    country: requiredText(form.country, 8),
  });
}

export function validateCustomerEdit(form: CustomerEditFormState): FieldErrors<CustomerEditFormState> {
  return collect<CustomerEditFormState>({
    firstName: requiredText(form.firstName),
    lastName: requiredText(form.lastName),
    email: emailRule(form.email),
    customerNumber: requiredText(form.customerNumber, 50),
    phoneNumber: phoneRule(form.phoneNumber),
    country: requiredText(form.country, 8),
  });
}

export function validateNewPoints(form: NewPointsFormState): FieldErrors<NewPointsFormState> {
  return collect<NewPointsFormState>({
    customerId: requiredText(form.customerId, 32),
    points: positiveNumberRule(form.points, { integer: true }),
    description: requiredText(form.description, 255),
  });
}

export function validateCouponForm(form: CouponFormState): FieldErrors<CouponFormState> {
  return collect<CouponFormState>({
    customerId: requiredText(form.customerId, 32),
    couponTemplateId: requiredText(form.couponTemplateId, 32),
    reason: requiredText(form.reason, 32),
  });
}

export function validateCouponTemplate(form: CouponTemplateFormState): FieldErrors<CouponTemplateFormState> {
  return collect<CouponTemplateFormState>({
    couponValue: positiveNumberRule(form.couponValue),
    minimumPurchaseValue: nonNegativeNumberRule(form.minimumPurchaseValue),
    requiredPoints: positiveNumberRule(form.requiredPoints, { integer: true }),
    country: requiredText(form.country, 8),
    validityDays: positiveNumberRule(form.validityDays, { integer: true }),
    couponPrefix: requiredText(form.couponPrefix, 16),
  });
}

export function validatePromotion(form: PromotionFormState): FieldErrors<PromotionFormState> {
  return collect<PromotionFormState>({
    name: requiredText(form.name),
    country: requiredText(form.country, 8),
    pointsPerCurrency: positiveNumberRule(form.pointsPerCurrency),
    startsAt: requiredText(form.startsAt, 32),
    endsAt: dateRangeRule(form.startsAt, form.endsAt),
  });
}

export function validateHierarchyPromotion(form: HierarchyPromotionFormState): FieldErrors<HierarchyPromotionFormState> {
  return collect<HierarchyPromotionFormState>({
    name: requiredText(form.name),
    country: requiredText(form.country, 8),
    startsAt: requiredText(form.startsAt, 32),
    endsAt: dateRangeRule(form.startsAt, form.endsAt),
    multiplier: form.type === 'MULTIPLIER' ? positiveNumberRule(form.multiplier) : null,
  });
}

export function validateTechnicalUser(form: TechnicalUserFormState): FieldErrors<TechnicalUserFormState> {
  const passwordTooShort = form.password.trim().length < MIN_PASSWORD_LENGTH
    ? err('validationMinLength', { count: MIN_PASSWORD_LENGTH })
    : null;

  return collect<TechnicalUserFormState>({
    username: requiredText(form.username, 50),
    password: requiredText(form.password, 72) ?? passwordTooShort,
    country: requiredText(form.country, 8),
  });
}

export function validateTechnicalPassword(password: string): FieldError | null {
  const missing = requiredText(password, 72);
  if (missing) return missing;
  return password.trim().length >= MIN_PASSWORD_LENGTH
    ? null
    : err('validationMinLength', { count: MIN_PASSWORD_LENGTH });
}
