import type { FormEvent, KeyboardEvent } from 'react';
import { Info, X } from 'lucide-react';
import type { Customer } from '../types';
import type { NewCustomerFormState, StateSetter, Translator } from '../types/ui';

type CustomersSectionProps = {
  customers: Customer[];
  t: Translator;
  openCustomerModal: (customer: Customer) => Promise<void>;
  customerView: 'browse' | 'add' | null;
  setCustomerView: StateSetter<'browse' | 'add' | null>;
  newCustomer: NewCustomerFormState;
  setNewCustomer: StateSetter<NewCustomerFormState>;
  availableCountries: string[];
  handleAddCustomer: (e: FormEvent) => Promise<void>;
};

export function CustomersSection({
  customers,
  t,
  openCustomerModal,
  customerView,
  setCustomerView,
  newCustomer,
  setNewCustomer,
  availableCountries,
  handleAddCustomer,
}: CustomersSectionProps) {
  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <div>
      <div className="grid coupon-actions-grid">
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={() => setCustomerView('browse')}
          onKeyDown={(e) => handleTileKeyDown(e, () => setCustomerView('browse'))}
        >
          <h3>{t('customersBrowseTileTitle')}</h3>
          <p>{t('customersBrowseTileDesc')}</p>
        </div>
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={() => setCustomerView('add')}
          onKeyDown={(e) => handleTileKeyDown(e, () => setCustomerView('add'))}
        >
          <h3>{t('customersAddTileTitle')}</h3>
          <p>{t('customersAddTileDesc')}</p>
        </div>
      </div>

      {customerView === 'browse' && (
        <div className="modal-overlay" onClick={() => setCustomerView(null)} role="presentation">
          <div
            className="card modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customers-browse-title"
          >
            <div className="modal-header">
              <h2 id="customers-browse-title" style={{ margin: 0 }}>{t('tabCustomers')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={() => setCustomerView(null)} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
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
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('loyaltyTier')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('referralCodeShort')}</th>
                      <th style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
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
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.loyaltyTierCode ?? '—'}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{customer.referralCode ?? '—'}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                          <button
                            className="btn icon-btn"
                            type="button"
                            aria-label={t('customerDetailsModalTitle')}
                            title={t('customerDetailsModalTitle')}
                            onClick={() => { void openCustomerModal(customer); }}
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
            <div className="form-actions">
              <button className="btn" type="button" onClick={() => setCustomerView(null)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {customerView === 'add' && (
        <div className="modal-overlay" onClick={() => setCustomerView(null)} role="presentation">
          <div
            className="card modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-add-title"
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <h2 id="customer-add-title" style={{ margin: 0 }}>{t('tabAddCustomer')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={() => setCustomerView(null)} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(e) => { void handleAddCustomer(e); }}>
              <div className="form-group"><label htmlFor="firstName">{t('firstName')}</label><input id="firstName" className="input" value={newCustomer.firstName} onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} required /></div>
              <div className="form-group"><label htmlFor="lastName">{t('lastName')}</label><input id="lastName" className="input" value={newCustomer.lastName} onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} required /></div>
              <div className="form-group"><label htmlFor="email">{t('email')}</label><input id="email" className="input" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} required /></div>
              <div className="form-group"><label htmlFor="customerNumber">{t('customerNumber')}</label><input id="customerNumber" className="input" value={newCustomer.customerNumber} onChange={(e) => setNewCustomer({ ...newCustomer, customerNumber: e.target.value })} required /></div>
              <div className="form-group"><label htmlFor="phoneNumber">{t('phoneNumber')}</label><input id="phoneNumber" className="input" value={newCustomer.phoneNumber} onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })} required /></div>
              <div className="form-group">
                <label htmlFor="country">{t('country')}</label>
                <select id="country" className="input" value={newCustomer.country} onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })} required>
                  <option value="">{t('selectCountry')}</option>
                  {availableCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="referrerCustomerNumber">{t('referrerCustomerNumber')}</label>
                <input
                  id="referrerCustomerNumber"
                  className="input"
                  value={newCustomer.referrerCustomerNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, referrerCustomerNumber: e.target.value })}
                  placeholder=""
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{t('addCustomer')}</button>
                <button className="btn" type="button" onClick={() => setCustomerView(null)}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
