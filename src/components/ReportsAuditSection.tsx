import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api/client';
import type { AuditLogEntry, ReportsSummary } from '../types';
import type { Translator } from '../types/ui';

type ReportsAuditSectionProps = {
  t: Translator;
  isAdmin: boolean;
};

const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
const headCellStyle = { ...cellStyle, textAlign: 'left' } as const;

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ReportsAuditSection({ t, isAdmin }: ReportsAuditSectionProps) {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<ReportsSummary>('/reports/summary');
        if (!cancelled) {
          setSummary(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError(t('reportsLoadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [t]);

  useEffect(() => {
    if (!isAdmin) {
      setAuditLogs([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get<AuditLogEntry[]>('/audit-logs');
        if (!cancelled) setAuditLogs(data);
      } catch {
        if (!cancelled) setAuditLogs([]);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const downloadCsv = useCallback(async (path: string, fileName: string, params?: Record<string, string>) => {
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
    } catch {
      setError(t('reportsExportError'));
    } finally {
      setExporting(false);
    }
  }, [t]);

  const exportParams = () => {
    const params: Record<string, string> = {};
    if (exportFrom) params.from = exportFrom;
    if (exportTo) params.to = exportTo;
    return params;
  };

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('reportsTitle')}</h2>
        {summary && (
          <p style={{ marginTop: 0 }}>
            <strong>{t('reportsScope')} </strong>{summary.scope || t('allCountries')}
          </p>
        )}

        {loading && <p>{t('loading')}</p>}
        {error && <p style={{ color: 'var(--danger, #d4380d)' }}>{error}</p>}

        {summary && (
          <div className="grid coupon-actions-grid">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{t('reportsCustomerCount')}</h3>
              <p style={{ fontSize: '1.6rem', margin: 0 }}>{summary.customerCount}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{t('reportsTotalPoints')}</h3>
              <p style={{ fontSize: '1.6rem', margin: 0 }}>{summary.totalLoyaltyPoints}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{t('reportsTransactions30d')}</h3>
              <p style={{ fontSize: '1.6rem', margin: 0 }}>{summary.transactionsLast30Days}</p>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="reportsExportFrom">{t('reportsExportFrom')}</label>
          <input
            id="reportsExportFrom"
            className="input"
            type="date"
            value={exportFrom}
            onChange={(e) => setExportFrom(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reportsExportTo">{t('reportsExportTo')}</label>
          <input
            id="reportsExportTo"
            className="input"
            type="date"
            value={exportTo}
            onChange={(e) => setExportTo(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={exporting}
            onClick={() => { void downloadCsv('/reports/export/customers', 'customers.csv'); }}
          >
            <Download size={16} /> {t('reportsExportCustomers')}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={exporting}
            onClick={() => { void downloadCsv('/reports/export/transactions', 'transactions.csv', exportParams()); }}
          >
            <Download size={16} /> {t('reportsExportTransactions')}
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t('auditTitle')}</h2>
          {auditLogs.length === 0 ? (
            <p>{t('auditNoEntries')}</p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '50vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headCellStyle}>{t('auditColTime')}</th>
                    <th style={headCellStyle}>{t('auditColUser')}</th>
                    <th style={headCellStyle}>{t('auditColRole')}</th>
                    <th style={headCellStyle}>{t('auditColAction')}</th>
                    <th style={headCellStyle}>{t('auditColResource')}</th>
                    <th style={headCellStyle}>{t('auditColResourceId')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((entry) => (
                    <tr key={entry.id}>
                      <td style={cellStyle}>{formatDateTime(entry.timestamp)}</td>
                      <td style={cellStyle}>{entry.username}</td>
                      <td style={cellStyle}>{entry.role}</td>
                      <td style={cellStyle}>{entry.action}</td>
                      <td style={cellStyle}>{entry.resourceType}</td>
                      <td style={cellStyle}>{entry.resourceId ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
