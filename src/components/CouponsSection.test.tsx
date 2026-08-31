import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CouponsSection } from './CouponsSection';
import { renderWithApp } from '../test/harness';
import { makeCoupon, makeCouponTemplate, makeCustomer } from '../test/fixtures';

const coupons = [
  makeCoupon({ id: 1, couponCode: 'ABC123', reason: 'POINTS_EXCHANGE', status: 'ACTIVE', country: 'PL' }),
  makeCoupon({ id: 2, couponCode: 'XYZ789', reason: 'COMPLAINT', status: 'USED', country: 'DE' }),
];

function renderSection() {
  return renderWithApp(<CouponsSection />, {
    coupons: { coupons, couponTemplates: [makeCouponTemplate()] },
    customers: { customers: [makeCustomer()] },
  });
}

function openBrowseDialog() {
  fireEvent.click(screen.getByText('browseCouponsTileTitle'));
}

describe('CouponsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders coupon management tiles', () => {
    renderSection();
    expect(screen.getByText('createCouponTileTitle')).toBeInTheDocument();
    expect(screen.getByText('browseCouponsTileTitle')).toBeInTheDocument();
  });

  it('opens the browse dialog with every coupon', () => {
    renderSection();
    openBrowseDialog();
    expect(screen.getByText('browseCouponsTitle')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
  });

  it('narrows the list to the chosen filter value', () => {
    renderSection();
    openBrowseDialog();

    fireEvent.change(screen.getByLabelText('filterBy'), { target: { value: 'status' } });
    fireEvent.change(screen.getByLabelText('value'), { target: { value: 'USED' } });

    expect(screen.queryByText('ABC123')).not.toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
  });

  it('narrows the list to the searched code', () => {
    renderSection();
    openBrowseDialog();

    fireEvent.change(screen.getByLabelText('searchByCode'), { target: { value: 'abc' } });

    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.queryByText('XYZ789')).not.toBeInTheDocument();
  });

  it('shows the empty-result message when no coupon matches', () => {
    renderSection();
    openBrowseDialog();

    fireEvent.change(screen.getByLabelText('searchByCode'), { target: { value: 'nie-ma-takiego' } });

    expect(screen.getByText('noCouponsForFilters')).toBeInTheDocument();
  });

  it('restores the full list after clearing the filters', () => {
    renderSection();
    openBrowseDialog();

    fireEvent.change(screen.getByLabelText('searchByCode'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('clearFilters'));

    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
  });

  it('blocks issuing a coupon when the form is incomplete', () => {
    const { context } = renderSection();
    fireEvent.click(screen.getByText('createCouponTileTitle'));
    fireEvent.click(screen.getByRole('button', { name: 'generateCoupon' }));

    expect(context.data.coupons.issueCoupon).not.toHaveBeenCalled();
    expect(screen.getAllByText('validationRequired').length).toBeGreaterThan(0);
  });
});
