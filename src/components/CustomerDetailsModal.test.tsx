import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { renderWithApp } from '../test/harness';
import { makeCoupon, makeCouponTemplate, makeCustomer, makeTransaction } from '../test/fixtures';

const customer = makeCustomer({ id: 4, firstName: 'Jan', lastName: 'Kowalski', customerNumber: 'C-004' });

function renderModal(overrides = {}) {
  return renderWithApp(<CustomerDetailsModal customer={customer} onClose={vi.fn()} />, {
    customers: {
      fetchTransactions: vi.fn(() => Promise.resolve([makeTransaction({ description: 'Zakup A' })])),
      fetchCoupons: vi.fn(() => Promise.resolve([makeCoupon({ couponCode: 'KUP-1' })])),
      fetchPurchaseHistory: vi.fn(() => Promise.resolve({ points: [{ date: '2026-08-01', total: 30 }], maxTotal: 30 })),
    },
    coupons: { couponTemplates: [makeCouponTemplate({ id: 9, country: 'PL' })] },
    ...overrides,
  });
}

describe('CustomerDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the customer identity in the dialog header', async () => {
    renderModal();
    expect(await screen.findByText('Jan Kowalski (C-004)')).toBeInTheDocument();
  });

  it('fills the edit form from the chosen customer', async () => {
    renderModal();
    expect(await screen.findByLabelText('firstName')).toHaveValue('Jan');
    expect(screen.getByLabelText('customerNumber')).toHaveValue('C-004');
  });

  it('blocks a save with an invalid e-mail', async () => {
    const { context } = renderModal();

    fireEvent.change(await screen.findByLabelText('email'), { target: { value: 'zly-adres' } });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(context.data.customers.updateCustomer).not.toHaveBeenCalled();
    expect(screen.getByText('validationEmail')).toBeInTheDocument();
  });

  it('saves a valid form through the hook', async () => {
    const { context } = renderModal();

    fireEvent.click(await screen.findByRole('button', { name: 'save' }));

    await waitFor(() => expect(context.data.customers.updateCustomer).toHaveBeenCalledWith(4, expect.objectContaining({
      firstName: 'Jan',
      customerNumber: 'C-004',
    })));
  });

  it('shows the point history on the balance tab', async () => {
    renderModal();

    fireEvent.click(await screen.findByText('customerModalTabBalance'));

    expect(await screen.findByText('Zakup A')).toBeInTheDocument();
    expect(screen.getByText('transactionHistoryTitle')).toBeInTheDocument();
  });

  it('lists the coupons of the customer', async () => {
    renderModal();

    fireEvent.click(await screen.findByText('customerModalTabCouponHistory'));

    expect(await screen.findByText('KUP-1')).toBeInTheDocument();
  });

  it('offers only the templates of the customer country', async () => {
    renderModal({ coupons: { couponTemplates: [makeCouponTemplate({ id: 9, country: 'PL' }), makeCouponTemplate({ id: 10, country: 'DE' })] } });

    fireEvent.click(await screen.findByText('customerModalTabCreateCoupon'));

    const options = screen.getByLabelText('couponTemplate').querySelectorAll('option');
    // pusta opcja + jeden szablon z kraju klienta
    expect(options).toHaveLength(2);
  });
});
