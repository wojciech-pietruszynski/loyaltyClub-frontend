import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolsSection } from './ToolsSection';

describe('ToolsSection Component', () => {
  const mockProps = {
    t: (key: string) => key,
    importing: false,
    setImportFile: vi.fn(),
    handleImportCustomers: vi.fn(async (e) => e.preventDefault()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and description', () => {
    render(<ToolsSection {...mockProps} />);
    expect(screen.getByText('toolsTitle')).toBeInTheDocument();
    expect(screen.getByText('toolsDescription')).toBeInTheDocument();
  });

  it('calls setImportFile on file change', () => {
    render(<ToolsSection {...mockProps} />);
    const input = screen.getByLabelText('csvFile');
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockProps.setImportFile).toHaveBeenCalledWith(file);
  });

  it('disables button and shows importing text when importing is true', () => {
    render(<ToolsSection {...mockProps} importing={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('importing')).toBeInTheDocument();
  });

  it('calls handleImportCustomers on submit', () => {
    const { container } = render(<ToolsSection {...mockProps} />);
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(mockProps.handleImportCustomers).toHaveBeenCalled();
  });
});
