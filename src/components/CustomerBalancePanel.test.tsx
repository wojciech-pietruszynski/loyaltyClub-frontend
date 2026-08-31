import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CustomerBalancePanel } from './CustomerBalancePanel';
import { renderWithApp } from '../test/harness';
import { makeCustomer, makeTransaction } from '../test/fixtures';

const customer = makeCustomer({ loyaltyPoints: 150 });
const transactions = [makeTransaction({ description: 'Test' })];
const history = { points: [{ date: '2026-03-18', total: 10 }], maxTotal: 10 };

describe('CustomerBalancePanel', () => {
  it('renders the balance and the transaction history', () => {
    renderWithApp(<CustomerBalancePanel customer={customer} history={history} transactions={transactions} />);
    expect(screen.getByText(/currentBalance/)).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText('transactionHistoryTitle')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows the empty message when there is no purchase history', () => {
    renderWithApp(<CustomerBalancePanel customer={customer} history={{ points: [], maxTotal: 0 }} transactions={[]} />);
    expect(screen.getAllByText('noPurchaseHistory').length).toBeGreaterThan(0);
  });

  it('formats dates using the locale of the chosen language', () => {
    renderWithApp(<CustomerBalancePanel customer={customer} history={history} transactions={transactions} />);
    // pl-PL, dateStyle: 'medium' — kolejność dzień/miesiąc/rok, nie amerykańska.
    expect(screen.getByText(/18 mar 2026/)).toBeInTheDocument();
  });
});
