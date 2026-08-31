import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, ConfigProvider, Input, Typography, theme as antdTheme } from 'antd';
import type { Translator, Theme } from '../types/ui';

type LoginViewProps = {
  theme: Theme;
  appLogo: string;
  appVersion: string;
  onLogin: (username: string, password: string) => Promise<void>;
  authError: string | null;
  t: Translator;
};

/**
 * Widok logowania renderuje się przed dostawcą kontekstu (sesji jeszcze nie ma),
 * więc jako jedyny dostaje `t` i motyw jako właściwości. Stan formularza trzyma
 * sam — orkiestrator nie ma powodu znać wpisywanego hasła.
 */
export function LoginView({ theme, appLogo, appVersion, onLogin, authError, t }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onLogin(username, password);
    setPassword('');
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: '#6366f1', borderRadius: 10 },
      }}
    >
      <div className="container">
        <Card className="login-card">
          <img className="login-logo" src={appLogo} alt={t('appTitle')} />
          <Typography.Title level={2}>{t('loginTitle')}</Typography.Title>
          <form onSubmit={(event) => { void handleSubmit(event); }}>
            <div className="form-group">
              <label htmlFor="loginUsername">{t('login')}</label>
              <Input id="loginUsername" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="loginPassword">{t('password')}</label>
              <Input.Password id="loginPassword" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <div className="form-actions">
              <Button type="primary" htmlType="submit">{t('signIn')}</Button>
            </div>
          </form>
          {authError && <Alert style={{ marginTop: 16 }} type="error" showIcon message={authError} />}
        </Card>
        <footer className="app-footer">
          <span>Copyright: Wojciech Pietruszyński</span>
          <a href="https://www.linkedin.com/in/wojciech-pietruszynski/" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <span>Wersja aplikacji: {appVersion}</span>
        </footer>
      </div>
    </ConfigProvider>
  );
}
