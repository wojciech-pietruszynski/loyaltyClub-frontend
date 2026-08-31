import { useAppContext } from '../context/appContext';
import type { Customer, CustomerTransaction } from '../types';
import type { PurchaseHistorySeries } from '../types/ui';

type CustomerBalancePanelProps = {
  customer: Customer;
  history: PurchaseHistorySeries;
  transactions: CustomerTransaction[];
};

export function CustomerBalancePanel({ customer, history, transactions }: CustomerBalancePanelProps) {
  const { t, format } = useAppContext();

  const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
  const headStyle = { ...cellStyle, textAlign: 'left' } as const;

  return (
    <div>
      <div className="card" style={{ marginTop: 0 }}>
        <strong>{t('currentBalance')}: </strong>{format.formatNumber(customer.loyaltyPoints)} {t('pointsShort')}
      </div>
      <h3>{t('purchaseHistoryChartTitle')}</h3>
      {history.points.length === 0 ? (
        <p>{t('noPurchaseHistory')}</p>
      ) : (
        <div className="purchase-chart-scroll">
          <div className="purchase-chart">
            {history.points.map((point) => {
              const highestDailyTotal = history.maxTotal || 1;
              const heightPercent = point.total === highestDailyTotal
                ? 100
                : Math.max(12, Math.round((point.total / highestDailyTotal) * 100));

              return (
                <div key={point.date} className="purchase-chart-column">
                  <div className="purchase-chart-value">{format.formatNumber(point.total)}</div>
                  <div className="purchase-chart-bar-wrap">
                    <div className="purchase-chart-bar" style={{ height: `${heightPercent}%` }} />
                  </div>
                  <div className="purchase-chart-label">{format.formatDate(point.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <h3>{t('transactionHistoryTitle')}</h3>
      {transactions.length === 0 ? (
        <p>{t('noPurchaseHistory')}</p>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '40vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headStyle}>{t('transactionDate')}</th>
                <th style={headStyle}>{t('description')}</th>
                <th style={{ ...cellStyle, textAlign: 'right' }}>{t('points')}</th>
                <th style={headStyle}>{t('availableFrom')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td style={cellStyle}>{format.formatDateTime(transaction.timestamp)}</td>
                  <td style={cellStyle}>{transaction.description}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{format.formatNumber(transaction.points)}</td>
                  <td style={cellStyle}>{format.formatDateTime(transaction.availableFrom)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
