import { useCallback, useState } from 'react';
import api from '../api/client';
import { isAuditLogEntry, isReportsSummary, parseList, parseObject } from '../api/schema';
import type { AuditLogEntry, ReportsSummary } from '../types';
import type { StateSetter, Translator } from '../types/ui';
import { useApiErrorMessage } from './useApiError';

export type ReportsApi = {
  summary: ReportsSummary | null;
  auditLogs: AuditLogEntry[];
  loading: boolean;
  exporting: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  exportCsv: (path: string, fileName: string, params?: Record<string, string>) => Promise<boolean>;
  setError: StateSetter<string | null>;
};

/**
 * Sekcja raportów i dziennika audytu była jedynym komponentem prezentacyjnym,
 * który importował klienta HTTP bezpośrednio i zarządzał własnym stanem —
 * wbrew podziałowi na warstwy obowiązującemu w pozostałych pięciu obszarach
 * dziedziny. Dostęp do danych mieszka teraz tutaj.
 */
export function useReports(t: Translator): ReportsApi {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<unknown>('/reports/summary');
      setSummary(parseObject('/reports/summary', data, isReportsSummary));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'reportsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [toMessage]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const { data } = await api.get<unknown>('/audit-logs');
      setAuditLogs(parseList('/audit-logs', data, isAuditLogEntry));
    } catch (err: unknown) {
      setAuditLogs([]);
      setError(toMessage(err, 'fetchAuditLogsError'));
    }
  }, [toMessage]);

  const exportCsv = useCallback(async (path: string, fileName: string, params?: Record<string, string>) => {
    setExporting(true);
    try {
      const { data } = await api.get<Blob>(path, { params, responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setError(null);
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'reportsExportError'));
      return false;
    } finally {
      setExporting(false);
    }
  }, [toMessage]);

  return {
    summary,
    auditLogs,
    loading,
    exporting,
    error,
    fetchSummary,
    fetchAuditLogs,
    exportCsv,
    setError,
  };
}
