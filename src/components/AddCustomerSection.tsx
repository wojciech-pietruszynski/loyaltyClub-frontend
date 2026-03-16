import type { FormEvent } from 'react';
import type { NewCustomerFormState, StateSetter, Translator } from '../types/ui';

type AddCustomerSectionProps = {
  t: Translator;
  newCustomer: NewCustomerFormState;
  setNewCustomer: StateSetter<NewCustomerFormState>;
  availableCountries: string[];
  handleAddCustomer: (e: FormEvent) => Promise<void>;
};

export function AddCustomerSection({
  t,
  newCustomer,
  setNewCustomer,
  availableCountries,
  handleAddCustomer,
}: AddCustomerSectionProps) {
  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>{t('tabAddCustomer')}</h2>
      <form onSubmit={(event) => { void handleAddCustomer(event); }}>
        <div className="form-group"><label>{t('firstName')}</label><input className="input" value={newCustomer.firstName} onChange={(event) => setNewCustomer((prev) => ({ ...prev, firstName: event.target.value }))} required /></div>
        <div className="form-group"><label>{t('lastName')}</label><input className="input" value={newCustomer.lastName} onChange={(event) => setNewCustomer((prev) => ({ ...prev, lastName: event.target.value }))} required /></div>
        <div className="form-group"><label>{t('email')}</label><input className="input" type="email" value={newCustomer.email} onChange={(event) => setNewCustomer((prev) => ({ ...prev, email: event.target.value }))} required /></div>
        <div className="form-group"><label>{t('customerNumber')}</label><input className="input" value={newCustomer.customerNumber} onChange={(event) => setNewCustomer((prev) => ({ ...prev, customerNumber: event.target.value }))} required /></div>
        <div className="form-group"><label>{t('phoneNumber')}</label><input className="input" value={newCustomer.phoneNumber} onChange={(event) => setNewCustomer((prev) => ({ ...prev, phoneNumber: event.target.value }))} required /></div>
        <div className="form-group">
          <label>{t('country')}</label>
          <select className="input" value={newCustomer.country} onChange={(event) => setNewCustomer((prev) => ({ ...prev, country: event.target.value }))} required>
            <option value="">{t('selectCountry')}</option>
            {availableCountries.map((countryCode) => (<option key={countryCode} value={countryCode}>{countryCode}</option>))}
          </select>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">{t('addCustomer')}</button>
        </div>
      </form>
    </div>
  );
}
