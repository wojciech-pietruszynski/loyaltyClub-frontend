import type { FormEvent, KeyboardEvent } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PenSquare, X } from 'lucide-react';
import type { HierarchyPromotion } from '../types';
import type { HierarchyPromotionFormState, StateSetter, Translator } from '../types/ui';

type HierarchyPromotionsSectionProps = {
  t: Translator;
  availableCountries: string[];
  promotionView: 'create' | 'browse' | null;
  setPromotionView: StateSetter<'create' | 'browse' | null>;
  resetForm: () => void;
  closeModal: () => void;
  form: HierarchyPromotionFormState;
  setForm: StateSetter<HierarchyPromotionFormState>;
  handleSave: (e: FormEvent) => Promise<void>;
  saving: boolean;
  promotions: HierarchyPromotion[];
  handleEdit: (promotion: HierarchyPromotion) => void;
  handleToggleStatus: (promotion: HierarchyPromotion, enabled: boolean) => Promise<void>;
  formatDateTime: (value: string) => string;
};

export function HierarchyPromotionsSection({
  t,
  availableCountries,
  promotionView,
  setPromotionView,
  resetForm,
  closeModal,
  form,
  setForm,
  handleSave,
  saving,
  promotions,
  handleEdit,
  handleToggleStatus,
  formatDateTime,
}: HierarchyPromotionsSectionProps) {
  const openCreateView = () => {
    resetForm();
    setPromotionView('create');
  };

  const openBrowseView = () => {
    setPromotionView('browse');
  };

  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

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
          onClick={openBrowseView}
          onKeyDown={(event) => handleTileKeyDown(event, openBrowseView)}
        >
          <h3>{t('hierarchyPromotionBrowseTileTitle')}</h3>
          <p>{t('hierarchyPromotionBrowseTileDesc')}</p>
        </div>
      </div>

      {promotionView === 'create' && (
        <div className="modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="card modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hierarchy-promo-create-title"
          >
            <div className="modal-header">
              <h2 id="hierarchy-promo-create-title" style={{ margin: 0 }}>
                {form.id === null ? t('hierarchyPromotionCreateTitle') : t('hierarchyPromotionEditTitle')}
              </h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={closeModal} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(event) => { void handleSave(event); }}>
              <div className="form-group">
                <label>{t('hierarchyPromotionName')}</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('country')}</label>
                <select
                  className="input"
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  required
                >
                  <option value="">{t('selectCountry')}</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('hierarchyPromotionType')}</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'MULTIPLIER' | 'EXCLUSION' }))}
                  required
                >
                  <option value="MULTIPLIER">{t('hierarchyPromotionTypeMultiplier')}</option>
                  <option value="EXCLUSION">{t('hierarchyPromotionTypeExclusion')}</option>
                </select>
              </div>
              {form.type === 'MULTIPLIER' && (
                <div className="form-group">
                  <label>{t('multiplier')}</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.multiplier}
                    onChange={(e) => setForm((prev) => ({ ...prev, multiplier: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>{t('hierarchyCode')} <small style={{ color: 'var(--text-light)' }}>{t('hierarchyCodeOptional')}</small></label>
                <input
                  className="input"
                  value={form.hierarchy}
                  onChange={(e) => setForm((prev) => ({ ...prev, hierarchy: e.target.value }))}
                  placeholder="np. 42"
                />
              </div>
              <div className="form-group">
                <label>{t('productClass')} <small style={{ color: 'var(--text-light)' }}>{t('hierarchyCodeOptional')}</small></label>
                <input
                  className="input"
                  value={form.productClass}
                  onChange={(e) => setForm((prev) => ({ ...prev, productClass: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>{t('subclass')} <small style={{ color: 'var(--text-light)' }}>{t('hierarchyCodeOptional')}</small></label>
                <input
                  className="input"
                  value={form.subclass}
                  onChange={(e) => setForm((prev) => ({ ...prev, subclass: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>{t('hierarchyPromotionStartsAt')}</label>
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  value={form.startsAt ? dayjs(form.startsAt) : null}
                  onChange={(date) => setForm((prev) => ({ ...prev, startsAt: date ? date.format('YYYY-MM-DDTHH:mm') : '' }))}
                  style={{ width: '100%' }}
                  needConfirm={false}
                />
              </div>
              <div className="form-group">
                <label>{t('hierarchyPromotionEndsAt')}</label>
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  value={form.endsAt ? dayjs(form.endsAt) : null}
                  onChange={(date) => setForm((prev) => ({ ...prev, endsAt: date ? date.format('YYYY-MM-DDTHH:mm') : '' }))}
                  style={{ width: '100%' }}
                  needConfirm={false}
                  allowClear
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? t('loading') : t('save')}
                </button>
                <button className="btn" type="button" onClick={closeModal}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {promotionView === 'browse' && (
        <div className="modal-overlay" onClick={() => setPromotionView(null)} role="presentation">
          <div
            className="card modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hierarchy-promo-list-title"
          >
            <div className="modal-header">
              <h2 id="hierarchy-promo-list-title" style={{ margin: 0 }}>{t('hierarchyPromotionListTitle')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={() => setPromotionView(null)} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            {promotions.length === 0 ? (
              <p>{t('noHierarchyPromotions')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('hierarchyPromotionName')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('hierarchyPromotionType')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('hierarchyCode')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('productClass')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('subclass')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('multiplier')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('hierarchyPromotionStartsAt')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('hierarchyPromotionEndsAt')}</th>
                      <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                      <th style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map((promotion) => (
                      <tr key={promotion.id}>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.name}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.country}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>
                          {promotion.type === 'MULTIPLIER' ? t('hierarchyPromotionTypeMultiplier') : t('hierarchyPromotionTypeExclusion')}
                        </td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.hierarchy ?? '-'}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.productClass ?? '-'}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.subclass ?? '-'}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>
                          {promotion.multiplier != null ? `x${promotion.multiplier}` : '-'}
                        </td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(promotion.startsAt)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>
                          {promotion.endsAt ? formatDateTime(promotion.endsAt) : '-'}
                        </td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={promotion.enabled}
                              onChange={(e) => {
                                void handleToggleStatus(promotion, e.target.checked);
                              }}
                            />
                            <span className="slider" />
                          </label>
                        </td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
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
              <button className="btn" type="button" onClick={() => setPromotionView(null)}>
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
