import type { FormEvent } from 'react';
import type { Customer } from '../types';
import type { NewPointsFormState, StateSetter, Translator } from '../types/ui';

type AddPointsSectionProps = {
  t: Translator;
  newPoints: NewPointsFormState;
  setNewPoints: StateSetter<NewPointsFormState>;
  customers: Customer[];
  handleAddPoints: (e: FormEvent) => Promise<void>;
};

export function AddPointsSection({
  t,
  newPoints,
  setNewPoints,
  customers,
  handleAddPoints,
}: AddPointsSectionProps) {
  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>{t('tabAddPoints')}</h2>
      <form onSubmit={(event) => { void handleAddPoints(event); }}>
        <div className="form-group">
          <label htmlFor="customerSelect">{t('chooseCustomer')}</label>
          <select id="customerSelect" className="input" value={newPoints.customerId} onChange={(event) => setNewPoints({ ...newPoints, customerId: event.target.value })} required>
            <option value="">{t('select')}</option>
            {customers.map((customer) => (<option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName} ({customer.customerNumber})</option>))}
          </select>
        </div>
        <div className="form-group"><label htmlFor="pointsCount">{t('pointsCount')}</label><input id="pointsCount" className="input" type="number" value={newPoints.points} onChange={(event) => setNewPoints({ ...newPoints, points: parseInt(event.target.value, 10) || 0 })} required /></div>
        <div className="form-group"><label htmlFor="description">{t('description')}</label><input id="description" className="input" value={newPoints.description} onChange={(event) => setNewPoints({ ...newPoints, description: event.target.value })} required /></div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">{t('addPointsAction')}</button>
        </div>
      </form>
    </div>
  );
}
