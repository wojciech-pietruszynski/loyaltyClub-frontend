import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomersSection } from './CustomersSection';

describe('CustomersSection Component', () => {
  const mockCustomers = [
    {
      id: '1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@example.com',
      customerNumber: 'C001',
      phoneNumber: '123456789',
      country: 'PL',
      loyaltyPoints: 100,
    },
  ];

  const mockProps = {
    customers: mockCustomers,
    t: (key: string) => key,
    openCustomerModal: vi.fn(),
  };

  it('renders "no customers" message when list is empty', () => {
    render(<CustomersSection {...mockProps} customers={[]} />);
    expect(screen.getByText('noCustomersInSystem')).toBeInTheDocument();
  });

  it('renders table with customer data', () => {
    render(<CustomersSection {...mockProps} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Kowalski')).toBeInTheDocument();
    expect(screen.getByText('jan@example.com')).toBeInTheDocument();
    expect(screen.getByText('C001')).toBeInTheDocument();
  });

  it('calls openCustomerModal when info button is clicked', () => {
    render(<CustomersSection {...mockProps} />);
    const infoBtn = screen.getByLabelText('customerDetailsModalTitle');
    fireEvent.click(infoBtn);
    expect(mockProps.openCustomerModal).toHaveBeenCalledWith(mockCustomers[0]);
  });
});
