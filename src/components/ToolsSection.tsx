import type { FormEvent, KeyboardEvent } from 'react';
import { Eye, EyeOff, PenSquare, X } from 'lucide-react';
import type { TechnicalUser } from '../types';
import type { StateSetter, TechnicalUserFormState, Translator } from '../types/ui';

type ToolsSectionProps = {
  t: Translator;
  toolView: 'technical' | 'import' | null;
  setToolView: StateSetter<'technical' | 'import' | null>;
  isAdmin: boolean;
  // CSV import
  importing: boolean;
  setImportFile: (file: File | null) => void;
  handleImportCustomers: (e: FormEvent) => Promise<void>;
  // Technical accounts (ADMIN only)
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

export function ToolsSection({
  t,
  toolView,
  setToolView,
  isAdmin,
  importing,
  setImportFile,
  handleImportCustomers,
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
}: ToolsSectionProps) {
  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <div>
      <div className={`grid ${isAdmin ? 'coupon-actions-grid' : ''}`} style={!isAdmin ? { gridTemplateColumns: '1fr', maxWidth: '400px' } : undefined}>
        {isAdmin && (
          <div
            className="card action-tile"
            style={{ textAlign: 'center' }}
            role="button"
            tabIndex={0}
            onClick={() => setToolView('technical')}
            onKeyDown={(e) => handleTileKeyDown(e, () => setToolView('technical'))}
          >
            <h3>{t('toolsTechnicalAccountTileTitle')}</h3>
            <p>{t('toolsTechnicalAccountTileDesc')}</p>
          </div>
        )}
        <div
          className="card action-tile"
          style={{ textAlign: 'center' }}
          role="button"
          tabIndex={0}
          onClick={() => setToolView('import')}
          onKeyDown={(e) => handleTileKeyDown(e, () => setToolView('import'))}
        >
          <h3>{t('toolsImportCsvTileTitle')}</h3>
          <p>{t('toolsImportCsvTileDesc')}</p>
        </div>
      </div>

      {toolView === 'import' && (
        <div className="modal-overlay" onClick={() => setToolView(null)} role="presentation">
          <div
            className="card modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-csv-title"
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <h2 id="import-csv-title" style={{ margin: 0 }}>{t('toolsImportCsvTileTitle')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={() => setToolView(null)} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            <p style={{ marginTop: 0 }}>{t('toolsDescription')}</p>
            <form onSubmit={(e) => { void handleImportCustomers(e); }}>
              <div className="form-group">
                <label htmlFor="csvFileInput">{t('csvFile')}</label>
                <input id="csvFileInput" className="input" type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} required />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={importing}>
                  {importing ? t('importing') : t('importCsv')}
                </button>
                <button className="btn" type="button" onClick={() => setToolView(null)}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toolView === 'technical' && isAdmin && (
        <div className="modal-overlay" onClick={() => setToolView(null)} role="presentation">
          <div
            className="card modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="technical-accounts-title"
          >
            <div className="modal-header">
              <h2 id="technical-accounts-title" style={{ margin: 0 }}>{t('tabTechnicalAccounts')}</h2>
              <button className="btn icon-btn modal-close-btn" type="button" onClick={() => setToolView(null)} aria-label={t('close')} title={t('close')}>
                <X size={16} />
              </button>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <h3 style={{ marginTop: 0 }}>{t('createTechnicalAccount')}</h3>
                <form onSubmit={(e) => { void handleCreateTechnicalUser(e); }}>
                  <div className="form-group">
                    <label>{t('login')}</label>
                    <input className="input" value={technicalUserForm.username} onChange={(e) => setTechnicalUserForm((prev) => ({ ...prev, username: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>{t('password')}</label>
                    <input className="input" type="text" value={technicalUserForm.password} onChange={(e) => setTechnicalUserForm((prev) => ({ ...prev, password: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>{t('country')}</label>
                    <select className="input" value={technicalUserForm.country} onChange={(e) => setTechnicalUserForm((prev) => ({ ...prev, country: e.target.value }))} required>
                      <option value="">{t('selectCountry')}</option>
                      {availableCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit" disabled={technicalUsersLoading}>{t('save')}</button>
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
                          <th style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {technicalUsers.map((user) => (
                          <tr key={user.id}>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{user.username}</td>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{user.country}</td>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                              <label className="switch">
                                <input type="checkbox" checked={user.enabled} onChange={(e) => { void handleToggleTechnicalUser(user.id, e.target.checked); }} />
                                <span className="slider" />
                              </label>
                            </td>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                              <button
                                className="btn icon-btn"
                                type="button"
                                onClick={() => { setTechnicalPasswordModalUser(user); setTechnicalPasswordValue(user.passwordPreview); setTechnicalPasswordVisible(false); }}
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
          </div>
        </div>
      )}

      {technicalPasswordModalUser && (
        <div className="modal-overlay" onClick={closeTechnicalPasswordModal} role="presentation">
          <div className="card modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
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
                <input className="input" type={technicalPasswordVisible ? 'text' : 'password'} value={technicalPasswordValue} onChange={(e) => setTechnicalPasswordValue(e.target.value)} />
                <button className="btn icon-btn" type="button" onClick={() => setTechnicalPasswordVisible((prev) => !prev)} title={technicalPasswordVisible ? t('hidePassword') : t('showPassword')} aria-label={technicalPasswordVisible ? t('hidePassword') : t('showPassword')}>
                  {technicalPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="button" onClick={() => { void handleUpdateTechnicalUserPassword(technicalPasswordModalUser.id, technicalPasswordValue); }}>{t('save')}</button>
              <button className="btn" type="button" onClick={closeTechnicalPasswordModal}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
