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
        <div className="form-group"><label htmlFor="firstName">{t('firstName')}</label><input id="firstName" className="input" value={newCustomer.firstName} onChange={(event) => setNewCustomer({ ...newCustomer, firstName: event.target.value })} required /></div>
        <div className="form-group"><label htmlFor="lastName">{t('lastName')}</label><input id="lastName" className="input" value={newCustomer.lastName} onChange={(event) => setNewCustomer({ ...newCustomer, lastName: event.target.value })} required /></div>
        <div className="form-group"><label htmlFor="email">{t('email')}</label><input id="email" className="input" type="email" value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} required /></div>
        <div className="form-group"><label htmlFor="customerNumber">{t('customerNumber')}</label><input id="customerNumber" className="input" value={newCustomer.customerNumber} onChange={(event) => setNewCustomer({ ...newCustomer, customerNumber: event.target.value })} required /></div>
        <div className="form-group"><label htmlFor="phoneNumber">{t('phoneNumber')}</label><input id="phoneNumber" className="input" value={newCustomer.phoneNumber} onChange={(event) => setNewCustomer({ ...newCustomer, phoneNumber: event.target.value })} required /></div>
        <div className="form-group">
          <label htmlFor="country">{t('country')}</label>
          <select id="country" className="input" value={newCustomer.country} onChange={(event) => setNewCustomer({ ...newCustomer, country: event.target.value })} required>
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
