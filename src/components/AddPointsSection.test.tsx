import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddPointsSection } from './AddPointsSection';

describe('AddPointsSection Component', () => {
  const mockProps = {
    t: (key: string) => key,
    newPoints: {
      customerId: '',
      points: 0,
      description: 'Purchase',
    },
    setNewPoints: vi.fn(),
    customers: [
      { id: '1', firstName: 'Jan', lastName: 'Kowalski', customerNumber: 'C001' } as any
    ],
    handleAddPoints: vi.fn(async (e) => e.preventDefault()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form elements', () => {
    render(<AddPointsSection {...mockProps} />);
    expect(screen.getByText('tabAddPoints')).toBeInTheDocument();
    expect(screen.getByLabelText('chooseCustomer')).toBeInTheDocument();
    expect(screen.getByLabelText('pointsCount')).toBeInTheDocument();
  });

  it('updates state on select change', () => {
    render(<AddPointsSection {...mockProps} />);
    const select = screen.getByLabelText('chooseCustomer');
    fireEvent.change(select, { target: { value: '1' } });
    expect(mockProps.setNewPoints).toHaveBeenCalledWith({
      ...mockProps.newPoints,
      customerId: '1',
    });
  });

  it('updates state on points change', () => {
    render(<AddPointsSection {...mockProps} />);
    const pointsInput = screen.getByLabelText('pointsCount');
    fireEvent.change(pointsInput, { target: { value: '50' } });
    expect(mockProps.setNewPoints).toHaveBeenCalledWith({
      ...mockProps.newPoints,
      points: 50,
    });
  });

  it('calls handleAddPoints on submit', () => {
    const { container } = render(<AddPointsSection {...mockProps} />);
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(mockProps.handleAddPoints).toHaveBeenCalled();
  });
});
