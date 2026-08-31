import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddPointsSection } from './AddPointsSection';
import { renderWithApp } from '../test/harness';
import { makeCustomer } from '../test/fixtures';

const customers = [makeCustomer({ id: 1, firstName: 'Jan', lastName: 'Kowalski', customerNumber: 'C001' })];

describe('AddPointsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with the customer list', () => {
    renderWithApp(<AddPointsSection />, { customers: { customers } });
    expect(screen.getByLabelText('chooseCustomer')).toBeInTheDocument();
    expect(screen.getByText('Jan Kowalski (C001)')).toBeInTheDocument();
  });

  it('fetches customers on entering the route', () => {
    const { context } = renderWithApp(<AddPointsSection />, { customers: { customers } });
    expect(context.data.customers.ensureCustomers).toHaveBeenCalled();
  });

  it('sends the point count as typed in the field', async () => {
    const { context } = renderWithApp(<AddPointsSection />, { customers: { customers } });

    fireEvent.change(screen.getByLabelText('chooseCustomer'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('pointsCount'), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: 'addPointsAction' }));

    await waitFor(() => expect(context.data.customers.addPoints).toHaveBeenCalledWith('1', '150', 'purchaseProducts'));
  });

  it('blocks a submit with no customer and no point count', () => {
    const { context } = renderWithApp(<AddPointsSection />, { customers: { customers } });

    fireEvent.click(screen.getByRole('button', { name: 'addPointsAction' }));

    expect(context.data.customers.addPoints).not.toHaveBeenCalled();
    expect(screen.getAllByText('validationRequired').length).toBeGreaterThan(0);
  });

  it('rejects a non-positive point count', () => {
    const { context } = renderWithApp(<AddPointsSection />, { customers: { customers } });

    fireEvent.change(screen.getByLabelText('chooseCustomer'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('pointsCount'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'addPointsAction' }));

    expect(context.data.customers.addPoints).not.toHaveBeenCalled();
    expect(screen.getByText('validationPositive')).toBeInTheDocument();
  });
});
