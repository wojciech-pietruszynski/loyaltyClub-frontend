import type { FormEvent } from 'react';
import { Eye, EyeOff, PenSquare, X } from 'lucide-react';
import type { TechnicalUser } from '../types';
import type { StateSetter, TechnicalUserFormState, Translator } from '../types/ui';

type TechnicalAccountsSectionProps = {
  t: Translator;
  availableCountries: string[];
  technicalUserForm: TechnicalUserFormState;
  setTechnicalUserForm: StateSetter<TechnicalUserFormState>;
  technicalUsersLoading: boolean;
  handleCreateTechnicalUser: (e: FormEvent) => Promise<void>;
  technicalUsers: TechnicalUser[];
  handleToggleTechnicalUser: (userId: number, enabled: boolean) => Promise<void>;
  technicalPasswordModalUser: TechnicalUser | null;
  setTechnicalPasswordModalUser: StateSetter<TechnicalUser | null>;
  technicalPasswordValue: string;
  setTechnicalPasswordValue: StateSetter<string>;
  technicalPasswordVisible: boolean;
  setTechnicalPasswordVisible: StateSetter<boolean>;
  closeTechnicalPasswordModal: () => void;
  handleUpdateTechnicalUserPassword: (userId: number, password: string) => Promise<void>;
};

export function TechnicalAccountsSection({
  t,
  availableCountries,
  technicalUserForm,
  setTechnicalUserForm,
  technicalUsersLoading,
  handleCreateTechnicalUser,
  technicalUsers,
  handleToggleTechnicalUser,
  technicalPasswordModalUser,
  setTechnicalPasswordModalUser,
  technicalPasswordValue,
  setTechnicalPasswordValue,
  technicalPasswordVisible,
  setTechnicalPasswordVisible,
  closeTechnicalPasswordModal,
  handleUpdateTechnicalUserPassword,
}: TechnicalAccountsSectionProps) {
  return (
    <div className="card">
      <h2>{t('tabTechnicalAccounts')}</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>{t('createTechnicalAccount')}</h3>
          <form onSubmit={(event) => { void handleCreateTechnicalUser(event); }}>
            <div className="form-group">
              <label>{t('login')}</label>
              <input
                className="input"
                value={technicalUserForm.username}
                onChange={(event) => setTechnicalUserForm((prev) => ({ ...prev, username: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('password')}</label>
              <input
                className="input"
                type="text"
                value={technicalUserForm.password}
                onChange={(event) => setTechnicalUserForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('country')}</label>
              <select
                className="input"
                value={technicalUserForm.country}
                onChange={(event) => setTechnicalUserForm((prev) => ({ ...prev, country: event.target.value }))}
                required
              >
                <option value="">{t('selectCountry')}</option>
                {availableCountries.map((countryCode) => (
                  <option key={countryCode} value={countryCode}>{countryCode}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={technicalUsersLoading}>
                {t('save')}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>{t('technicalAccountsList')}</h3>
          {technicalUsers.length === 0 ? (
            <p>{t('noTechnicalAccounts')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('login')}</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                    <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                    <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
                  </tr>
                </thead>
                <tbody>
                  {technicalUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{user.username}</td>
                      <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{user.country}</td>
                      <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={user.enabled}
                            onChange={(event) => {
                              void handleToggleTechnicalUser(user.id, event.target.checked);
                            }}
                          />
                          <span className="slider" />
                        </label>
                      </td>
                      <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                        <button
                          className="btn icon-btn"
                          type="button"
                          onClick={() => {
                            setTechnicalPasswordModalUser(user);
                            setTechnicalPasswordValue(user.passwordPreview);
                            setTechnicalPasswordVisible(false);
                          }}
                          title={t('editTechnicalPassword')}
                          aria-label={t('editTechnicalPassword')}
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
        </div>
      </div>

      {technicalPasswordModalUser && (
        <div className="modal-overlay" onClick={closeTechnicalPasswordModal} role="presentation">
          <div
            className="card modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{t('editTechnicalPassword')}</h3>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={closeTechnicalPasswordModal} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            <div className="form-group">
              <label>{t('login')}</label>
              <input className="input" value={technicalPasswordModalUser.username} readOnly />
            </div>
            <div className="form-group">
              <label>{t('password')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  className="input"
                  type={technicalPasswordVisible ? 'text' : 'password'}
                  value={technicalPasswordValue}
                  onChange={(event) => setTechnicalPasswordValue(event.target.value)}
                />
                <button
                  className="btn icon-btn"
                  type="button"
                  onClick={() => setTechnicalPasswordVisible((prev) => !prev)}
                  title={technicalPasswordVisible ? t('hidePassword') : t('showPassword')}
                  aria-label={technicalPasswordVisible ? t('hidePassword') : t('showPassword')}
                >
                  {technicalPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  void handleUpdateTechnicalUserPassword(technicalPasswordModalUser.id, technicalPasswordValue);
                }}
              >
                {t('save')}
              </button>
              <button className="btn" type="button" onClick={closeTechnicalPasswordModal}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
