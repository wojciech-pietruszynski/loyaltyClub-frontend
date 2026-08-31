import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHierarchyPromotions } from './useHierarchyPromotions';
import api from '../api/client';
import type { TranslationKey } from '../i18n';
import { makeHierarchyPromotion } from '../test/fixtures';

vi.mock('../api/client');

const t = (key: TranslationKey) => key;

const baseForm = {
  id: null,
  name: ' Mnożnik AGD ',
  country: 'PL',
  hierarchy: ' 42 ',
  productClass: '',
  subclass: '',
  type: 'MULTIPLIER' as const,
  multiplier: '1,5',
  startsAt: '2026-09-01T00:00',
  endsAt: '',
  enabled: true,
};

describe('useHierarchyPromotions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches hierarchy promotions', async () => {
    const promotions = [makeHierarchyPromotion()];
    vi.mocked(api.get).mockResolvedValue({ data: promotions });

    const { result } = renderHook(() => useHierarchyPromotions(t));

    await act(async () => {
      await result.current.fetchHierarchyPromotions();
    });

    expect(result.current.hierarchyPromotions).toEqual(promotions);
  });

  it('converts the multiplier and turns empty texts into null', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useHierarchyPromotions(t));

    await act(async () => {
      const ok = await result.current.saveHierarchyPromotion(baseForm);
      expect(ok).toBe(true);
    });

    expect(api.post).toHaveBeenCalledWith('/hierarchy-promotions', {
      name: 'Mnożnik AGD',
      country: 'PL',
      hierarchy: '42',
      productClass: null,
      subclass: null,
      type: 'MULTIPLIER',
      multiplier: 1.5,
      startsAt: '2026-09-01T00:00',
      endsAt: null,
      enabled: true,
    });
  });

  it('drops the multiplier for the EXCLUSION type', async () => {
    vi.mocked(api.put).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useHierarchyPromotions(t));

    await act(async () => {
      await result.current.saveHierarchyPromotion({ ...baseForm, type: 'EXCLUSION' }, 5);
    });

    expect(api.put).toHaveBeenCalledWith('/hierarchy-promotions/5', expect.objectContaining({ multiplier: null }));
  });

  it('updates the status locally and rolls it back on failure', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeHierarchyPromotion({ enabled: true })] });
    vi.mocked(api.patch).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useHierarchyPromotions(t));

    await act(async () => {
      await result.current.fetchHierarchyPromotions();
    });

    await act(async () => {
      const ok = await result.current.toggleHierarchyPromotion(1, false);
      expect(ok).toBe(false);
    });

    expect(result.current.hierarchyPromotions[0].enabled).toBe(true);
    expect(result.current.error).toBe('hierarchyPromotionStatusError');
  });
});
