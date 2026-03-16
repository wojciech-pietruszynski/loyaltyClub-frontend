import type { FormEvent } from 'react';
import { Alert, Button, Card, ConfigProvider, Input, Typography, theme as antdTheme } from 'antd';
import type { Translator, Theme } from '../types/ui';

type LoginViewProps = {
  theme: Theme;
  appLogo: string;
  appVersion: string;
  username: string;
  password: string;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  handleLogin: (e: FormEvent) => Promise<void>;
  authError: string | null;
  t: Translator;
};

export function LoginView({
  theme,
  appLogo,
  appVersion,
  username,
  password,
  setUsername,
  setPassword,
  handleLogin,
  authError,
  t,
}: LoginViewProps) {
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
          <form onSubmit={(event) => { void handleLogin(event); }}>
            <div className="form-group">
              <label>{t('login')}</label>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t('password')}</label>
              <Input.Password value={password} onChange={(event) => setPassword(event.target.value)} required />
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
