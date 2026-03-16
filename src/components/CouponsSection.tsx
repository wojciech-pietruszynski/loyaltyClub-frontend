import type { FormEvent, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { Coupon, CouponTemplate, Customer } from '../types';
import type { CouponFormState, CouponTemplateFormState, StateSetter, Translator } from '../types/ui';

type CouponDialog = 'issue' | 'template' | 'browse' | 'browse-templates' | null;

type CouponsSectionProps = {
  t: Translator;
  setCouponDialog: StateSetter<CouponDialog>;
  setCouponDialogError: StateSetter<string | null>;
  closeCouponDialog: () => void;
  couponDialog: CouponDialog;
  couponDialogError: string | null;
  handleIssueCoupon: (e: FormEvent) => Promise<void>;
  couponForm: CouponFormState;
  setCouponForm: StateSetter<CouponFormState>;
  customers: Customer[];
  couponTemplates: CouponTemplate[];
  handleCreateCouponTemplate: (e: FormEvent) => Promise<void>;
  couponTemplateForm: CouponTemplateFormState;
  setCouponTemplateForm: StateSetter<CouponTemplateFormState>;
  availableCountries: string[];
  availableCouponPrefixes: string[];
  couponCodeSearch: string;
  setCouponCodeSearch: StateSetter<string>;
  couponSortBy: 'reason' | 'country' | 'status';
  setCouponSortBy: StateSetter<'reason' | 'country' | 'status'>;
  couponSortValue: string;
  setCouponSortValue: StateSetter<string>;
  couponSortValues: string[];
  filteredCoupons: Coupon[];
  reasonLabel: (reason: 'POINTS_EXCHANGE' | 'COMPLAINT') => string;
  statusLabel: (status: 'ACTIVE' | 'USED' | 'EXPIRED') => string;
  formatDateTime: (value: string) => string;
};

export function CouponsSection(props: CouponsSectionProps) {
  const {
    t,
    setCouponDialog,
    setCouponDialogError,
    closeCouponDialog,
    couponDialog,
    couponDialogError,
    handleIssueCoupon,
    couponForm,
    setCouponForm,
    customers,
    couponTemplates,
    handleCreateCouponTemplate,
    couponTemplateForm,
    setCouponTemplateForm,
    availableCountries,
    availableCouponPrefixes,
    couponCodeSearch,
    setCouponCodeSearch,
    couponSortBy,
    setCouponSortBy,
    couponSortValue,
    setCouponSortValue,
    couponSortValues,
    filteredCoupons,
    reasonLabel,
    statusLabel,
    formatDateTime,
  } = props;

  const openDialog = (dialog: Exclude<CouponDialog, null>) => {
    setCouponDialogError(null);
    setCouponDialog(dialog);
  };

  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, dialog: Exclude<CouponDialog, null>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDialog(dialog);
    }
  };

  return (
    <div>
      <div className="grid coupon-actions-grid">
        <div className="card action-tile" style={{ textAlign: 'center' }} role="button" tabIndex={0} onClick={() => openDialog('issue')} onKeyDown={(event) => handleTileKeyDown(event, 'issue')}>
          <h3>{t('createCouponTileTitle')}</h3>
          <p>{t('createCouponTileDesc')}</p>
        </div>
        <div className="card action-tile" style={{ textAlign: 'center' }} role="button" tabIndex={0} onClick={() => openDialog('template')} onKeyDown={(event) => handleTileKeyDown(event, 'template')}>
          <h3>{t('createTemplateTileTitle')}</h3>
          <p>{t('createTemplateTileDesc')}</p>
        </div>
        <div className="card action-tile" style={{ textAlign: 'center' }} role="button" tabIndex={0} onClick={() => openDialog('browse')} onKeyDown={(event) => handleTileKeyDown(event, 'browse')}>
          <h3>{t('browseCouponsTileTitle')}</h3>
          <p>{t('browseCouponsTileDesc')}</p>
        </div>
        <div className="card action-tile" style={{ textAlign: 'center' }} role="button" tabIndex={0} onClick={() => openDialog('browse-templates')} onKeyDown={(event) => handleTileKeyDown(event, 'browse-templates')}>
          <h3>{t('toolsBrowseTemplatesTileTitle')}</h3>
          <p>{t('toolsBrowseTemplatesTileDesc')}</p>
        </div>
      </div>

      {couponDialog === 'issue' && (
        <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
          <div className="card modal-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-issue-title">
            <div className="modal-header">
              <h2 id="coupon-issue-title" style={{ margin: 0 }}>{t('createCouponTitle')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            {couponDialogError && <div className="error-msg" style={{ marginBottom: '1rem' }}>{couponDialogError}</div>}
            <form onSubmit={(event) => { void handleIssueCoupon(event); }}>
              <div className="form-group">
                <label>{t('customer')}</label>
                <select className="input" value={couponForm.customerId} onChange={(event) => setCouponForm((prev) => ({ ...prev, customerId: event.target.value }))} required>
                  <option value="">{t('select')}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName} ({customer.country}, {t('pointsShort')}: {customer.loyaltyPoints})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('couponTemplate')}</label>
                <select className="input" value={couponForm.couponTemplateId} onChange={(event) => setCouponForm((prev) => ({ ...prev, couponTemplateId: event.target.value }))} required>
                  <option value="">{t('selectTemplate')}</option>
                  {couponTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.couponPrefix} | {template.country} | {t('templateOptionValue')} {template.couponValue} | {t('templateOptionMin')} {template.minimumPurchaseValue} | {t('templateOptionPoints')} {template.requiredPoints} | {template.validityDays} {t('templateOptionDays')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('reason')}</label>
                <select className="input" value={couponForm.reason} onChange={(event) => setCouponForm((prev) => ({ ...prev, reason: event.target.value }))} required>
                  <option value="">{t('selectReason')}</option>
                  <option value="POINTS_EXCHANGE">{t('reasonPointsExchange')}</option>
                  <option value="COMPLAINT">{t('reasonComplaint')}</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{t('generateCoupon')}</button>
                <button className="btn" type="button" onClick={closeCouponDialog}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {couponDialog === 'template' && (
        <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
          <div className="card modal-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-template-title">
            <div className="modal-header">
              <h2 id="coupon-template-title" style={{ margin: 0 }}>{t('createCouponTemplateTitle')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            {couponDialogError && <div className="error-msg" style={{ marginBottom: '1rem' }}>{couponDialogError}</div>}
            <form onSubmit={(event) => { void handleCreateCouponTemplate(event); }}>
              <div className="form-group"><label>{t('couponValue')}</label><input className="input" type="number" step="0.01" value={couponTemplateForm.couponValue} onChange={(event) => setCouponTemplateForm((prev) => ({ ...prev, couponValue: event.target.value }))} required /></div>
              <div className="form-group"><label>{t('minimumPurchaseValue')}</label><input className="input" type="number" step="0.01" value={couponTemplateForm.minimumPurchaseValue} onChange={(event) => setCouponTemplateForm((prev) => ({ ...prev, minimumPurchaseValue: event.target.value }))} required /></div>
              <div className="form-group"><label>{t('requiredPoints')}</label><input className="input" type="number" value={couponTemplateForm.requiredPoints} onChange={(event) => setCouponTemplateForm((prev) => ({ ...prev, requiredPoints: event.target.value }))} required /></div>
              <div className="form-group">
                <label>{t('country')}</label>
                <select className="input" value={couponTemplateForm.country} onChange={(event) => setCouponTemplateForm((prev) => ({ ...prev, country: event.target.value }))} required>
                  <option value="">{t('selectCountry')}</option>
                  {availableCountries.map((countryCode) => (<option key={countryCode} value={countryCode}>{countryCode}</option>))}
                </select>
              </div>
              <div className="form-group"><label>{t('validityDays')}</label><input className="input" type="number" value={couponTemplateForm.validityDays} onChange={(event) => setCouponTemplateForm((prev) => ({ ...prev, validityDays: event.target.value }))} required /></div>
              <div className="form-group">
                <label>{t('couponPrefix')}</label>
                <select className="input" value={couponTemplateForm.couponPrefix} onChange={(event) => setCouponTemplateForm((prev) => ({ ...prev, couponPrefix: event.target.value }))} required>
                  <option value="">{t('selectPrefix')}</option>
                  {availableCouponPrefixes.map((prefix) => (<option key={prefix} value={prefix}>{prefix}</option>))}
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{t('save')}</button>
                <button className="btn" type="button" onClick={closeCouponDialog}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {couponDialog === 'browse' && (
        <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
          <div className="card modal-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-browse-title">
            <div className="modal-header">
              <h2 id="coupon-browse-title" style={{ margin: 0 }}>{t('browseCouponsTitle')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>{t('searchByCode')}</label>
                <input
                  className="input"
                  value={couponCodeSearch}
                  onChange={(event) => setCouponCodeSearch(event.target.value)}
                  placeholder={t('searchCodePlaceholder')}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>{t('sortBy')}</label>
                <select
                  className="input"
                  value={couponSortBy}
                  onChange={(event) => {
                    setCouponSortBy(event.target.value as 'reason' | 'country' | 'status');
                    setCouponSortValue('ALL');
                  }}
                >
                  <option value="reason">{t('reason')}</option>
                  <option value="country">{t('country')}</option>
                  <option value="status">{t('status')}</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>{t('value')}</label>
                <select className="input" value={couponSortValue} onChange={(event) => setCouponSortValue(event.target.value)}>
                  <option value="ALL">{t('all')}</option>
                  {couponSortValues.map((value) => (
                    <option key={value} value={value}>
                      {couponSortBy === 'reason' && (value === 'POINTS_EXCHANGE' || value === 'COMPLAINT')
                        ? reasonLabel(value)
                        : couponSortBy === 'status' && (value === 'ACTIVE' || value === 'USED' || value === 'EXPIRED')
                          ? statusLabel(value)
                        : value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredCoupons.length === 0 ? (
              <p>{t('noCouponsForFilters')}</p>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('code')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('customer')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('value')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('minPurchaseShort')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('reason')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('createdAt')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('expiresAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.couponCode}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.customerName}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.country}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{coupon.couponValue}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{coupon.minimumPurchaseValue}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{reasonLabel(coupon.reason)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{statusLabel(coupon.status)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(coupon.issuedAt)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(coupon.expiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-actions">
              <button className="btn" type="button" onClick={closeCouponDialog}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {couponDialog === 'browse-templates' && (
        <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
          <div className="card modal-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-templates-browse-title">
            <div className="modal-header">
              <h2 id="coupon-templates-browse-title" style={{ margin: 0 }}>{t('browseCouponTemplatesTitle')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            {couponTemplates.length === 0 ? (
              <p>{t('noCouponTemplates')}</p>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('couponPrefix')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('couponValue')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('minimumPurchaseValue')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('requiredPoints')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('validityDays')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponTemplates.map((template) => (
                      <tr key={template.id}>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{template.couponPrefix}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{template.country}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.couponValue}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.minimumPurchaseValue}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.requiredPoints}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.validityDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="form-actions">
              <button className="btn" type="button" onClick={closeCouponDialog}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
