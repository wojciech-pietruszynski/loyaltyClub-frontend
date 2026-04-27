import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomersSection } from './CustomersSection';

describe('CustomersSection Component', () => {
  const mockCustomers = [
    {
      id: 1,
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@example.com',
      customerNumber: 'C001',
      phoneNumber: '123456789',
      country: 'PL',
      loyaltyPoints: 100,
    },
  ];

  const baseProps = {
    customers: mockCustomers,
    t: (key: string) => key,
    openCustomerModal: vi.fn(),
    setCustomerView: vi.fn(),
    newCustomer: { firstName: '', lastName: '', email: '', customerNumber: '', phoneNumber: '', country: '', referrerCustomerNumber: '' },
    setNewCustomer: vi.fn(),
    availableCountries: ['PL'],
    handleAddCustomer: vi.fn(async (e: any) => e.preventDefault()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders action tiles', () => {
    render(<CustomersSection {...baseProps} customerView={null} />);
    expect(screen.getByText('customersBrowseTileTitle')).toBeInTheDocument();
    expect(screen.getByText('customersAddTileTitle')).toBeInTheDocument();
  });

  it('opens browse modal when browse tile is clicked', () => {
    render(<CustomersSection {...baseProps} customerView={null} />);
    fireEvent.click(screen.getByText('customersBrowseTileTitle'));
    expect(baseProps.setCustomerView).toHaveBeenCalledWith('browse');
  });

  it('renders "no customers" message in browse modal when list is empty', () => {
    render(<CustomersSection {...baseProps} customerView="browse" customers={[]} />);
    expect(screen.getByText('noCustomersInSystem')).toBeInTheDocument();
  });

  it('renders table with customer data in browse modal', () => {
    render(<CustomersSection {...baseProps} customerView="browse" />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Kowalski')).toBeInTheDocument();
    expect(screen.getByText('jan@example.com')).toBeInTheDocument();
    expect(screen.getByText('C001')).toBeInTheDocument();
  });

  it('calls openCustomerModal when info button is clicked in browse modal', () => {
    render(<CustomersSection {...baseProps} customerView="browse" />);
    const infoBtn = screen.getByLabelText('customerDetailsModalTitle');
    fireEvent.click(infoBtn);
    expect(baseProps.openCustomerModal).toHaveBeenCalledWith(mockCustomers[0]);
  });
});
