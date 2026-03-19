import type { FormEvent, KeyboardEvent } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PenSquare, X } from 'lucide-react';
import type { StorePromotion } from '../types';
import type { PromotionFormState, StateSetter, Translator } from '../types/ui';

type StorePromotionsSectionProps = {
  t: Translator;
  availableCountries: string[];
  promotionView: 'create' | 'browse' | null;
  setPromotionView: StateSetter<'create' | 'browse' | null>;
  resetPromotionForm: () => void;
  closePromotionModal: () => void;
  promotionForm: PromotionFormState;
  setPromotionForm: StateSetter<PromotionFormState>;
  handleSavePromotion: (e: FormEvent) => Promise<void>;
  promotionSaving: boolean;
  storePromotions: StorePromotion[];
  handleEditPromotion: (promotion: StorePromotion) => void;
  handleTogglePromotionStatus: (promotion: StorePromotion, enabled: boolean) => Promise<void>;
  formatDateTime: (value: string) => string;
};

export function StorePromotionsSection({
  t,
  availableCountries,
  promotionView,
  setPromotionView,
  resetPromotionForm,
  closePromotionModal,
  promotionForm,
  setPromotionForm,
  handleSavePromotion,
  promotionSaving,
  storePromotions,
  handleEditPromotion,
  handleTogglePromotionStatus,
  formatDateTime,
}: StorePromotionsSectionProps) {
  const openCreateView = () => {
    resetPromotionForm();
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
          <h3>{t('promotionCreateTileTitle')}</h3>
          <p>{t('promotionCreateTileDesc')}</p>
        </div>
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={openBrowseView}
          onKeyDown={(event) => handleTileKeyDown(event, openBrowseView)}
        >
          <h3>{t('promotionBrowseTileTitle')}</h3>
          <p>{t('promotionBrowseTileDesc')}</p>
        </div>
      </div>

      {promotionView === 'create' && (
        <div
          className="modal-overlay"
          onClick={closePromotionModal}
          role="presentation"
        >
          <div
            className="card modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="promotion-create-title"
          >
            <div className="modal-header">
              <h2 id="promotion-create-title" style={{ margin: 0 }}>
                {promotionForm.id === null ? t('promotionCreateTitle') : t('promotionEditTitle')}
              </h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={closePromotionModal} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(event) => { void handleSavePromotion(event); }}>
              <div className="form-group">
                <label>{t('promotionName')}</label>
                <input
                  className="input"
                  value={promotionForm.name}
                  onChange={(event) => setPromotionForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('country')}</label>
                <select
                  className="input"
                  value={promotionForm.country}
                  onChange={(event) => setPromotionForm((prev) => ({ ...prev, country: event.target.value }))}
                  required
                >
                  <option value="">{t('selectCountry')}</option>
                  {availableCountries.map((countryCode) => (
                    <option key={countryCode} value={countryCode}>{countryCode}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('promotionPointsPerCurrency')}</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={promotionForm.pointsPerCurrency}
                  onChange={(event) => setPromotionForm((prev) => ({ ...prev, pointsPerCurrency: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('promotionStartsAt')}</label>
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  value={promotionForm.startsAt ? dayjs(promotionForm.startsAt) : null}
                  onChange={(date) => setPromotionForm((prev) => ({ ...prev, startsAt: date ? date.format('YYYY-MM-DDTHH:mm') : '' }))}
                  style={{ width: '100%' }}
                  needConfirm={false}
                />
              </div>
              <div className="form-group">
                <label>{t('promotionEndsAt')}</label>
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  value={promotionForm.endsAt ? dayjs(promotionForm.endsAt) : null}
                  onChange={(date) => setPromotionForm((prev) => ({ ...prev, endsAt: date ? date.format('YYYY-MM-DDTHH:mm') : '' }))}
                  style={{ width: '100%' }}
                  needConfirm={false}
                  allowClear
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={promotionSaving}>
                  {promotionSaving ? t('loading') : t('save')}
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={closePromotionModal}
                >
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
            aria-labelledby="promotion-list-title"
          >
            <div className="modal-header">
              <h2 id="promotion-list-title" style={{ margin: 0 }}>{t('promotionListTitle')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={() => setPromotionView(null)} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            {storePromotions.length === 0 ? (
              <p>{t('noPromotions')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionName')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionPointsPerCurrency')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionStartsAt')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionEndsAt')}</th>
                      <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                      <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {storePromotions.map((promotion) => (
                      <tr key={promotion.id}>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.name}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.country}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{promotion.pointsPerCurrency}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{formatDateTime(promotion.startsAt)}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>
                          {promotion.endsAt ? formatDateTime(promotion.endsAt) : '-'}
                        </td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={promotion.enabled}
                              onChange={(event) => {
                                void handleTogglePromotionStatus(promotion, event.target.checked);
                              }}
                            />
                            <span className="slider" />
                          </label>
                        </td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                          <button
                            className="btn icon-btn"
                            type="button"
                            onClick={() => handleEditPromotion(promotion)}
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
