import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Info } from 'lucide-react';
import { useAppContext } from '../context/appContext';
import { CountrySelect } from './CountrySelect';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { FieldMessage } from './FieldMessage';
import { ModalShell } from './ModalShell';
import type { Customer } from '../types';
import type { NewCustomerFormState } from '../types/ui';
import { hasErrors, validateNewCustomer, type FieldErrors } from '../lib/validation';

type CustomerView = 'browse' | 'add' | null;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function emptyCustomerForm(country: string | null): NewCustomerFormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    customerNumber: '',
    phoneNumber: '',
    country: country ?? '',
    referrerCustomerNumber: '',
  };
}

function matchesSearch(customer: Customer, needle: string): boolean {
  const haystack = [
    customer.firstName,
    customer.lastName,
    customer.email,
    customer.customerNumber,
    customer.phoneNumber,
    customer.country,
  ].join(' ').toLowerCase();
  return haystack.includes(needle);
}

export function CustomersSection() {
  const { t, tPlural, format, session, data, notifySuccess } = useAppContext();
  const { customers, error, ensureCustomers, addCustomer } = data.customers;

  useEffect(() => { void ensureCustomers(); }, [ensureCustomers]);

  const [view, setView] = useState<CustomerView>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [form, setForm] = useState<NewCustomerFormState>(() => emptyCustomerForm(session.country));
  const [errors, setErrors] = useState<FieldErrors<NewCustomerFormState>>({});

  // Wyszukiwanie i stronicowanie po stronie klienta. Kartoteka rośnie szybciej,
  // niż backend przestaje wyrabiać wydajnościowo — stronicowanie serwerowe jest
  // osobnym zadaniem po stronie API.
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle === '' ? customers : customers.filter((customer) => matchesSearch(customer, needle));
  }, [customers, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const handleAddCustomer = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateNewCustomer(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    if (await addCustomer(form)) {
      notifySuccess(t('customerAddedSuccess'));
      setForm(emptyCustomerForm(session.country));
      setErrors({});
      setView(null);
    }
  }, [form, addCustomer, notifySuccess, t, session.country]);

  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
  const headStyle = { ...cellStyle, textAlign: 'left' } as const;

  return (
    <div>
      <div className="grid coupon-actions-grid">
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={() => setView('browse')}
          onKeyDown={(event) => handleTileKeyDown(event, () => setView('browse'))}
        >
          <h3>{t('customersBrowseTileTitle')}</h3>
          <p>{t('customersBrowseTileDesc')}</p>
        </div>
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={() => setView('add')}
          onKeyDown={(event) => handleTileKeyDown(event, () => setView('add'))}
        >
          <h3>{t('customersAddTileTitle')}</h3>
          <p>{t('customersAddTileDesc')}</p>
        </div>
      </div>

      {view === 'browse' && (
        <ModalShell titleId="customers-browse-title" title={t('tabCustomers')} onClose={() => setView(null)} error={error}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="customerSearch">{t('searchCustomers')}</label>
              <input
                id="customerSearch"
                className="input"
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder={t('searchCustomersPlaceholder')}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="customerPageSize">{t('rowsPerPage')}</label>
              <select
                id="customerPageSize"
                className="input"
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, alignSelf: 'end' }}>
              <span aria-live="polite">{tPlural('customersFound', filtered.length)}</span>
            </div>
          </div>

          {customers.length === 0 ? (
            <p>{t('noCustomersInSystem')}</p>
          ) : filtered.length === 0 ? (
            <p>{t('noCustomersForFilters')}</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={headStyle}>{t('firstName')}</th>
                      <th style={headStyle}>{t('lastName')}</th>
                      <th style={headStyle}>{t('email')}</th>
                      <th style={headStyle}>{t('customerNumberShort')}</th>
                      <th style={headStyle}>{t('phone')}</th>
                      <th style={headStyle}>{t('country')}</th>
                      <th style={{ ...cellStyle, textAlign: 'right' }}>{t('points')}</th>
                      <th style={headStyle}>{t('loyaltyTier')}</th>
                      <th style={headStyle}>{t('referralCodeShort')}</th>
                      <th style={cellStyle} />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((customer) => (
                      <tr key={customer.id}>
                        <td style={cellStyle}>{customer.firstName}</td>
                        <td style={cellStyle}>{customer.lastName}</td>
                        <td style={cellStyle}>{customer.email}</td>
                        <td style={cellStyle}>{customer.customerNumber}</td>
                        <td style={cellStyle}>{customer.phoneNumber}</td>
                        <td style={cellStyle}>{customer.country}</td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>{format.formatNumber(customer.loyaltyPoints)}</td>
                        <td style={cellStyle}>{customer.loyaltyTierCode ?? '—'}</td>
                        <td style={cellStyle}>{customer.referralCode ?? '—'}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <button
                            className="btn icon-btn"
                            type="button"
                            aria-label={t('customerDetailsModalTitle')}
                            title={t('customerDetailsModalTitle')}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Info size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  className="btn"
                  type="button"
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentPage <= 1}
                >
                  {t('previousPage')}
                </button>
                <span aria-live="polite">{t('pageInfo', { page: currentPage, pages: pageCount })}</span>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setPage((previous) => Math.min(pageCount, previous + 1))}
                  disabled={currentPage >= pageCount}
                >
                  {t('nextPage')}
                </button>
              </div>
            </>
          )}

          <div className="form-actions">
            <button className="btn" type="button" onClick={() => setView(null)}>{t('close')}</button>
          </div>
        </ModalShell>
      )}

      {view === 'add' && (
        <ModalShell titleId="customer-add-title" title={t('tabAddCustomer')} onClose={() => setView(null)} maxWidth="520px" error={error}>
          <form onSubmit={(event) => { void handleAddCustomer(event); }} noValidate>
            <div className="form-group">
              <label htmlFor="firstName">{t('firstName')}</label>
              <input id="firstName" className="input" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              <FieldMessage error={errors.firstName} />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">{t('lastName')}</label>
              <input id="lastName" className="input" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
              <FieldMessage error={errors.lastName} />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('email')}</label>
              <input id="email" className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <FieldMessage error={errors.email} />
            </div>
            <div className="form-group">
              <label htmlFor="customerNumber">{t('customerNumber')}</label>
              <input id="customerNumber" className="input" value={form.customerNumber} onChange={(event) => setForm({ ...form, customerNumber: event.target.value })} />
              <FieldMessage error={errors.customerNumber} />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">{t('phoneNumber')}</label>
              <input id="phoneNumber" className="input" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} />
              <FieldMessage error={errors.phoneNumber} />
            </div>
            <div className="form-group">
              <label htmlFor="country">{t('country')}</label>
              <CountrySelect id="country" value={form.country} onChange={(country) => setForm({ ...form, country })} />
              <FieldMessage error={errors.country} />
            </div>
            <div className="form-group">
              <label htmlFor="referrerCustomerNumber">{t('referrerCustomerNumber')}</label>
              <input
                id="referrerCustomerNumber"
                className="input"
                value={form.referrerCustomerNumber}
                onChange={(event) => setForm({ ...form, referrerCustomerNumber: event.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">{t('addCustomer')}</button>
              <button className="btn" type="button" onClick={() => setView(null)}>{t('cancel')}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {selectedCustomer && (
        <CustomerDetailsModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  );
}
