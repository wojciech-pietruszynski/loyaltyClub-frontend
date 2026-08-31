import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsAuditSection } from './ReportsAuditSection';
import { renderWithApp } from '../test/harness';
import { makeAuditLogEntry, makeReportsSummary } from '../test/fixtures';

describe('ReportsAuditSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks the hook for the summary instead of calling the HTTP client itself', () => {
    const { context } = renderWithApp(<ReportsAuditSection />);
    expect(context.data.reports.fetchSummary).toHaveBeenCalled();
  });

  it('shows the summary figures', () => {
    renderWithApp(<ReportsAuditSection />, {
      reports: { summary: makeReportsSummary({ customerCount: 12, totalLoyaltyPoints: 3400 }) },
    });
    expect(screen.getByText('reportsTitle')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('fetches the audit log only for an administrator', () => {
    const admin = renderWithApp(<ReportsAuditSection />);
    expect(admin.context.data.reports.fetchAuditLogs).toHaveBeenCalled();
    admin.unmount();

    const technical = renderWithApp(<ReportsAuditSection />, {
      session: { role: 'TECHNICAL', isAdmin: false, country: 'PL' },
    });
    expect(technical.context.data.reports.fetchAuditLogs).not.toHaveBeenCalled();
    expect(screen.queryByText('auditTitle')).not.toBeInTheDocument();
  });

  it('lists the audit log entries', () => {
    renderWithApp(<ReportsAuditSection />, {
      reports: { auditLogs: [makeAuditLogEntry({ username: 'admin', action: 'CREATE' })] },
    });
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('CREATE')).toBeInTheDocument();
  });

  it('passes the date range to the transaction export', async () => {
    const { context } = renderWithApp(<ReportsAuditSection />);

    fireEvent.change(screen.getByLabelText('reportsExportFrom'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('reportsExportTo'), { target: { value: '2026-08-31' } });
    fireEvent.click(screen.getByRole('button', { name: /reportsExportTransactions/ }));

    await waitFor(() => expect(context.data.reports.exportCsv).toHaveBeenCalledWith(
      '/reports/export/transactions',
      'transactions.csv',
      { from: '2026-08-01', to: '2026-08-31' },
    ));
  });

  it('shows the error message from the hook', () => {
    renderWithApp(<ReportsAuditSection />, { reports: { error: 'reportsLoadError' } });
    expect(screen.getByRole('alert')).toHaveTextContent('reportsLoadError');
  });
});
