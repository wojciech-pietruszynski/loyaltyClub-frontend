import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAppContext } from '../context/appContext';
import { FieldMessage } from './FieldMessage';
import type { NewPointsFormState } from '../types/ui';
import { hasErrors, validateNewPoints, type FieldErrors } from '../lib/validation';

export function AddPointsSection() {
  const { t, data, notifySuccess } = useAppContext();
  const { customers, ensureCustomers, addPoints } = data.customers;

  useEffect(() => { void ensureCustomers(); }, [ensureCustomers]);

  const [form, setForm] = useState<NewPointsFormState>({ customerId: '', points: '', description: t('purchaseProducts') });
  const [errors, setErrors] = useState<FieldErrors<NewPointsFormState>>({});

  const handleSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateNewPoints(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    if (await addPoints(form.customerId, form.points, form.description)) {
      notifySuccess(t('pointsAddedSuccess'));
      setForm({ customerId: '', points: '', description: t('purchaseProducts') });
      setErrors({});
    }
  }, [form, addPoints, notifySuccess, t]);

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>{t('tabAddPoints')}</h2>
      <form onSubmit={(event) => { void handleSubmit(event); }} noValidate>
        <div className="form-group">
          <label htmlFor="customerSelect">{t('chooseCustomer')}</label>
          <select
            id="customerSelect"
            className="input"
            value={form.customerId}
            onChange={(event) => setForm({ ...form, customerId: event.target.value })}
          >
            <option value="">{t('select')}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.firstName} {customer.lastName} ({customer.customerNumber})
              </option>
            ))}
          </select>
          <FieldMessage error={errors.customerId} />
        </div>
        <div className="form-group">
          <label htmlFor="pointsCount">{t('pointsCount')}</label>
          <input
            id="pointsCount"
            className="input"
            type="number"
            inputMode="numeric"
            value={form.points}
            onChange={(event) => setForm({ ...form, points: event.target.value })}
          />
          <FieldMessage error={errors.points} />
        </div>
        <div className="form-group">
          <label htmlFor="description">{t('description')}</label>
          <input
            id="description"
            className="input"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <FieldMessage error={errors.description} />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">{t('addPointsAction')}</button>
        </div>
      </form>
    </div>
  );
}
