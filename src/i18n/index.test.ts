import { describe, expect, it } from 'vitest';
import { translate, translatePlural } from './index';
import type { TranslationKey } from './types';
import { createFormatters } from './format';

/** Klucz spoza słownika — bez `any`, zgodnie z regułami projektu. */
const missingKey = 'completelyMissingKey' as TranslationKey;

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
    expect(translate('en', 'apiConnectionError', { details: 'Timeout' })).toBe('API connection error: Timeout');
  });

  it('returns the key itself if missing in all dictionaries', () => {
    expect(translate('en', missingKey)).toBe('completelyMissingKey');
  });

  it('handles numeric parameters', () => {
    expect(translate('en', 'importCustomersSuccess', { count: 5 })).toBe('Imported 5 customers.');
  });
});

describe('translatePlural', () => {
  it('uses the three Polish plural forms', () => {
    expect(translatePlural('pl', 'customersFound', 1)).toBe('1 klient');
    expect(translatePlural('pl', 'customersFound', 3)).toBe('3 klienci');
    expect(translatePlural('pl', 'customersFound', 12)).toBe('12 klientów');
  });

  it('uses the two English forms', () => {
    expect(translatePlural('en', 'customersFound', 1)).toBe('1 customer');
    expect(translatePlural('en', 'customersFound', 3)).toBe('3 customers');
  });

  it('interpolates the count into the German form', () => {
    expect(translatePlural('de', 'couponsFound', 5)).toBe('5 Gutscheine');
  });
});

describe('createFormatters', () => {
  it('formats a date according to the language, not the browser settings', () => {
    expect(createFormatters('pl').formatDate('2026-03-18T10:00:00')).toBe('18 mar 2026');
    expect(createFormatters('en').formatDate('2026-03-18T10:00:00')).toBe('Mar 18, 2026');
  });

  it('formats currency using the country of the record', () => {
    const formatted = createFormatters('pl').formatCurrency(1234.5, 'PL');
    expect(formatted).toContain('1');
    expect(formatted).toContain('zł');
  });

  it('falls back to a plain number for a country outside the map', () => {
    expect(createFormatters('en').formatCurrency(10, 'ZZ')).toBe('10.00');
  });

  it('returns a placeholder for missing values', () => {
    expect(createFormatters('pl').formatDateTime(null)).toBe('-');
    expect(createFormatters('pl').formatNumber(null)).toBe('-');
  });
});
