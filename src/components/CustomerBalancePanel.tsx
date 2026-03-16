import type { Customer, CustomerTransaction } from '../types';
import type { PurchaseHistorySeries, Translator } from '../types/ui';

type CustomerBalancePanelProps = {
  selectedCustomer: Customer;
  purchaseHistorySeries: PurchaseHistorySeries;
  customerTransactions: CustomerTransaction[];
  t: Translator;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
};

export function CustomerBalancePanel({
  selectedCustomer,
  purchaseHistorySeries,
  customerTransactions,
  t,
  formatDate,
  formatDateTime,
}: CustomerBalancePanelProps) {
  return (
    <div>
      <div className="card" style={{ marginTop: 0 }}>
        <strong>{t('currentBalance')}: </strong>{selectedCustomer.loyaltyPoints} {t('pointsShort')}
      </div>
      <h3>{t('purchaseHistoryChartTitle')}</h3>
      {purchaseHistorySeries.points.length === 0 ? (
        <p>{t('noPurchaseHistory')}</p>
      ) : (
        <div className="purchase-chart-scroll">
          <div className="purchase-chart">
            {purchaseHistorySeries.points.map((point) => {
              const highestDailyTotal = purchaseHistorySeries.maxTotal || 1;
              const heightPercent = point.total === highestDailyTotal
                ? 100
                : Math.max(12, Math.round((point.total / highestDailyTotal) * 100));

              return (
                <div
                  key={point.date}
                  className="purchase-chart-column"
                >
                  <div className="purchase-chart-value">{point.total}</div>
                  <div className="purchase-chart-bar-wrap">
                    <div className="purchase-chart-bar" style={{ height: `${heightPercent}%` }} />
                  </div>
                  <div className="purchase-chart-label">{formatDate(point.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <h3>{t('transactionHistoryTitle')}</h3>
      {customerTransactions.length === 0 ? (
        <p>{t('noPurchaseHistory')}</p>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '40vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('transactionDate')}</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('description')}</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('points')}</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('availableFrom')}</th>
              </tr>
            </thead>
            <tbody>
              {customerTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(transaction.timestamp)}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{transaction.description}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{transaction.points}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(transaction.availableFrom)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
