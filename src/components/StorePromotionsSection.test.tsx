import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorePromotionsSection } from './StorePromotionsSection';
import { renderWithApp } from '../test/harness';
import { makeStorePromotion } from '../test/fixtures';

const promotions = [makeStorePromotion({ id: 1, name: 'Promo 1', pointsPerCurrency: 4 })];

describe('StorePromotionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches promotions on entering the route', () => {
    const { context } = renderWithApp(<StorePromotionsSection />, { promotions: { storePromotions: promotions } });
    expect(context.data.promotions.ensurePromotions).toHaveBeenCalled();
  });

  it('lists promotions in the browse dialog', () => {
    renderWithApp(<StorePromotionsSection />, { promotions: { storePromotions: promotions } });
    fireEvent.click(screen.getByText('promotionBrowseTileTitle'));

    expect(screen.getByText('promotionListTitle')).toBeInTheDocument();
    expect(screen.getByText('Promo 1')).toBeInTheDocument();
  });

  it('toggles the promotion status', async () => {
    const { context } = renderWithApp(<StorePromotionsSection />, { promotions: { storePromotions: promotions } });
    fireEvent.click(screen.getByText('promotionBrowseTileTitle'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Promo 1' }));

    await waitFor(() => expect(context.data.promotions.togglePromotion).toHaveBeenCalledWith(1, false));
  });

  it('rejects a promotion form without a name and a conversion rate', () => {
    const { context } = renderWithApp(<StorePromotionsSection />);
    fireEvent.click(screen.getByText('promotionCreateTileTitle'));
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(context.data.promotions.savePromotion).not.toHaveBeenCalled();
    expect(screen.getAllByText('validationRequired').length).toBeGreaterThan(0);
  });
});
