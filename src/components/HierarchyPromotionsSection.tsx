import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PenSquare } from 'lucide-react';
import { useAppContext } from '../context/appContext';
import { CountrySelect } from './CountrySelect';
import { FieldMessage } from './FieldMessage';
import { ModalShell } from './ModalShell';
import type { HierarchyPromotion } from '../types';
import type { HierarchyPromotionFormState } from '../types/ui';
import { hasErrors, validateHierarchyPromotion, type FieldErrors } from '../lib/validation';

type PromotionView = 'create' | 'browse' | null;

function emptyForm(country: string | null): HierarchyPromotionFormState {
  return {
    id: null,
    name: '',
    country: country ?? '',
    hierarchy: '',
    productClass: '',
    subclass: '',
    type: 'MULTIPLIER',
    multiplier: '',
    startsAt: '',
    endsAt: '',
    enabled: true,
  };
}

export function HierarchyPromotionsSection() {
  const { t, format, session, data, notifySuccess } = useAppContext();
  const { hierarchyPromotions, loading, error, ensureHierarchyPromotions, saveHierarchyPromotion, toggleHierarchyPromotion } = data.hierarchyPromotions;

  useEffect(() => { void ensureHierarchyPromotions(); }, [ensureHierarchyPromotions]);

  const [view, setView] = useState<PromotionView>(null);
  const [form, setForm] = useState<HierarchyPromotionFormState>(() => emptyForm(session.country));
  const [errors, setErrors] = useState<FieldErrors<HierarchyPromotionFormState>>({});

  const openCreateView = () => {
    setForm(emptyForm(session.country));
    setErrors({});
    setView('create');
  };

  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handleSave = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateHierarchyPromotion(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    if (await saveHierarchyPromotion(form, form.id ?? undefined)) {
      notifySuccess(t(form.id ? 'hierarchyPromotionUpdatedSuccess' : 'hierarchyPromotionCreatedSuccess'));
      setView(null);
    }
  }, [form, saveHierarchyPromotion, notifySuccess, t]);

  const handleEdit = (promotion: HierarchyPromotion) => {
    setForm({
      id: promotion.id,
      name: promotion.name,
      country: promotion.country,
      hierarchy: promotion.hierarchy ?? '',
      productClass: promotion.productClass ?? '',
      subclass: promotion.subclass ?? '',
      type: promotion.type,
      multiplier: promotion.multiplier != null ? String(promotion.multiplier) : '',
      startsAt: promotion.startsAt.slice(0, 16),
      endsAt: promotion.endsAt ? promotion.endsAt.slice(0, 16) : '',
      enabled: promotion.enabled,
    });
    setErrors({});
    setView('create');
  };

  const handleToggle = useCallback(async (promotion: HierarchyPromotion, enabled: boolean) => {
    if (await toggleHierarchyPromotion(promotion.id, enabled)) {
      notifySuccess(t(enabled ? 'hierarchyPromotionEnabledSuccess' : 'hierarchyPromotionDisabledSuccess'));
    }
  }, [toggleHierarchyPromotion, notifySuccess, t]);

  const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
  const headStyle = { ...cellStyle, textAlign: 'left' } as const;
  const optionalHint = <small style={{ color: 'var(--text-light)' }}>{t('hierarchyCodeOptional')}</small>;

  return (
    <div>
      <div className="grid coupon-actions-grid">
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={openCreateView}
          onKeyDown={(event) => handleTileKeyDown(event, openCreateView)}
        >
          <h3>{t('hierarchyPromotionCreateTileTitle')}</h3>
          <p>{t('hierarchyPromotionCreateTileDesc')}</p>
        </div>
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={() => setView('browse')}
          onKeyDown={(event) => handleTileKeyDown(event, () => setView('browse'))}
        >
          <h3>{t('hierarchyPromotionBrowseTileTitle')}</h3>
          <p>{t('hierarchyPromotionBrowseTileDesc')}</p>
        </div>
      </div>

      {view === 'create' && (
        <ModalShell
          titleId="hierarchy-promo-create-title"
          title={form.id === null ? t('hierarchyPromotionCreateTitle') : t('hierarchyPromotionEditTitle')}
          onClose={() => setView(null)}
          error={error}
        >
          <form onSubmit={(event) => { void handleSave(event); }} noValidate>
            <div className="form-group">
              <label htmlFor="hierarchyName">{t('hierarchyPromotionName')}</label>
              <input id="hierarchyName" className="input" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <FieldMessage error={errors.name} />
            </div>
            <div className="form-group">
              <label htmlFor="hierarchyCountry">{t('country')}</label>
              <CountrySelect id="hierarchyCountry" value={form.country} onChange={(country) => setForm((prev) => ({ ...prev, country }))} />
              <FieldMessage error={errors.country} />
            </div>
            <div className="form-group">
              <label htmlFor="hierarchyType">{t('hierarchyPromotionType')}</label>
              <select
                id="hierarchyType"
                className="input"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as HierarchyPromotionFormState['type'] }))}
              >
                <option value="MULTIPLIER">{t('hierarchyPromotionTypeMultiplier')}</option>
                <option value="EXCLUSION">{t('hierarchyPromotionTypeExclusion')}</option>
              </select>
            </div>
            {form.type === 'MULTIPLIER' && (
              <div className="form-group">
                <label htmlFor="hierarchyMultiplier">{t('multiplier')}</label>
                <input
                  id="hierarchyMultiplier"
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.multiplier}
                  onChange={(event) => setForm((prev) => ({ ...prev, multiplier: event.target.value }))}
                />
                <FieldMessage error={errors.multiplier} />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="hierarchyCode">{t('hierarchyCode')} {optionalHint}</label>
              <input id="hierarchyCode" className="input" value={form.hierarchy} onChange={(event) => setForm((prev) => ({ ...prev, hierarchy: event.target.value }))} placeholder="np. 42" />
            </div>
            <div className="form-group">
              <label htmlFor="hierarchyProductClass">{t('productClass')} {optionalHint}</label>
              <input id="hierarchyProductClass" className="input" value={form.productClass} onChange={(event) => setForm((prev) => ({ ...prev, productClass: event.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="hierarchySubclass">{t('subclass')} {optionalHint}</label>
              <input id="hierarchySubclass" className="input" value={form.subclass} onChange={(event) => setForm((prev) => ({ ...prev, subclass: event.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="hierarchyStartsAt">{t('hierarchyPromotionStartsAt')}</label>
              <DatePicker
                id="hierarchyStartsAt"
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                value={form.startsAt ? dayjs(form.startsAt) : null}
                onChange={(date) => setForm((prev) => ({ ...prev, startsAt: date ? date.format('YYYY-MM-DDTHH:mm') : '' }))}
                style={{ width: '100%' }}
                needConfirm={false}
              />
              <FieldMessage error={errors.startsAt} />
            </div>
            <div className="form-group">
              <label htmlFor="hierarchyEndsAt">{t('hierarchyPromotionEndsAt')}</label>
              <DatePicker
                id="hierarchyEndsAt"
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                value={form.endsAt ? dayjs(form.endsAt) : null}
                onChange={(date) => setForm((prev) => ({ ...prev, endsAt: date ? date.format('YYYY-MM-DDTHH:mm') : '' }))}
                style={{ width: '100%' }}
                needConfirm={false}
                allowClear
              />
              <FieldMessage error={errors.endsAt} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? t('loading') : t('save')}
              </button>
              <button className="btn" type="button" onClick={() => setView(null)}>{t('cancel')}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {view === 'browse' && (
        <ModalShell titleId="hierarchy-promo-list-title" title={t('hierarchyPromotionListTitle')} onClose={() => setView(null)} error={error}>
          {hierarchyPromotions.length === 0 ? (
            <p>{t('noHierarchyPromotions')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headStyle}>{t('hierarchyPromotionName')}</th>
                    <th style={headStyle}>{t('country')}</th>
                    <th style={headStyle}>{t('hierarchyPromotionType')}</th>
                    <th style={headStyle}>{t('hierarchyCode')}</th>
                    <th style={headStyle}>{t('productClass')}</th>
                    <th style={headStyle}>{t('subclass')}</th>
                    <th style={{ ...cellStyle, textAlign: 'right' }}>{t('multiplier')}</th>
                    <th style={headStyle}>{t('hierarchyPromotionStartsAt')}</th>
                    <th style={headStyle}>{t('hierarchyPromotionEndsAt')}</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }}>{t('status')}</th>
                    <th style={cellStyle} />
                  </tr>
                </thead>
                <tbody>
                  {hierarchyPromotions.map((promotion) => (
                    <tr key={promotion.id}>
                      <td style={cellStyle}>{promotion.name}</td>
                      <td style={cellStyle}>{promotion.country}</td>
                      <td style={cellStyle}>
                        {promotion.type === 'MULTIPLIER' ? t('hierarchyPromotionTypeMultiplier') : t('hierarchyPromotionTypeExclusion')}
                      </td>
                      <td style={cellStyle}>{promotion.hierarchy ?? '-'}</td>
                      <td style={cellStyle}>{promotion.productClass ?? '-'}</td>
                      <td style={cellStyle}>{promotion.subclass ?? '-'}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>
                        {promotion.multiplier != null ? `x${format.formatNumber(promotion.multiplier)}` : '-'}
                      </td>
                      <td style={cellStyle}>{format.formatDateTime(promotion.startsAt)}</td>
                      <td style={cellStyle}>{format.formatDateTime(promotion.endsAt)}</td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={promotion.enabled}
                            aria-label={promotion.name}
                            onChange={(event) => { void handleToggle(promotion, event.target.checked); }}
                          />
                          <span className="slider" />
                        </label>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <button
                          className="btn icon-btn"
                          type="button"
                          onClick={() => handleEdit(promotion)}
                          title={t('edit')}
                          aria-label={t('edit')}
                        >
                          <PenSquare size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions">
            <button className="btn" type="button" onClick={() => setView(null)}>{t('close')}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
