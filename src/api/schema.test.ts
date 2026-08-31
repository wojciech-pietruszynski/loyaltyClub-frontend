import { describe, it, expect } from 'vitest';
import {
  ResponseShapeError,
  isCoupon,
  isCustomer,
  isStringArray,
  parseList,
  parseObject,
} from './schema';
import { makeCoupon, makeCustomer } from '../test/fixtures';

describe('walidacja kształtu odpowiedzi', () => {
  it('accepts a record matching the declared type', () => {
    expect(isCustomer(makeCustomer())).toBe(true);
    expect(isCoupon(makeCoupon())).toBe(true);
  });

  it('rejects a record with a field of the wrong type', () => {
    expect(isCustomer({ ...makeCustomer(), id: '1' })).toBe(false);
    expect(isCustomer({ ...makeCustomer(), loyaltyPoints: '120' })).toBe(false);
  });

  it('rejects a record with a missing field', () => {
    const withoutEmail: Record<string, unknown> = { ...makeCustomer() };
    delete withoutEmail.email;
    expect(isCustomer(withoutEmail)).toBe(false);
  });

  it('accepts nullable fields as null', () => {
    expect(isCustomer({ ...makeCustomer(), referralCode: null, loyaltyTierCode: null })).toBe(true);
  });

  it('rejects a value outside the allowed union', () => {
    expect(isCoupon({ ...makeCoupon(), status: 'NIEZNANY' })).toBe(false);
  });

  it('throws ResponseShapeError for a list with a bad element', () => {
    expect(() => parseList('/customers', [makeCustomer(), { id: 2 }], isCustomer)).toThrow(ResponseShapeError);
  });

  it('throws ResponseShapeError when an object arrives instead of a list', () => {
    expect(() => parseList('/customers', makeCustomer(), isCustomer)).toThrow(ResponseShapeError);
  });

  it('returns the value unchanged for a correct list', () => {
    const customers = [makeCustomer()];
    expect(parseList('/customers', customers, isCustomer)).toEqual(customers);
  });

  it('validates the string arrays of the configuration dictionaries', () => {
    expect(parseObject('/config/countries', ['PL', 'DE'], isStringArray)).toEqual(['PL', 'DE']);
    expect(() => parseObject('/config/countries', ['PL', 7], isStringArray)).toThrow(ResponseShapeError);
  });

  it('names the endpoint in the error message', () => {
    expect(() => parseList('/coupons', [{}], isCoupon)).toThrow(/\/coupons/);
  });
});
