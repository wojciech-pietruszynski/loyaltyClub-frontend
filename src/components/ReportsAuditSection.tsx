import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useAppContext } from '../context/appContext';

/**
 * Sekcja prezentacyjna — dane i eksport idą przez `useReports`.
 * Wcześniej ten komponent, jako jedyny w warstwie prezentacji, importował
 * klienta HTTP bezpośrednio i zarządzał własnym stanem sieciowym.
 */
export function ReportsAuditSection() {
  const { t, format, session, data } = useAppContext();
  const { summary, auditLogs, loading, exporting, error, fetchSummary, fetchAuditLogs, exportCsv } = data.reports;
  const { isAdmin } = session;

  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  useEffect(() => { void fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    if (isAdmin) {
      void fetchAuditLogs();
    }
  }, [isAdmin, fetchAuditLogs]);

  const exportParams = (): Record<string, string> => {
    const params: Record<string, string> = {};
    if (exportFrom) params.from = exportFrom;
    if (exportTo) params.to = exportTo;
    return params;
  };

  const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
  const headStyle = { ...cellStyle, textAlign: 'left' } as const;

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
        {error && <p className="error-msg" role="alert">{error}</p>}

        {summary && (
          <div className="grid coupon-actions-grid">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{t('reportsCustomerCount')}</h3>
              <p style={{ fontSize: '1.6rem', margin: 0 }}>{format.formatNumber(summary.customerCount)}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{t('reportsTotalPoints')}</h3>
              <p style={{ fontSize: '1.6rem', margin: 0 }}>{format.formatNumber(summary.totalLoyaltyPoints)}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{t('reportsTransactions30d')}</h3>
              <p style={{ fontSize: '1.6rem', margin: 0 }}>{format.formatNumber(summary.transactionsLast30Days)}</p>
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
            onChange={(event) => setExportFrom(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reportsExportTo">{t('reportsExportTo')}</label>
          <input
            id="reportsExportTo"
            className="input"
            type="date"
            value={exportTo}
            onChange={(event) => setExportTo(event.target.value)}
          />
        </div>
        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={exporting}
            onClick={() => { void exportCsv('/reports/export/customers', 'customers.csv'); }}
          >
            <Download size={16} /> {t('reportsExportCustomers')}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={exporting}
            onClick={() => { void exportCsv('/reports/export/transactions', 'transactions.csv', exportParams()); }}
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
                    <th style={headStyle}>{t('auditColTime')}</th>
                    <th style={headStyle}>{t('auditColUser')}</th>
                    <th style={headStyle}>{t('auditColRole')}</th>
                    <th style={headStyle}>{t('auditColAction')}</th>
                    <th style={headStyle}>{t('auditColResource')}</th>
                    <th style={headStyle}>{t('auditColResourceId')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((entry) => (
                    <tr key={entry.id}>
                      <td style={cellStyle}>{format.formatDateTime(entry.timestamp)}</td>
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
