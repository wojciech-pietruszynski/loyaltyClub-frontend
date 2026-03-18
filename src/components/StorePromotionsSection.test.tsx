import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorePromotionsSection } from './StorePromotionsSection';

describe('StorePromotionsSection Component', () => {
  const mockProps = {
    t: (key: string) => key,
    availableCountries: ['PL', 'EN'],
    promotionView: 'list' as any,
    setPromotionView: vi.fn(),
    resetPromotionForm: vi.fn(),
    closePromotionModal: vi.fn(),
    promotionForm: { id: null, name: '', country: '', pointsPerCurrency: 1, startsAt: '', endsAt: '', enabled: true } as any,
    setPromotionForm: vi.fn(),
    handleSavePromotion: vi.fn(async (e) => e.preventDefault()),
    promotionSaving: false,
    storePromotions: [
      { id: 1, name: 'Promo 1', country: 'PL', pointsPerCurrency: 4, startsAt: '2026-03-18', enabled: true } as any
    ],
    handleEditPromotion: vi.fn(),
    handleTogglePromotionStatus: vi.fn(),
    formatDateTime: (s?: string) => s || '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders promotions list when view is browse', () => {
    render(<StorePromotionsSection {...mockProps} promotionView="browse" />);
    expect(screen.getByText('promotionListTitle')).toBeInTheDocument();
    expect(screen.getByText('Promo 1')).toBeInTheDocument();
  });

  it('switches to browse view when tile is clicked', () => {
    render(<StorePromotionsSection {...mockProps} promotionView={null} />);
    const browseBtn = screen.getByText('promotionBrowseTileTitle');
    fireEvent.click(browseBtn);
    expect(mockProps.setPromotionView).toHaveBeenCalledWith('browse');
  });

  it('calls handleTogglePromotionStatus when checkbox is toggled', () => {
    render(<StorePromotionsSection {...mockProps} promotionView="browse" />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(mockProps.handleTogglePromotionStatus).toHaveBeenCalled();
  });
});
