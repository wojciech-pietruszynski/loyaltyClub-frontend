import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PenSquare } from 'lucide-react';
import { useAppContext } from '../context/appContext';
import { CountrySelect } from './CountrySelect';
import { FieldMessage } from './FieldMessage';
import { ModalShell } from './ModalShell';
import type { StorePromotion } from '../types';
import type { PromotionFormState } from '../types/ui';
import { hasErrors, validatePromotion, type FieldErrors } from '../lib/validation';

type PromotionView = 'create' | 'browse' | null;

function emptyPromotionForm(country: string | null): PromotionFormState {
  return { id: null, name: '', country: country ?? '', pointsPerCurrency: '', startsAt: '', endsAt: '', enabled: true };
}

export function StorePromotionsSection() {
  const { t, format, session, data, notifySuccess } = useAppContext();
  const { storePromotions, loading, error, ensurePromotions, savePromotion, togglePromotion } = data.promotions;

  useEffect(() => { void ensurePromotions(); }, [ensurePromotions]);

  const [view, setView] = useState<PromotionView>(null);
  const [form, setForm] = useState<PromotionFormState>(() => emptyPromotionForm(session.country));
  const [errors, setErrors] = useState<FieldErrors<PromotionFormState>>({});

  const openCreateView = () => {
    setForm(emptyPromotionForm(session.country));
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
    const validation = validatePromotion(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    if (await savePromotion(form, form.id ?? undefined)) {
      notifySuccess(t(form.id ? 'promotionUpdatedSuccess' : 'promotionCreatedSuccess'));
      setView(null);
    }
  }, [form, savePromotion, notifySuccess, t]);

  const handleEdit = (promotion: StorePromotion) => {
    setForm({
      id: promotion.id,
      name: promotion.name,
      country: promotion.country,
      pointsPerCurrency: String(promotion.pointsPerCurrency),
      startsAt: promotion.startsAt.slice(0, 16),
      endsAt: promotion.endsAt ? promotion.endsAt.slice(0, 16) : '',
      enabled: promotion.enabled,
    });
    setErrors({});
    setView('create');
  };

  const handleToggle = useCallback(async (promotion: StorePromotion, enabled: boolean) => {
    if (await togglePromotion(promotion.id, enabled)) {
      notifySuccess(t(enabled ? 'promotionEnabledSuccess' : 'promotionDisabledSuccess'));
    }
  }, [togglePromotion, notifySuccess, t]);

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
          onClick={openCreateView}
          onKeyDown={(event) => handleTileKeyDown(event, openCreateView)}
        >
          <h3>{t('promotionCreateTileTitle')}</h3>
          <p>{t('promotionCreateTileDesc')}</p>
        </div>
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={() => setView('browse')}
          onKeyDown={(event) => handleTileKeyDown(event, () => setView('browse'))}
        >
          <h3>{t('promotionBrowseTileTitle')}</h3>
          <p>{t('promotionBrowseTileDesc')}</p>
        </div>
      </div>

      {view === 'create' && (
        <ModalShell
          titleId="promotion-create-title"
          title={form.id === null ? t('promotionCreateTitle') : t('promotionEditTitle')}
          onClose={() => setView(null)}
          error={error}
        >
          <form onSubmit={(event) => { void handleSave(event); }} noValidate>
            <div className="form-group">
              <label htmlFor="promotionName">{t('promotionName')}</label>
              <input id="promotionName" className="input" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <FieldMessage error={errors.name} />
            </div>
            <div className="form-group">
              <label htmlFor="promotionCountry">{t('country')}</label>
              <CountrySelect id="promotionCountry" value={form.country} onChange={(country) => setForm((prev) => ({ ...prev, country }))} />
              <FieldMessage error={errors.country} />
            </div>
            <div className="form-group">
              <label htmlFor="promotionPointsPerCurrency">{t('promotionPointsPerCurrency')}</label>
              <input
                id="promotionPointsPerCurrency"
                className="input"
                type="number"
                step="0.01"
                value={form.pointsPerCurrency}
                onChange={(event) => setForm((prev) => ({ ...prev, pointsPerCurrency: event.target.value }))}
              />
              <FieldMessage error={errors.pointsPerCurrency} />
            </div>
            <div className="form-group">
              <label htmlFor="promotionStartsAt">{t('promotionStartsAt')}</label>
              <DatePicker
                id="promotionStartsAt"
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
              <label htmlFor="promotionEndsAt">{t('promotionEndsAt')}</label>
              <DatePicker
                id="promotionEndsAt"
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
        <ModalShell titleId="promotion-list-title" title={t('promotionListTitle')} onClose={() => setView(null)} error={error}>
          {storePromotions.length === 0 ? (
            <p>{t('noPromotions')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headStyle}>{t('promotionName')}</th>
                    <th style={headStyle}>{t('country')}</th>
                    <th style={{ ...cellStyle, textAlign: 'right' }}>{t('promotionPointsPerCurrency')}</th>
                    <th style={headStyle}>{t('promotionStartsAt')}</th>
                    <th style={headStyle}>{t('promotionEndsAt')}</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }}>{t('status')}</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }} />
                  </tr>
                </thead>
                <tbody>
                  {storePromotions.map((promotion) => (
                    <tr key={promotion.id}>
                      <td style={cellStyle}>{promotion.name}</td>
                      <td style={cellStyle}>{promotion.country}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{format.formatNumber(promotion.pointsPerCurrency)}</td>
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
