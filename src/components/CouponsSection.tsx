import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useAppContext } from '../context/appContext';
import { CountrySelect } from './CountrySelect';
import { FieldMessage } from './FieldMessage';
import { ModalShell } from './ModalShell';
import type { Coupon } from '../types';
import type { CouponFormState, CouponTemplateFormState } from '../types/ui';
import { hasErrors, validateCouponForm, validateCouponTemplate, type FieldErrors } from '../lib/validation';

type CouponDialog = 'issue' | 'template' | 'browse' | 'browse-templates' | null;
type CouponFilterField = 'reason' | 'country' | 'status';

const ALL = 'ALL';

function emptyTemplateForm(country: string | null): CouponTemplateFormState {
  return {
    couponValue: '',
    minimumPurchaseValue: '',
    requiredPoints: '',
    country: country ?? '',
    validityDays: '',
    couponPrefix: '',
  };
}

/** Wartości dostępne w drugim polu filtra — zależą od wybranego pola. */
function filterValuesFor(coupons: Coupon[], field: CouponFilterField): string[] {
  return Array.from(new Set(coupons.map((coupon) => coupon[field]))).sort();
}

export function CouponsSection() {
  const { t, tPlural, format, session, data, reasonLabel, statusLabel, notifySuccess } = useAppContext();
  const { coupons, couponTemplates, error, setError, ensureCoupons, ensureTemplates, issueCoupon, createTemplate } = data.coupons;
  const { customers, ensureCustomers } = data.customers;

  useEffect(() => {
    void ensureCoupons();
    void ensureTemplates();
    void ensureCustomers();
  }, [ensureCoupons, ensureTemplates, ensureCustomers]);

  const [dialog, setDialog] = useState<CouponDialog>(null);

  const [couponForm, setCouponForm] = useState<CouponFormState>({ customerId: '', couponTemplateId: '', reason: 'POINTS_EXCHANGE' });
  const [couponErrors, setCouponErrors] = useState<FieldErrors<CouponFormState>>({});

  const [templateForm, setTemplateForm] = useState<CouponTemplateFormState>(() => emptyTemplateForm(session.country));
  const [templateErrors, setTemplateErrors] = useState<FieldErrors<CouponTemplateFormState>>({});

  const [codeSearch, setCodeSearch] = useState('');
  const [filterField, setFilterField] = useState<CouponFilterField>('reason');
  const [filterValue, setFilterValue] = useState(ALL);

  // Kontrolki filtrowania faktycznie zawężają listę. Wcześniej istniały
  // w interfejsie, ale nie wpływały na wyświetlane dane — orkiestrator
  // przekazywał do sekcji całą kolekcję i pustą listę wartości filtra.
  const filterValues = useMemo(() => filterValuesFor(coupons, filterField), [coupons, filterField]);

  const filteredCoupons = useMemo(() => {
    const needle = codeSearch.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const matchesCode = needle === '' || coupon.couponCode.toLowerCase().includes(needle);
      const matchesValue = filterValue === ALL || coupon[filterField] === filterValue;
      return matchesCode && matchesValue;
    });
  }, [coupons, codeSearch, filterField, filterValue]);

  const openDialog = (next: Exclude<CouponDialog, null>) => {
    setError(null);
    setDialog(next);
  };

  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, next: Exclude<CouponDialog, null>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDialog(next);
    }
  };

  const handleIssueCoupon = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateCouponForm(couponForm);
    setCouponErrors(validation);
    if (hasErrors(validation)) return;

    if (await issueCoupon(couponForm)) {
      const template = couponTemplates.find((item) => String(item.id) === couponForm.couponTemplateId);
      notifySuccess(t('couponGeneratedSuccess', { code: template?.couponPrefix ?? '' }));
      setDialog(null);
      setCouponForm({ customerId: '', couponTemplateId: '', reason: 'POINTS_EXCHANGE' });
      setCouponErrors({});
    }
  }, [couponForm, issueCoupon, couponTemplates, notifySuccess, t]);

  const handleCreateTemplate = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateCouponTemplate(templateForm);
    setTemplateErrors(validation);
    if (hasErrors(validation)) return;

    if (await createTemplate(templateForm)) {
      notifySuccess(t('couponTemplateSaved'));
      setDialog(null);
      setTemplateForm(emptyTemplateForm(session.country));
      setTemplateErrors({});
    }
  }, [templateForm, createTemplate, notifySuccess, t, session.country]);

  const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
  const headStyle = { ...cellStyle, textAlign: 'left' } as const;
  const numericStyle = { ...cellStyle, textAlign: 'right' } as const;

  const filterOptionLabel = (value: string): string => {
    if (filterField === 'reason' && (value === 'POINTS_EXCHANGE' || value === 'COMPLAINT')) {
      return reasonLabel(value);
    }
    if (filterField === 'status' && (value === 'ACTIVE' || value === 'USED' || value === 'EXPIRED')) {
      return statusLabel(value);
    }
    return value;
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

      {dialog === 'issue' && (
        <ModalShell titleId="coupon-issue-title" title={t('createCouponTitle')} onClose={() => setDialog(null)} error={error}>
          <form onSubmit={(event) => { void handleIssueCoupon(event); }} noValidate>
            <div className="form-group">
              <label htmlFor="couponCustomer">{t('customer')}</label>
              <select
                id="couponCustomer"
                className="input"
                value={couponForm.customerId}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, customerId: event.target.value }))}
              >
                <option value="">{t('select')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} ({customer.country}, {t('pointsShort')}: {format.formatNumber(customer.loyaltyPoints)})
                  </option>
                ))}
              </select>
              <FieldMessage error={couponErrors.customerId} />
            </div>
            <div className="form-group">
              <label htmlFor="couponTemplate">{t('couponTemplate')}</label>
              <select
                id="couponTemplate"
                className="input"
                value={couponForm.couponTemplateId}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, couponTemplateId: event.target.value }))}
              >
                <option value="">{t('selectTemplate')}</option>
                {couponTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.couponPrefix} | {template.country} | {t('templateOptionValue')} {format.formatCurrency(template.couponValue, template.country)} | {t('templateOptionMin')} {format.formatCurrency(template.minimumPurchaseValue, template.country)} | {t('templateOptionPoints')} {format.formatNumber(template.requiredPoints)} | {template.validityDays} {t('templateOptionDays')}
                  </option>
                ))}
              </select>
              <FieldMessage error={couponErrors.couponTemplateId} />
            </div>
            <div className="form-group">
              <label htmlFor="couponReason">{t('reason')}</label>
              <select
                id="couponReason"
                className="input"
                value={couponForm.reason}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, reason: event.target.value }))}
              >
                <option value="">{t('selectReason')}</option>
                <option value="POINTS_EXCHANGE">{t('reasonPointsExchange')}</option>
                <option value="COMPLAINT">{t('reasonComplaint')}</option>
              </select>
              <FieldMessage error={couponErrors.reason} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">{t('generateCoupon')}</button>
              <button className="btn" type="button" onClick={() => setDialog(null)}>{t('cancel')}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {dialog === 'template' && (
        <ModalShell titleId="coupon-template-title" title={t('createCouponTemplateTitle')} onClose={() => setDialog(null)} error={error}>
          <form onSubmit={(event) => { void handleCreateTemplate(event); }} noValidate>
            <div className="form-group">
              <label htmlFor="templateValue">{t('couponValue')}</label>
              <input id="templateValue" className="input" type="number" step="0.01" value={templateForm.couponValue} onChange={(event) => setTemplateForm((prev) => ({ ...prev, couponValue: event.target.value }))} />
              <FieldMessage error={templateErrors.couponValue} />
            </div>
            <div className="form-group">
              <label htmlFor="templateMinimum">{t('minimumPurchaseValue')}</label>
              <input id="templateMinimum" className="input" type="number" step="0.01" value={templateForm.minimumPurchaseValue} onChange={(event) => setTemplateForm((prev) => ({ ...prev, minimumPurchaseValue: event.target.value }))} />
              <FieldMessage error={templateErrors.minimumPurchaseValue} />
            </div>
            <div className="form-group">
              <label htmlFor="templatePoints">{t('requiredPoints')}</label>
              <input id="templatePoints" className="input" type="number" value={templateForm.requiredPoints} onChange={(event) => setTemplateForm((prev) => ({ ...prev, requiredPoints: event.target.value }))} />
              <FieldMessage error={templateErrors.requiredPoints} />
            </div>
            <div className="form-group">
              <label htmlFor="templateCountry">{t('country')}</label>
              <CountrySelect id="templateCountry" value={templateForm.country} onChange={(country) => setTemplateForm((prev) => ({ ...prev, country }))} />
              <FieldMessage error={templateErrors.country} />
            </div>
            <div className="form-group">
              <label htmlFor="templateValidity">{t('validityDays')}</label>
              <input id="templateValidity" className="input" type="number" value={templateForm.validityDays} onChange={(event) => setTemplateForm((prev) => ({ ...prev, validityDays: event.target.value }))} />
              <FieldMessage error={templateErrors.validityDays} />
            </div>
            <div className="form-group">
              <label htmlFor="templatePrefix">{t('couponPrefix')}</label>
              <select id="templatePrefix" className="input" value={templateForm.couponPrefix} onChange={(event) => setTemplateForm((prev) => ({ ...prev, couponPrefix: event.target.value }))}>
                <option value="">{t('selectPrefix')}</option>
                {data.promotions.availableCouponPrefixes.map((prefix) => (<option key={prefix} value={prefix}>{prefix}</option>))}
              </select>
              <FieldMessage error={templateErrors.couponPrefix} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">{t('save')}</button>
              <button className="btn" type="button" onClick={() => setDialog(null)}>{t('cancel')}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {dialog === 'browse' && (
        <ModalShell titleId="coupon-browse-title" title={t('browseCouponsTitle')} onClose={() => setDialog(null)} error={error}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="couponCodeSearch">{t('searchByCode')}</label>
              <input
                id="couponCodeSearch"
                className="input"
                type="search"
                value={codeSearch}
                onChange={(event) => setCodeSearch(event.target.value)}
                placeholder={t('searchCodePlaceholder')}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="couponFilterField">{t('filterBy')}</label>
              <select
                id="couponFilterField"
                className="input"
                value={filterField}
                onChange={(event) => {
                  setFilterField(event.target.value as CouponFilterField);
                  setFilterValue(ALL);
                }}
              >
                <option value="reason">{t('reason')}</option>
                <option value="country">{t('country')}</option>
                <option value="status">{t('status')}</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="couponFilterValue">{t('value')}</label>
              <select id="couponFilterValue" className="input" value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
                <option value={ALL}>{t('all')}</option>
                {filterValues.map((value) => (
                  <option key={value} value={value}>{filterOptionLabel(value)}</option>
                ))}
              </select>
            </div>
          </div>

          <p aria-live="polite" style={{ marginTop: 0 }}>
            {tPlural('couponsFound', filteredCoupons.length)}
            {(codeSearch !== '' || filterValue !== ALL) && (
              <button
                className="btn"
                type="button"
                style={{ marginLeft: '0.75rem' }}
                onClick={() => { setCodeSearch(''); setFilterValue(ALL); }}
              >
                {t('clearFilters')}
              </button>
            )}
          </p>

          {filteredCoupons.length === 0 ? (
            <p>{t('noCouponsForFilters')}</p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headStyle}>{t('code')}</th>
                    <th style={headStyle}>{t('customer')}</th>
                    <th style={headStyle}>{t('country')}</th>
                    <th style={numericStyle}>{t('value')}</th>
                    <th style={numericStyle}>{t('minPurchaseShort')}</th>
                    <th style={headStyle}>{t('reason')}</th>
                    <th style={headStyle}>{t('status')}</th>
                    <th style={headStyle}>{t('createdAt')}</th>
                    <th style={headStyle}>{t('expiresAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td style={cellStyle}>{coupon.couponCode}</td>
                      <td style={cellStyle}>{coupon.customerName}</td>
                      <td style={cellStyle}>{coupon.country}</td>
                      <td style={numericStyle}>{format.formatCurrency(coupon.couponValue, coupon.country)}</td>
                      <td style={numericStyle}>{format.formatCurrency(coupon.minimumPurchaseValue, coupon.country)}</td>
                      <td style={cellStyle}>{reasonLabel(coupon.reason)}</td>
                      <td style={cellStyle}>{statusLabel(coupon.status)}</td>
                      <td style={cellStyle}>{format.formatDateTime(coupon.issuedAt)}</td>
                      <td style={cellStyle}>{format.formatDateTime(coupon.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions">
            <button className="btn" type="button" onClick={() => setDialog(null)}>{t('close')}</button>
          </div>
        </ModalShell>
      )}

      {dialog === 'browse-templates' && (
        <ModalShell titleId="coupon-templates-browse-title" title={t('browseCouponTemplatesTitle')} onClose={() => setDialog(null)} error={error}>
          {couponTemplates.length === 0 ? (
            <p>{t('noCouponTemplates')}</p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headStyle}>{t('couponPrefix')}</th>
                    <th style={headStyle}>{t('country')}</th>
                    <th style={numericStyle}>{t('couponValue')}</th>
                    <th style={numericStyle}>{t('minimumPurchaseValue')}</th>
                    <th style={numericStyle}>{t('requiredPoints')}</th>
                    <th style={numericStyle}>{t('validityDays')}</th>
                  </tr>
                </thead>
                <tbody>
                  {couponTemplates.map((template) => (
                    <tr key={template.id}>
                      <td style={cellStyle}>{template.couponPrefix}</td>
                      <td style={cellStyle}>{template.country}</td>
                      <td style={numericStyle}>{format.formatCurrency(template.couponValue, template.country)}</td>
                      <td style={numericStyle}>{format.formatCurrency(template.minimumPurchaseValue, template.country)}</td>
                      <td style={numericStyle}>{format.formatNumber(template.requiredPoints)}</td>
                      <td style={numericStyle}>{format.formatNumber(template.validityDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions">
            <button className="btn" type="button" onClick={() => setDialog(null)}>{t('close')}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
