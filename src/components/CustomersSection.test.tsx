import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomersSection } from './CustomersSection';
import { renderWithApp } from '../test/harness';
import { makeCustomer } from '../test/fixtures';

const customers = [
  makeCustomer({ id: 1, firstName: 'Jan', lastName: 'Kowalski', email: 'jan@example.com', customerNumber: 'C001' }),
  makeCustomer({ id: 2, firstName: 'Anna', lastName: 'Nowak', email: 'anna@example.com', customerNumber: 'C002' }),
];

function renderSection(list = customers) {
  return renderWithApp(<CustomersSection />, { customers: { customers: list } });
}

function openBrowse() {
  fireEvent.click(screen.getByText('customersBrowseTileTitle'));
}

describe('CustomersSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders action tiles', () => {
    renderSection();
    expect(screen.getByText('customersBrowseTileTitle')).toBeInTheDocument();
    expect(screen.getByText('customersAddTileTitle')).toBeInTheDocument();
  });

  it('fetches the customer list on entering the route', () => {
    const { context } = renderSection();
    expect(context.data.customers.ensureCustomers).toHaveBeenCalled();
  });

  it('shows the customer table in the browse dialog', () => {
    renderSection();
    openBrowse();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('jan@example.com')).toBeInTheDocument();
    expect(screen.getByText('C001')).toBeInTheDocument();
  });

  it('shows the empty message when there are no customers', () => {
    renderSection([]);
    openBrowse();
    expect(screen.getByText('noCustomersInSystem')).toBeInTheDocument();
  });

  it('narrows the table to the search phrase', () => {
    renderSection();
    openBrowse();

    fireEvent.change(screen.getByLabelText('searchCustomers'), { target: { value: 'nowak' } });

    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.queryByText('Jan')).not.toBeInTheDocument();
    expect(screen.getByText('customersFound:1')).toBeInTheDocument();
  });

  it('shows the no-match message for a phrase nobody matches', () => {
    renderSection();
    openBrowse();

    fireEvent.change(screen.getByLabelText('searchCustomers'), { target: { value: 'zzz' } });

    expect(screen.getByText('noCustomersForFilters')).toBeInTheDocument();
  });

  it('paginates the list', () => {
    const many = Array.from({ length: 12 }, (_, index) => makeCustomer({
      id: index + 1,
      firstName: `Klient${index + 1}`,
      customerNumber: `C${index + 1}`,
      email: `k${index + 1}@example.com`,
    }));
    renderSection(many);
    openBrowse();

    expect(screen.getByText('Klient1')).toBeInTheDocument();
    expect(screen.queryByText('Klient11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('nextPage'));

    expect(screen.getByText('Klient11')).toBeInTheDocument();
    expect(screen.queryByText('Klient1')).not.toBeInTheDocument();
  });

  it('blocks adding a customer when the form is invalid', async () => {
    const { context } = renderSection();
    fireEvent.click(screen.getByText('customersAddTileTitle'));

    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'nie-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'addCustomer' }));

    expect(context.data.customers.addCustomer).not.toHaveBeenCalled();
    expect(await screen.findByText('validationEmail')).toBeInTheDocument();
  });
});
