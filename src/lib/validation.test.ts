import { describe, it, expect } from 'vitest';
import {
  dateRangeRule,
  emailRule,
  hasErrors,
  nonNegativeNumberRule,
  phoneRule,
  positiveNumberRule,
  requiredText,
  validateCouponTemplate,
  validateHierarchyPromotion,
  validateNewCustomer,
  validateTechnicalUser,
} from './validation';

describe('reguły pojedynczych pól', () => {
  it('requires a non-blank value', () => {
    expect(requiredText('   ')?.key).toBe('validationRequired');
    expect(requiredText('Jan')).toBeNull();
  });

  it('checks the e-mail format', () => {
    expect(emailRule('jan@example.com')).toBeNull();
    expect(emailRule('jan(at)example')?.key).toBe('validationEmail');
  });

  it('checks the phone format', () => {
    expect(phoneRule('+48 600 100 200')).toBeNull();
    expect(phoneRule('abc')?.key).toBe('validationPhone');
  });

  it('requires a number greater than zero', () => {
    expect(positiveNumberRule('2.5')).toBeNull();
    expect(positiveNumberRule('0')?.key).toBe('validationPositive');
    expect(positiveNumberRule('-1')?.key).toBe('validationPositive');
    expect(positiveNumberRule('abc')?.key).toBe('validationNumber');
  });

  it('requires a whole number when asked for one', () => {
    expect(positiveNumberRule('2.5', { integer: true })?.key).toBe('validationInteger');
    expect(positiveNumberRule('3', { integer: true })).toBeNull();
  });

  it('allows zero where a non-negative value is enough', () => {
    expect(nonNegativeNumberRule('0')).toBeNull();
    expect(nonNegativeNumberRule('-0.01')?.key).toBe('validationNonNegative');
  });

  it('rejects an end date earlier than the start date', () => {
    expect(dateRangeRule('2026-09-01T10:00', '2026-08-01T10:00')?.key).toBe('validationEndBeforeStart');
    expect(dateRangeRule('2026-08-01T10:00', '2026-09-01T10:00')).toBeNull();
    expect(dateRangeRule('2026-08-01T10:00', '')).toBeNull();
  });
});

describe('walidacja formularzy', () => {
  it('reports every empty field of the new-customer form', () => {
    const errors = validateNewCustomer({
      firstName: '', lastName: '', email: '', customerNumber: '', phoneNumber: '', country: '', referrerCustomerNumber: '',
    });
    expect(hasErrors(errors)).toBe(true);
    expect(Object.keys(errors)).toHaveLength(6);
  });

  it('accepts a complete new-customer form', () => {
    const errors = validateNewCustomer({
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@example.com',
      customerNumber: 'C-001',
      phoneNumber: '600100200',
      country: 'PL',
      referrerCustomerNumber: '',
    });
    expect(hasErrors(errors)).toBe(false);
  });

  it('requires a multiplier only for the MULTIPLIER type', () => {
    const base = {
      id: null, name: 'Promocja', country: 'PL', hierarchy: '', productClass: '', subclass: '',
      multiplier: '', startsAt: '2026-09-01T10:00', endsAt: '', enabled: true,
    };
    expect(validateHierarchyPromotion({ ...base, type: 'MULTIPLIER' }).multiplier?.key).toBe('validationRequired');
    expect(validateHierarchyPromotion({ ...base, type: 'EXCLUSION' }).multiplier).toBeUndefined();
  });

  it('requires a password of at least eight characters', () => {
    expect(validateTechnicalUser({ username: 'tech', password: 'krotkie', country: 'PL', enabled: true }).password?.key)
      .toBe('validationMinLength');
    expect(validateTechnicalUser({ username: 'tech', password: 'dostatecznie-dlugie', country: 'PL', enabled: true }).password)
      .toBeUndefined();
  });

  it('accepts zero as the minimum purchase value of a template', () => {
    const errors = validateCouponTemplate({
      couponValue: '50',
      minimumPurchaseValue: '0',
      requiredPoints: '100',
      country: 'PL',
      validityDays: '30',
      couponPrefix: 'KUPPL',
    });
    expect(hasErrors(errors)).toBe(false);
  });
});
