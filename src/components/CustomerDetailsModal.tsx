import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { CustomerBalancePanel } from './CustomerBalancePanel';
import type { Coupon, CouponTemplate, Customer, CustomerTransaction } from '../types';
import type { CustomerCouponFormState, CustomerEditFormState, CustomerModalTab, PurchaseHistorySeries, StateSetter, Translator } from '../types/ui';

type CustomerDetailsModalProps = {
  selectedCustomer: Customer;
  closeCustomerModal: () => void;
  customerModalTab: CustomerModalTab;
  setCustomerModalTab: StateSetter<CustomerModalTab>;
  customerModalError: string | null;
  customerModalLoading: boolean;
  handleSaveCustomer: (e: FormEvent) => Promise<void>;
  customerEditForm: CustomerEditFormState;
  setCustomerEditForm: StateSetter<CustomerEditFormState>;
  availableCountries: string[];
  purchaseHistorySeries: PurchaseHistorySeries;
  customerTransactions: CustomerTransaction[];
  customerCouponForm: CustomerCouponFormState;
  setCustomerCouponForm: StateSetter<CustomerCouponFormState>;
  handleIssueCouponForSelectedCustomer: (e: FormEvent) => Promise<void>;
  couponTemplates: CouponTemplate[];
  customerCoupons: Coupon[];
  statusLabel: (status: 'ACTIVE' | 'USED' | 'EXPIRED') => string;
  reasonLabel: (reason: 'POINTS_EXCHANGE' | 'COMPLAINT') => string;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  t: Translator;
};

export function CustomerDetailsModal({
  selectedCustomer,
  closeCustomerModal,
  customerModalTab,
  setCustomerModalTab,
  customerModalError,
  customerModalLoading,
  handleSaveCustomer,
  customerEditForm,
  setCustomerEditForm,
  availableCountries,
  purchaseHistorySeries,
  customerTransactions,
  customerCouponForm,
  setCustomerCouponForm,
  handleIssueCouponForSelectedCustomer,
  couponTemplates,
  customerCoupons,
  statusLabel,
  reasonLabel,
  formatDate,
  formatDateTime,
  t,
}: CustomerDetailsModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={closeCustomerModal}
      role="presentation"
    >
      <div
        className="card modal-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('customerDetailsModalTitle')}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>{t('customerDetailsModalTitle')}</h2>
            <div style={{ color: 'var(--text-light)' }}>
              {selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.customerNumber})
            </div>
          </div>
          <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCustomerModal} aria-label={t('close')} title={t('close')}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`btn ${customerModalTab === 'profile' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('profile')}>
            {t('customerModalTabProfile')}
          </button>
          <button className={`btn ${customerModalTab === 'balance' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('balance')}>
            {t('customerModalTabBalance')}
          </button>
          <button className={`btn ${customerModalTab === 'issue-coupon' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('issue-coupon')}>
            {t('customerModalTabCreateCoupon')}
          </button>
          <button className={`btn ${customerModalTab === 'coupon-history' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('coupon-history')}>
            {t('customerModalTabCouponHistory')}
          </button>
        </div>

        {customerModalError && <div className="error-msg" style={{ marginBottom: '1rem' }}>{customerModalError}</div>}
        {customerModalLoading && <div>{t('loading')}</div>}

        {!customerModalLoading && customerModalTab === 'profile' && (
          <form onSubmit={(event) => { void handleSaveCustomer(event); }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div className="form-group"><label>{t('firstName')}</label><input className="input" value={customerEditForm.firstName} onChange={(event) => setCustomerEditForm((prev) => ({ ...prev, firstName: event.target.value }))} required /></div>
              <div className="form-group"><label>{t('lastName')}</label><input className="input" value={customerEditForm.lastName} onChange={(event) => setCustomerEditForm((prev) => ({ ...prev, lastName: event.target.value }))} required /></div>
              <div className="form-group"><label>{t('email')}</label><input className="input" type="email" value={customerEditForm.email} onChange={(event) => setCustomerEditForm((prev) => ({ ...prev, email: event.target.value }))} required /></div>
              <div className="form-group"><label>{t('customerNumber')}</label><input className="input" value={customerEditForm.customerNumber} onChange={(event) => setCustomerEditForm((prev) => ({ ...prev, customerNumber: event.target.value }))} required /></div>
              <div className="form-group"><label>{t('phoneNumber')}</label><input className="input" value={customerEditForm.phoneNumber} onChange={(event) => setCustomerEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} required /></div>
              <div className="form-group">
                <label>{t('country')}</label>
                <select className="input" value={customerEditForm.country} onChange={(event) => setCustomerEditForm((prev) => ({ ...prev, country: event.target.value }))} required>
                  <option value="">{t('selectCountry')}</option>
                  {availableCountries.map((countryCode) => (<option key={countryCode} value={countryCode}>{countryCode}</option>))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">{t('save')}</button>
            </div>
          </form>
        )}

        {!customerModalLoading && customerModalTab === 'balance' && (
          <CustomerBalancePanel
            selectedCustomer={selectedCustomer}
            purchaseHistorySeries={purchaseHistorySeries}
            customerTransactions={customerTransactions}
            t={t}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
          />
        )}

        {!customerModalLoading && customerModalTab === 'issue-coupon' && (
          <form onSubmit={(event) => { void handleIssueCouponForSelectedCustomer(event); }}>
            <div className="form-group">
              <label>{t('couponTemplate')}</label>
              <select className="input" value={customerCouponForm.couponTemplateId} onChange={(event) => setCustomerCouponForm((prev) => ({ ...prev, couponTemplateId: event.target.value }))} required>
                <option value="">{t('selectTemplate')}</option>
                {couponTemplates
                  .filter((template) => template.country === selectedCustomer.country)
                  .map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.couponPrefix} | {template.country} | {t('templateOptionValue')} {template.couponValue} | {t('templateOptionMin')} {template.minimumPurchaseValue} | {t('templateOptionPoints')} {template.requiredPoints} | {template.validityDays} {t('templateOptionDays')}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('reason')}</label>
              <select className="input" value={customerCouponForm.reason} onChange={(event) => setCustomerCouponForm((prev) => ({ ...prev, reason: event.target.value }))} required>
                <option value="">{t('selectReason')}</option>
                <option value="POINTS_EXCHANGE">{t('reasonPointsExchange')}</option>
                <option value="COMPLAINT">{t('reasonComplaint')}</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">{t('generateCoupon')}</button>
            </div>
          </form>
        )}

        {!customerModalLoading && customerModalTab === 'coupon-history' && (
          <div>
            {customerCoupons.length === 0 ? (
              <p>{t('noCustomerCoupons')}</p>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '45vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('code')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('reason')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('createdAt')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('expiresAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerCoupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.couponCode}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{statusLabel(coupon.status)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{reasonLabel(coupon.reason)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(coupon.issuedAt)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(coupon.expiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
