import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TechnicalAccountsSection } from './TechnicalAccountsSection';

describe('TechnicalAccountsSection Component', () => {
  const mockProps = {
    t: (key: string) => key,
    availableCountries: ['PL', 'EN'],
    technicalUserForm: { username: '', password: '', country: '', enabled: true },
    setTechnicalUserForm: vi.fn(),
    technicalUsersLoading: false,
    handleCreateTechnicalUser: vi.fn(async (e) => e.preventDefault()),
    technicalUsers: [
      { id: 1, username: 'tech1', country: 'PL', enabled: true } as any
    ],
    handleToggleTechnicalUser: vi.fn(),
    technicalPasswordModalUser: null,
    setTechnicalPasswordModalUser: vi.fn(),
    technicalPasswordValue: '',
    setTechnicalPasswordValue: vi.fn(),
    technicalPasswordVisible: false,
    setTechnicalPasswordVisible: vi.fn(),
    closeTechnicalPasswordModal: vi.fn(),
    handleUpdateTechnicalUserPassword: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders technical users list and create form', () => {
    render(<TechnicalAccountsSection {...mockProps} />);
    expect(screen.getByText('technicalAccountsList')).toBeInTheDocument();
    expect(screen.getByText('tech1')).toBeInTheDocument();
    expect(screen.getByText('createTechnicalAccount')).toBeInTheDocument();
  });

  it('calls handleCreateTechnicalUser on form submit', () => {
    const { container } = render(<TechnicalAccountsSection {...mockProps} />);
    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);
    expect(mockProps.handleCreateTechnicalUser).toHaveBeenCalled();
  });

  it('calls handleToggleTechnicalUser when checkbox is toggled', () => {
    render(<TechnicalAccountsSection {...mockProps} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(mockProps.handleToggleTechnicalUser).toHaveBeenCalled();
  });
});
