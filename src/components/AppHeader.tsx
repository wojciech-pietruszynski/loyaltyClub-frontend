import { useEffect, useState } from 'react';
import { Button, Segmented, Space, Spin, Typography } from 'antd';
import { useAppContext } from '../context/appContext';
import type { Language } from '../i18n';

const LANGUAGE_OPTIONS: { value: Language; short: string }[] = [
  { value: 'pl', short: 'PL' },
  { value: 'en', short: 'EN' },
  { value: 'de', short: 'DE' },
];

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
};

export function AppHeader({ appLogo, loading }: AppHeaderProps) {
  const { t, language, setLanguage, theme, setTheme, session } = useAppContext();

  return (
    <header className="header">
      <img className="app-logo" src={appLogo} alt={t('appTitle')} />
      <div className="topbar-controls">
        <Space className="session-pill" size={8}>
          <Typography.Text className="session-label">{t('session')}</Typography.Text>
          <Typography.Text strong><SessionCountdown expiresAt={session.expiresAt} /></Typography.Text>
          {loading && <Spin size="small" />}
        </Space>
        {/* Kod kraju z sesji — do tej pory zapisywany, lecz nieużywany. */}
        <Space className="session-pill" size={8}>
          <Typography.Text className="session-label">{t('countryScope')}</Typography.Text>
          <Typography.Text strong>{session.country ?? t('countryScopeGlobal')}</Typography.Text>
        </Space>
        <div className="topbar-actions">
          <div className="control-group">
            <span className="control-label">{t('changeLanguage')}</span>
            <Segmented
              value={language}
              options={LANGUAGE_OPTIONS.map((option) => ({ value: option.value, label: option.short }))}
              onChange={(value) => setLanguage(value as Language)}
            />
          </div>
          <Button type="default" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? t('darkMode') : t('lightMode')}
          </Button>
          <Button type="default" onClick={session.logout}>{t('logout')}</Button>
        </div>
      </div>
    </header>
  );
}
