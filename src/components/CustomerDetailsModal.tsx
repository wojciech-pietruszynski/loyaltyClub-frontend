import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAppContext } from '../context/appContext';
import { CountrySelect } from './CountrySelect';
import { CustomerBalancePanel } from './CustomerBalancePanel';
import { FieldMessage } from './FieldMessage';
import { ModalShell } from './ModalShell';
import type { Coupon, Customer, CustomerTransaction } from '../types';
import type { CustomerCouponFormState, CustomerEditFormState, CustomerModalTab, PurchaseHistorySeries } from '../types/ui';
import { hasErrors, validateCustomerEdit, type FieldErrors } from '../lib/validation';

type CustomerDetailsModalProps = {
  customer: Customer;
  onClose: () => void;
};

const EMPTY_HISTORY: PurchaseHistorySeries = { points: [], maxTotal: 0 };

export function CustomerDetailsModal({ customer, onClose }: CustomerDetailsModalProps) {
  const { t, format, data, reasonLabel, statusLabel, notifySuccess } = useAppContext();
  const { fetchTransactions, fetchCoupons, fetchPurchaseHistory, updateCustomer } = data.customers;
  const { couponTemplates, ensureTemplates, issueCoupon } = data.coupons;

  const [tab, setTab] = useState<CustomerModalTab>('profile');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [history, setHistory] = useState<PurchaseHistorySeries>(EMPTY_HISTORY);

  const [editForm, setEditForm] = useState<CustomerEditFormState>({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    customerNumber: customer.customerNumber,
    phoneNumber: customer.phoneNumber,
    country: customer.country,
  });
  const [editErrors, setEditErrors] = useState<FieldErrors<CustomerEditFormState>>({});
  const [couponForm, setCouponForm] = useState<CustomerCouponFormState>({ couponTemplateId: '', reason: 'POINTS_EXCHANGE' });

  const customerId = customer.id;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [loadedTransactions, loadedCoupons, loadedHistory] = await Promise.all([
        fetchTransactions(customerId),
        fetchCoupons(customerId),
        fetchPurchaseHistory(customerId),
      ]);
      if (cancelled) return;
      setTransactions(loadedTransactions);
      setCoupons(loadedCoupons);
      setHistory(loadedHistory);
      setLoading(false);
    };

    void load();
    void ensureTemplates();
    return () => { cancelled = true; };
  }, [customerId, fetchTransactions, fetchCoupons, fetchPurchaseHistory, ensureTemplates]);

  const handleSave = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateCustomerEdit(editForm);
    setEditErrors(validation);
    if (hasErrors(validation)) return;

    if (await updateCustomer(customerId, editForm)) {
      notifySuccess(t('customerSavedSuccess'));
      onClose();
    }
  }, [editForm, updateCustomer, customerId, notifySuccess, t, onClose]);

  const handleIssueCoupon = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const issued = await issueCoupon({
      customerId: String(customerId),
      couponTemplateId: couponForm.couponTemplateId,
      reason: couponForm.reason,
    });
    if (!issued) return;

    notifySuccess(t('couponGeneratedSuccess', { code: customer.customerNumber }));
    setCoupons(await fetchCoupons(customerId));
    setTab('coupon-history');
  }, [issueCoupon, customerId, couponForm, notifySuccess, t, customer.customerNumber, fetchCoupons]);

  const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
  const headStyle = { ...cellStyle, textAlign: 'left' } as const;

  return (
    <ModalShell
      titleId="customer-details-title"
      title={t('customerDetailsModalTitle')}
      subtitle={`${customer.firstName} ${customer.lastName} (${customer.customerNumber})`}
      onClose={onClose}
      error={data.customers.error}
    >
      <div className="modal-tabs">
        <button className={`btn ${tab === 'profile' ? 'btn-primary' : ''}`} type="button" onClick={() => setTab('profile')}>
          {t('customerModalTabProfile')}
        </button>
        <button className={`btn ${tab === 'balance' ? 'btn-primary' : ''}`} type="button" onClick={() => setTab('balance')}>
          {t('customerModalTabBalance')}
        </button>
        <button className={`btn ${tab === 'issue-coupon' ? 'btn-primary' : ''}`} type="button" onClick={() => setTab('issue-coupon')}>
          {t('customerModalTabCreateCoupon')}
        </button>
        <button className={`btn ${tab === 'coupon-history' ? 'btn-primary' : ''}`} type="button" onClick={() => setTab('coupon-history')}>
          {t('customerModalTabCouponHistory')}
        </button>
      </div>

      {loading && <div>{t('loading')}</div>}

      {!loading && tab === 'profile' && (
        <form onSubmit={(event) => { void handleSave(event); }} noValidate>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="form-group">
              <label htmlFor="editFirstName">{t('firstName')}</label>
              <input id="editFirstName" className="input" value={editForm.firstName} onChange={(event) => setEditForm((prev) => ({ ...prev, firstName: event.target.value }))} />
              <FieldMessage error={editErrors.firstName} />
            </div>
            <div className="form-group">
              <label htmlFor="editLastName">{t('lastName')}</label>
              <input id="editLastName" className="input" value={editForm.lastName} onChange={(event) => setEditForm((prev) => ({ ...prev, lastName: event.target.value }))} />
              <FieldMessage error={editErrors.lastName} />
            </div>
            <div className="form-group">
              <label htmlFor="editEmail">{t('email')}</label>
              <input id="editEmail" className="input" type="email" value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
              <FieldMessage error={editErrors.email} />
            </div>
            <div className="form-group">
              <label htmlFor="editCustomerNumber">{t('customerNumber')}</label>
              <input id="editCustomerNumber" className="input" value={editForm.customerNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, customerNumber: event.target.value }))} />
              <FieldMessage error={editErrors.customerNumber} />
            </div>
            <div className="form-group">
              <label htmlFor="editPhoneNumber">{t('phoneNumber')}</label>
              <input id="editPhoneNumber" className="input" value={editForm.phoneNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} />
              <FieldMessage error={editErrors.phoneNumber} />
            </div>
            <div className="form-group">
              <label htmlFor="editCountry">{t('country')}</label>
              <CountrySelect id="editCountry" value={editForm.country} onChange={(country) => setEditForm((prev) => ({ ...prev, country }))} />
              <FieldMessage error={editErrors.country} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{t('save')}</button>
          </div>
        </form>
      )}

      {!loading && tab === 'balance' && (
        <CustomerBalancePanel customer={customer} history={history} transactions={transactions} />
      )}

      {!loading && tab === 'issue-coupon' && (
        <form onSubmit={(event) => { void handleIssueCoupon(event); }}>
          <div className="form-group">
            <label htmlFor="customerCouponTemplate">{t('couponTemplate')}</label>
            <select
              id="customerCouponTemplate"
              className="input"
              value={couponForm.couponTemplateId}
              onChange={(event) => setCouponForm((prev) => ({ ...prev, couponTemplateId: event.target.value }))}
              required
            >
              <option value="">{t('selectTemplate')}</option>
              {couponTemplates
                .filter((template) => template.country === customer.country)
                .map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.couponPrefix} | {template.country} | {t('templateOptionValue')} {format.formatCurrency(template.couponValue, template.country)} | {t('templateOptionMin')} {format.formatCurrency(template.minimumPurchaseValue, template.country)} | {t('templateOptionPoints')} {format.formatNumber(template.requiredPoints)} | {template.validityDays} {t('templateOptionDays')}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="customerCouponReason">{t('reason')}</label>
            <select
              id="customerCouponReason"
              className="input"
              value={couponForm.reason}
              onChange={(event) => setCouponForm((prev) => ({ ...prev, reason: event.target.value }))}
              required
            >
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

      {!loading && tab === 'coupon-history' && (
        coupons.length === 0 ? (
          <p>{t('noCustomerCoupons')}</p>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '45vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headStyle}>{t('code')}</th>
                  <th style={headStyle}>{t('status')}</th>
                  <th style={headStyle}>{t('reason')}</th>
                  <th style={headStyle}>{t('createdAt')}</th>
                  <th style={headStyle}>{t('expiresAt')}</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td style={cellStyle}>{coupon.couponCode}</td>
                    <td style={cellStyle}>{statusLabel(coupon.status)}</td>
                    <td style={cellStyle}>{reasonLabel(coupon.reason)}</td>
                    <td style={cellStyle}>{format.formatDateTime(coupon.issuedAt)}</td>
                    <td style={cellStyle}>{format.formatDateTime(coupon.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </ModalShell>
  );
}
