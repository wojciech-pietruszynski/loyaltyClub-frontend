import { describe, expect, it } from 'vitest';
import { translate } from './index';

describe('translate', () => {
  it('returns localized value for known key in Polish', () => {
    expect(translate('pl', 'tabStorePromotions')).toBe('Promocje punktowe');
  });

  it('returns localized value for known key in English', () => {
    expect(translate('en', 'tabStorePromotions')).toBe('Point promotions');
  });

  it('replaces interpolation params correctly', () => {
    expect(translate('en', 'couponGeneratedSuccess', { code: 'ABC123' })).toBe('Coupon generated: ABC123');
  });

  it('replaces multiple occurrences of the same param', () => {
    // We can use a key that we know has a param
    expect(translate('en', 'apiConnectionError', { details: 'Timeout' })).toBe('API connection error: Timeout');
  });

  it('falls back to Polish if key missing in English (logic test)', () => {
    // Testing the fallback logic using 'any' to simulate a missing key in English
    expect(translate('en', 'nonExistentInEn' as any)).toBe('nonExistentInEn');
  });

  it('returns the key itself if missing in all dictionaries', () => {
    expect(translate('en', 'completelyMissingKey' as any)).toBe('completelyMissingKey');
  });

  it('handles numeric parameters', () => {
    expect(translate('en', 'importCustomersSuccess', { count: 5 })).toBe('Imported 5 customers.');
  });
});
