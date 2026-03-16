import { Info } from 'lucide-react';
import type { Customer } from '../types';
import type { Translator } from '../types/ui';

type CustomersSectionProps = {
  customers: Customer[];
  t: Translator;
  openCustomerModal: (customer: Customer) => Promise<void>;
};

export function CustomersSection({ customers, t, openCustomerModal }: CustomersSectionProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>{t('tabCustomers')}</h2>
      </div>
      {customers.length === 0 ? (
        <p>{t('noCustomersInSystem')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('firstName')}</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('lastName')}</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('email')}</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('customerNumberShort')}</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('phone')}</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('points')}</th>
                <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.firstName}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.lastName}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.email}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.customerNumber}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.phoneNumber}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.country}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{customer.loyaltyPoints}</td>
                  <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                    <button
                      className="btn icon-btn"
                      type="button"
                      aria-label={t('customerDetailsModalTitle')}
                      title={t('customerDetailsModalTitle')}
                      onClick={() => {
                        void openCustomerModal(customer);
                      }}
                    >
                      <Info size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
