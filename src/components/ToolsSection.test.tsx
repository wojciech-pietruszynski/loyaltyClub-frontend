import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolsSection } from './ToolsSection';
import { renderWithApp } from '../test/harness';
import { makeTechnicalUser } from '../test/fixtures';

describe('ToolsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the CSV import tile', () => {
    renderWithApp(<ToolsSection />);
    expect(screen.getByText('toolsImportCsvTileTitle')).toBeInTheDocument();
  });

  it('renders the technical accounts tile only for an administrator', () => {
    const { unmount } = renderWithApp(<ToolsSection />, { session: { role: 'TECHNICAL', isAdmin: false, country: 'PL' } });
    expect(screen.queryByText('toolsTechnicalAccountTileTitle')).not.toBeInTheDocument();
    unmount();

    renderWithApp(<ToolsSection />);
    expect(screen.getByText('toolsTechnicalAccountTileTitle')).toBeInTheDocument();
  });

  it('opens the import dialog from the tile', () => {
    renderWithApp(<ToolsSection />);
    fireEvent.click(screen.getByText('toolsImportCsvTileTitle'));
    expect(screen.getByLabelText('csvFile')).toBeInTheDocument();
  });

  it('sends the chosen file to the import action', async () => {
    const { context } = renderWithApp(<ToolsSection />);
    fireEvent.click(screen.getByText('toolsImportCsvTileTitle'));

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText('csvFile'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'importCsv' }));

    await waitFor(() => expect(context.data.customers.importCustomers).toHaveBeenCalledWith(file));
  });

  it('lists technical accounts and toggles their status', async () => {
    const { context } = renderWithApp(<ToolsSection />, {
      technicalUsers: { technicalUsers: [makeTechnicalUser({ username: 'tech-pl' })] },
    });
    fireEvent.click(screen.getByText('toolsTechnicalAccountTileTitle'));

    expect(screen.getByText('tech-pl')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'tech-pl' }));

    await waitFor(() => expect(context.data.technicalUsers.toggleTechnicalUser).toHaveBeenCalledWith(1, false));
  });

  it('rejects a technical account with too short a password', () => {
    const { context } = renderWithApp(<ToolsSection />);
    fireEvent.click(screen.getByText('toolsTechnicalAccountTileTitle'));

    fireEvent.change(screen.getByLabelText('login'), { target: { value: 'tech-de' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'krotkie' } });
    fireEvent.change(screen.getByLabelText('country'), { target: { value: 'DE' } });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(context.data.technicalUsers.createTechnicalUser).not.toHaveBeenCalled();
    expect(screen.getByText('validationMinLength')).toBeInTheDocument();
  });
});
