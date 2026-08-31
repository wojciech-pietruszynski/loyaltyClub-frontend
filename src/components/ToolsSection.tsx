import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Eye, EyeOff, PenSquare } from 'lucide-react';
import { useAppContext } from '../context/appContext';
import { CountrySelect } from './CountrySelect';
import { FieldMessage } from './FieldMessage';
import { ModalShell } from './ModalShell';
import type { TechnicalUser } from '../types';
import type { TechnicalUserFormState } from '../types/ui';
import { hasErrors, validateTechnicalPassword, validateTechnicalUser, type FieldError, type FieldErrors } from '../lib/validation';

type ToolView = 'technical' | 'import' | null;

function emptyTechnicalForm(country: string | null): TechnicalUserFormState {
  return { username: '', password: '', country: country ?? '', enabled: true };
}

export function ToolsSection() {
  const { t, tPlural, session, data, notifySuccess, notifyError } = useAppContext();
  const { isAdmin } = session;
  const { importCustomers } = data.customers;
  const { technicalUsers, loading, error, ensureTechnicalUsers, createTechnicalUser, toggleTechnicalUser, updatePassword } = data.technicalUsers;

  useEffect(() => {
    if (isAdmin) {
      void ensureTechnicalUsers();
    }
  }, [isAdmin, ensureTechnicalUsers]);

  const [view, setView] = useState<ToolView>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const [technicalForm, setTechnicalForm] = useState<TechnicalUserFormState>(() => emptyTechnicalForm(session.country));
  const [technicalErrors, setTechnicalErrors] = useState<FieldErrors<TechnicalUserFormState>>({});

  const [passwordUser, setPasswordUser] = useState<TechnicalUser | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState<FieldError | null>(null);

  const handleTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handleImport = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!importFile) {
      notifyError(t('selectCsvForImport'));
      return;
    }

    setImporting(true);
    const imported = await importCustomers(importFile);
    setImporting(false);

    if (imported === null) return;
    notifySuccess(tPlural('importedCustomers', imported));
    setImportFile(null);
    setView(null);
  }, [importFile, importCustomers, notifySuccess, notifyError, t, tPlural]);

  const handleCreateTechnicalUser = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateTechnicalUser(technicalForm);
    setTechnicalErrors(validation);
    if (hasErrors(validation)) return;

    if (await createTechnicalUser(technicalForm)) {
      notifySuccess(t('technicalUserCreated'));
      setTechnicalForm(emptyTechnicalForm(session.country));
      setTechnicalErrors({});
    }
  }, [technicalForm, createTechnicalUser, notifySuccess, t, session.country]);

  const handleToggle = useCallback(async (user: TechnicalUser, enabled: boolean) => {
    if (await toggleTechnicalUser(user.id, enabled)) {
      notifySuccess(t(enabled ? 'promotionEnabledSuccess' : 'promotionDisabledSuccess'));
    }
  }, [toggleTechnicalUser, notifySuccess, t]);

  const closePasswordModal = () => {
    setPasswordUser(null);
    setPasswordValue('');
    setPasswordVisible(false);
    setPasswordError(null);
  };

  const handleUpdatePassword = useCallback(async () => {
    if (!passwordUser) return;
    const validation = validateTechnicalPassword(passwordValue);
    setPasswordError(validation);
    if (validation) return;

    if (await updatePassword(passwordUser.id, passwordValue)) {
      notifySuccess(t('technicalUserPasswordUpdated'));
      closePasswordModal();
    }
  }, [passwordUser, passwordValue, updatePassword, notifySuccess, t]);

  const cellStyle = { borderBottom: '1px solid var(--border)', padding: '0.5rem' } as const;
  const headStyle = { ...cellStyle, textAlign: 'left' } as const;

  return (
    <div>
      <div className={`grid ${isAdmin ? 'coupon-actions-grid' : ''}`} style={!isAdmin ? { gridTemplateColumns: '1fr', maxWidth: '400px' } : undefined}>
        {isAdmin && (
          <div
            className="card action-tile"
            style={{ textAlign: 'center' }}
            role="button"
            tabIndex={0}
            onClick={() => setView('technical')}
            onKeyDown={(event) => handleTileKeyDown(event, () => setView('technical'))}
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
          onClick={() => setView('import')}
          onKeyDown={(event) => handleTileKeyDown(event, () => setView('import'))}
        >
          <h3>{t('toolsImportCsvTileTitle')}</h3>
          <p>{t('toolsImportCsvTileDesc')}</p>
        </div>
      </div>

      {view === 'import' && (
        <ModalShell titleId="import-csv-title" title={t('toolsImportCsvTileTitle')} onClose={() => setView(null)} maxWidth="520px" error={data.customers.error}>
          <p style={{ marginTop: 0 }}>{t('toolsDescription')}</p>
          <form onSubmit={(event) => { void handleImport(event); }}>
            <div className="form-group">
              <label htmlFor="csvFileInput">{t('csvFile')}</label>
              <input
                id="csvFileInput"
                className="input"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={importing}>
                {importing ? t('importing') : t('importCsv')}
              </button>
              <button className="btn" type="button" onClick={() => setView(null)}>{t('cancel')}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {view === 'technical' && isAdmin && (
        <ModalShell titleId="technical-accounts-title" title={t('tabTechnicalAccounts')} onClose={() => setView(null)} error={error}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ marginTop: 0 }}>{t('createTechnicalAccount')}</h3>
              <form onSubmit={(event) => { void handleCreateTechnicalUser(event); }} noValidate>
                <div className="form-group">
                  <label htmlFor="technicalUsername">{t('login')}</label>
                  <input
                    id="technicalUsername"
                    className="input"
                    value={technicalForm.username}
                    onChange={(event) => setTechnicalForm((prev) => ({ ...prev, username: event.target.value }))}
                  />
                  <FieldMessage error={technicalErrors.username} />
                </div>
                <div className="form-group">
                  <label htmlFor="technicalPassword">{t('password')}</label>
                  <input
                    id="technicalPassword"
                    className="input"
                    type="text"
                    value={technicalForm.password}
                    onChange={(event) => setTechnicalForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                  <FieldMessage error={technicalErrors.password} />
                </div>
                <div className="form-group">
                  <label htmlFor="technicalCountry">{t('country')}</label>
                  <CountrySelect id="technicalCountry" value={technicalForm.country} onChange={(country) => setTechnicalForm((prev) => ({ ...prev, country }))} />
                  <FieldMessage error={technicalErrors.country} />
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={loading}>{t('save')}</button>
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
                        <th style={headStyle}>{t('login')}</th>
                        <th style={headStyle}>{t('country')}</th>
                        <th style={{ ...cellStyle, textAlign: 'center' }}>{t('status')}</th>
                        <th style={cellStyle} />
                      </tr>
                    </thead>
                    <tbody>
                      {technicalUsers.map((user) => (
                        <tr key={user.id}>
                          <td style={cellStyle}>{user.username}</td>
                          <td style={cellStyle}>{user.country}</td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={user.enabled}
                                aria-label={user.username}
                                onChange={(event) => { void handleToggle(user, event.target.checked); }}
                              />
                              <span className="slider" />
                            </label>
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            <button
                              className="btn icon-btn"
                              type="button"
                              onClick={() => {
                                setPasswordUser(user);
                                setPasswordValue(user.passwordPreview ?? '');
                                setPasswordVisible(false);
                                setPasswordError(null);
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
        </ModalShell>
      )}

      {passwordUser && (
        <ModalShell titleId="technical-password-title" title={t('editTechnicalPassword')} onClose={closePasswordModal} maxWidth="420px" error={error}>
          <div className="form-group">
            <label htmlFor="technicalPasswordLogin">{t('login')}</label>
            <input id="technicalPasswordLogin" className="input" value={passwordUser.username} readOnly />
          </div>
          <div className="form-group">
            <label htmlFor="technicalPasswordValue">{t('password')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                id="technicalPasswordValue"
                className="input"
                type={passwordVisible ? 'text' : 'password'}
                value={passwordValue}
                onChange={(event) => setPasswordValue(event.target.value)}
              />
              <button
                className="btn icon-btn"
                type="button"
                onClick={() => setPasswordVisible((previous) => !previous)}
                title={passwordVisible ? t('hidePassword') : t('showPassword')}
                aria-label={passwordVisible ? t('hidePassword') : t('showPassword')}
              >
                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldMessage error={passwordError ?? undefined} />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="button" onClick={() => { void handleUpdatePassword(); }}>{t('save')}</button>
            <button className="btn" type="button" onClick={closePasswordModal}>{t('cancel')}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
