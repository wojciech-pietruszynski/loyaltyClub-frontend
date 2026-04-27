import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddCustomerSection } from './AddCustomerSection';

describe('AddCustomerSection Component', () => {
  const mockProps = {
    t: (key: string) => key,
    newCustomer: {
      firstName: '',
      lastName: '',
      email: '',
      customerNumber: '',
      phoneNumber: '',
      country: '',
      referrerCustomerNumber: '',
    },
    setNewCustomer: vi.fn(),
    availableCountries: ['PL', 'EN'],
    handleAddCustomer: vi.fn(async (e) => e.preventDefault()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form elements', () => {
    render(<AddCustomerSection {...mockProps} />);
    expect(screen.getByText('tabAddCustomer')).toBeInTheDocument();
  });

  it('updates state on input change', () => {
    render(<AddCustomerSection {...mockProps} />);
    const firstNameInput = screen.getByLabelText('firstName');
    fireEvent.change(firstNameInput, { target: { value: 'Jan' } });
    
    expect(mockProps.setNewCustomer).toHaveBeenCalledWith({
      ...mockProps.newCustomer,
      firstName: 'Jan',
    });
  });

  it('calls handleAddCustomer on submit', () => {
    const { container } = render(<AddCustomerSection {...mockProps} />);
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(mockProps.handleAddCustomer).toHaveBeenCalled();
  });
});
