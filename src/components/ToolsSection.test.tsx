import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolsSection } from './ToolsSection';

describe('ToolsSection Component', () => {
  const baseProps = {
    t: (key: string) => key,
    setToolView: vi.fn(),
    isAdmin: false,
    importing: false,
    setImportFile: vi.fn(),
    handleImportCustomers: vi.fn(async (e: any) => e.preventDefault()),
    availableCountries: ['PL'],
    technicalUserForm: { username: '', password: '', country: '', enabled: true },
    setTechnicalUserForm: vi.fn(),
    technicalUsersLoading: false,
    handleCreateTechnicalUser: vi.fn(async (e: any) => e.preventDefault()),
    technicalUsers: [],
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

  it('renders import CSV tile', () => {
    render(<ToolsSection {...baseProps} toolView={null} />);
    expect(screen.getByText('toolsImportCsvTileTitle')).toBeInTheDocument();
  });

  it('renders technical accounts tile only for admin', () => {
    const { rerender } = render(<ToolsSection {...baseProps} toolView={null} isAdmin={false} />);
    expect(screen.queryByText('toolsTechnicalAccountTileTitle')).not.toBeInTheDocument();

    rerender(<ToolsSection {...baseProps} toolView={null} isAdmin={true} />);
    expect(screen.getByText('toolsTechnicalAccountTileTitle')).toBeInTheDocument();
  });

  it('opens import modal when import tile is clicked', () => {
    render(<ToolsSection {...baseProps} toolView={null} />);
    fireEvent.click(screen.getByText('toolsImportCsvTileTitle'));
    expect(baseProps.setToolView).toHaveBeenCalledWith('import');
  });

  it('calls setImportFile on file change in import modal', () => {
    render(<ToolsSection {...baseProps} toolView="import" />);
    const input = screen.getByLabelText('csvFile');
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(baseProps.setImportFile).toHaveBeenCalledWith(file);
  });

  it('disables submit button and shows importing text when importing is true', () => {
    render(<ToolsSection {...baseProps} toolView="import" importing={true} />);
    const button = screen.getByRole('button', { name: 'importing' });
    expect(button).toBeDisabled();
  });

  it('calls handleImportCustomers on form submit in import modal', () => {
    const { container } = render(<ToolsSection {...baseProps} toolView="import" />);
    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);
    expect(baseProps.handleImportCustomers).toHaveBeenCalled();
  });
});
