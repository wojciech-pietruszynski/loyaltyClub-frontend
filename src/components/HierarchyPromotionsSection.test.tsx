import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HierarchyPromotionsSection } from './HierarchyPromotionsSection';
import { renderWithApp } from '../test/harness';
import { makeHierarchyPromotion } from '../test/fixtures';

const promotions = [makeHierarchyPromotion({ id: 1, name: 'Mnożnik AGD', multiplier: 1.5 })];

describe('HierarchyPromotionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the promotions on entering the route', () => {
    const { context } = renderWithApp(<HierarchyPromotionsSection />);
    expect(context.data.hierarchyPromotions.ensureHierarchyPromotions).toHaveBeenCalled();
  });

  it('lists the promotions in the browse dialog', () => {
    renderWithApp(<HierarchyPromotionsSection />, { hierarchyPromotions: { hierarchyPromotions: promotions } });
    fireEvent.click(screen.getByText('hierarchyPromotionBrowseTileTitle'));

    expect(screen.getByText('hierarchyPromotionListTitle')).toBeInTheDocument();
    expect(screen.getByText('Mnożnik AGD')).toBeInTheDocument();
  });

  it('toggles the promotion status', async () => {
    const { context } = renderWithApp(<HierarchyPromotionsSection />, {
      hierarchyPromotions: { hierarchyPromotions: promotions },
    });
    fireEvent.click(screen.getByText('hierarchyPromotionBrowseTileTitle'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mnożnik AGD' }));

    await waitFor(() => expect(context.data.hierarchyPromotions.toggleHierarchyPromotion).toHaveBeenCalledWith(1, false));
  });

  it('shows the multiplier field only for the MULTIPLIER type', () => {
    renderWithApp(<HierarchyPromotionsSection />);
    fireEvent.click(screen.getByText('hierarchyPromotionCreateTileTitle'));

    expect(screen.getByLabelText('multiplier')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('hierarchyPromotionType'), { target: { value: 'EXCLUSION' } });

    expect(screen.queryByLabelText('multiplier')).not.toBeInTheDocument();
  });

  it('blocks a save with no name and no start date', () => {
    const { context } = renderWithApp(<HierarchyPromotionsSection />);
    fireEvent.click(screen.getByText('hierarchyPromotionCreateTileTitle'));
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(context.data.hierarchyPromotions.saveHierarchyPromotion).not.toHaveBeenCalled();
    expect(screen.getAllByText('validationRequired').length).toBeGreaterThan(0);
  });
});
