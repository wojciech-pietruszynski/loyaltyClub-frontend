import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CustomerBalancePanel } from './CustomerBalancePanel';

describe('CustomerBalancePanel Component', () => {
  const mockProps = {
    selectedCustomer: {
      id: 1,
      firstName: 'Jan',
      lastName: 'Kowalski',
      loyaltyPoints: 150,
    } as any,
    purchaseHistorySeries: {
      points: [{ date: '2026-03-18', total: 10 }],
      maxTotal: 10
    },
    customerTransactions: [
      { id: 1, points: 50, amount: 100, description: 'Test', country: 'PL', type: 'SALE', state: 'AVAILABLE', timestamp: '2026-03-18T10:00:00' } as any
    ],
    formatDate: (s?: string) => s || '',
    formatDateTime: (s?: string) => s || '',
    t: (key: string) => key,
  };

  it('renders balance and transaction history', () => {
    render(<CustomerBalancePanel {...mockProps} />);
    expect(screen.getByText(/currentBalance/)).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText('transactionHistoryTitle')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows no history message when points are empty', () => {
    render(<CustomerBalancePanel {...mockProps} purchaseHistorySeries={{ points: [], maxTotal: 0 }} />);
    expect(screen.getByText('noPurchaseHistory')).toBeInTheDocument();
  });
});
