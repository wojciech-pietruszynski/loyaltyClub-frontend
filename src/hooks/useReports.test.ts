import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReports } from './useReports';
import api from '../api/client';
import type { TranslationKey } from '../i18n';
import { makeAuditLogEntry, makeReportsSummary } from '../test/fixtures';

vi.mock('../api/client');

const t = (key: TranslationKey) => key;

describe('useReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the report summary', async () => {
    const summary = makeReportsSummary();
    vi.mocked(api.get).mockResolvedValue({ data: summary });

    const { result } = renderHook(() => useReports(t));

    await act(async () => {
      await result.current.fetchSummary();
    });

    expect(result.current.summary).toEqual(summary);
    expect(api.get).toHaveBeenCalledWith('/reports/summary');
  });

  it('reports a translated message when the summary cannot be fetched', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useReports(t));

    await act(async () => {
      await result.current.fetchSummary();
    });

    expect(result.current.summary).toBeNull();
    expect(result.current.error).toBe('reportsLoadError');
  });

  it('rejects a summary of the wrong shape', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { customerCount: 'dużo' } });

    const { result } = renderHook(() => useReports(t));

    await act(async () => {
      await result.current.fetchSummary();
    });

    expect(result.current.error).toBe('invalidServerResponse');
  });

  it('fetches the audit log', async () => {
    const entries = [makeAuditLogEntry()];
    vi.mocked(api.get).mockResolvedValue({ data: entries });

    const { result } = renderHook(() => useReports(t));

    await act(async () => {
      await result.current.fetchAuditLogs();
    });

    expect(result.current.auditLogs).toEqual(entries);
    expect(api.get).toHaveBeenCalledWith('/audit-logs');
  });

  it('asks for the CSV export as a blob with the date range', async () => {
    const createObjectURL = vi.fn(() => 'blob:csv');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    vi.mocked(api.get).mockResolvedValue({ data: new Blob(['a,b']) });

    const { result } = renderHook(() => useReports(t));

    await act(async () => {
      const ok = await result.current.exportCsv('/reports/export/transactions', 'transactions.csv', { from: '2026-08-01' });
      expect(ok).toBe(true);
    });

    expect(api.get).toHaveBeenCalledWith('/reports/export/transactions', {
      params: { from: '2026-08-01' },
      responseType: 'blob',
    });
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('reports a translated message when the export fails', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useReports(t));

    await act(async () => {
      const ok = await result.current.exportCsv('/reports/export/customers', 'customers.csv');
      expect(ok).toBe(false);
    });

    expect(result.current.error).toBe('reportsExportError');
  });
});
