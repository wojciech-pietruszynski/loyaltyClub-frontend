import { useEffect, useState } from 'react';
import { Button, Segmented, Space, Spin, Typography } from 'antd';
import type { Language } from '../i18n';
import type { Theme, Translator } from '../types/ui';

function SessionCountdown({ expiresAt }: { expiresAt: number }) {
  const [leftMs, setLeftMs] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => setLeftMs(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(leftMs / 60000);
  const seconds = Math.floor((leftMs % 60000) / 1000);
  return <>{minutes}:{seconds < 10 ? '0' : ''}{seconds}</>;
}

type AppHeaderProps = {
  appLogo: string;
  loading: boolean;
  expiresAt: number;
  language: Language;
  setLanguage: (value: Language) => void;
  languageOptions: { value: Language; short: string }[];
  theme: Theme;
  setTheme: (value: Theme) => void;
  handleLogout: () => void;
  t: Translator;
};

export function AppHeader({
  appLogo,
  loading,
  expiresAt,
  language,
  setLanguage,
  languageOptions,
  theme,
  setTheme,
  handleLogout,
  t,
}: AppHeaderProps) {
  return (
    <header className="header">
      <img className="app-logo" src={appLogo} alt={t('appTitle')} />
      <div className="topbar-controls">
        <Space className="session-pill" size={8}>
          <Typography.Text className="session-label">{t('session')}</Typography.Text>
          <Typography.Text strong><SessionCountdown expiresAt={expiresAt} /></Typography.Text>
          {loading && <Spin size="small" />}
        </Space>
        <div className="topbar-actions">
          <div className="control-group">
            <span className="control-label">{t('changeLanguage')}</span>
            <Segmented
              value={language}
              options={languageOptions.map((option) => ({ value: option.value, label: option.short }))}
              onChange={(value) => setLanguage(value as Language)}
            />
          </div>
          <Button type="default" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? t('darkMode') : t('lightMode')}
          </Button>
          <Button type="default" onClick={handleLogout}>{t('logout')}</Button>
        </div>
      </div>
    </header>
  );
}
