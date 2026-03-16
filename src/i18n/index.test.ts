import { describe, expect, it } from 'vitest';
import { translate } from './index';

describe('translate', () => {
  it('returns localized value for known key', () => {
    expect(translate('pl', 'tabStorePromotions')).toBe('Promocje punktowe');
  });

  it('replaces interpolation params', () => {
    expect(translate('en', 'couponGeneratedSuccess', { code: 'ABC123' })).toBe('Coupon generated: ABC123');
  });
});
