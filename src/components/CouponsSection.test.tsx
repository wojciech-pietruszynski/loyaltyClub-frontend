import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CouponsSection } from './CouponsSection';

describe('CouponsSection Component', () => {
  const mockProps = {
    t: (key: string) => key,
    setCouponDialog: vi.fn(),
    setCouponDialogError: vi.fn(),
    closeCouponDialog: vi.fn(),
    couponDialog: null,
    couponDialogError: null,
    handleIssueCoupon: vi.fn(),
    couponForm: { customerId: '', couponTemplateId: '', reason: 'POINTS_EXCHANGE' as const },
    setCouponForm: vi.fn(),
    customers: [{ id: '1', firstName: 'Jan', lastName: 'Kowalski', customerNumber: 'C1', country: 'PL', loyaltyPoints: 100 } as any],
    couponTemplates: [{ id: 't1', couponValue: 10, requiredPoints: 100, country: 'PL', couponPrefix: 'KUP', minimumPurchaseValue: 50, validityDays: 30 } as any],
    handleCreateCouponTemplate: vi.fn(),
    couponTemplateForm: { couponValue: '', minimumPurchaseValue: '', requiredPoints: '', country: '', validityDays: '', couponPrefix: '' },
    setCouponTemplateForm: vi.fn(),
    availableCountries: ['PL', 'EN'],
    availableCouponPrefixes: ['KUP'],
    couponCodeSearch: '',
    setCouponCodeSearch: vi.fn(),
    couponSortBy: 'reason' as const,
    setCouponSortBy: vi.fn(),
    couponSortValue: 'ALL',
    setCouponSortValue: vi.fn(),
    couponSortValues: ['POINTS_EXCHANGE', 'COMPLAINT'],
    filteredCoupons: [
      { id: '1', couponCode: 'ABC123', status: 'ACTIVE', reason: 'POINTS_EXCHANGE', issuedAt: '2026-03-18', expiresAt: '2026-06-18', customerName: 'Jan Kowalski', couponValue: 10, country: 'PL', minimumPurchaseValue: 50 } as any
    ],
    reasonLabel: (r: string) => r,
    statusLabel: (s: string) => s,
    formatDateTime: (s?: string) => s || '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders coupon management tiles', () => {
    render(<CouponsSection {...mockProps} />);
    expect(screen.getByText('createCouponTileTitle')).toBeInTheDocument();
  });

  it('renders browse view when dialog is set to browse', () => {
    render(<CouponsSection {...mockProps} couponDialog="browse" />);
    expect(screen.getByText('browseCouponsTitle')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });
});
