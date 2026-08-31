import { useCallback, useEffect, useState } from 'react';
import { Alert, ConfigProvider, theme as antdTheme } from 'antd';
import plPL from 'antd/locale/pl_PL';
import enUS from 'antd/locale/en_US';
import deDE from 'antd/locale/de_DE';

import { translate, type Language } from './i18n';
import { localeByLanguage, type Theme } from './types/ui';
import { useAuth } from './hooks/useAuth';
import { AppProvider, type Notification } from './context/AppProvider';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';
import appLogo from './assets/logo.png';

import './App.css';

export const APP_VERSION = '1.2.0';

const ANTD_LOCALES = { pl: plPL, en: enUS, de: deDE } as const;

function readStoredLanguage(): Language {
  const saved = window.localStorage.getItem('app_language');
  return saved === 'pl' || saved === 'en' || saved === 'de' ? saved : 'pl';
}

function readStoredTheme(): Theme {
  return window.localStorage.getItem('app_theme') === 'dark' ? 'dark' : 'light';
}

/**
 * Orkiestrator sprowadzony do złożenia całości: ustawienia interfejsu, sesja,
 * dostawca kontekstu i powłoka z routingiem. Stan dziedzinowy mieszka
 * w hookach, stan formularzy — w sekcjach, które je renderują.
 */
function App() {
  const [language, setLanguage] = useState<Language>(readStoredLanguage);
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [notification, setNotification] = useState<Notification>(null);

  const t = useCallback((key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(language, key, params), [language]);
  const auth = useAuth(t);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Atrybut `lang` dokumentu idzie za wyborem języka — dokument deklarował
  // angielski przy polskim interfejsie, co myli czytniki ekranu i mechanizmy
  // tłumaczenia przeglądarki.
  useEffect(() => {
    document.documentElement.lang = localeByLanguage[language].slice(0, 2);
    window.localStorage.setItem('app_language', language);
  }, [language]);

  const { login } = auth;
  const handleLogin = useCallback(async (username: string, password: string) => {
    await login(username, password);
  }, [login]);

  if (!auth.loggedIn) {
    return (
      <ErrorBoundary t={t}>
        <LoginView
          theme={theme}
          appLogo={appLogo}
          appVersion={APP_VERSION}
          onLogin={handleLogin}
          authError={auth.authError}
          t={t}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ConfigProvider
      locale={ANTD_LOCALES[language]}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: '#6366f1', borderRadius: 10, zIndexPopupBase: 1200 },
      }}
    >
      <ErrorBoundary t={t}>
        <AppProvider
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          session={{
            role: auth.authRole,
            country: auth.authCountry,
            expiresAt: auth.expiresAt,
            logout: auth.logout,
          }}
          onNotification={setNotification}
        >
          <AppShell appLogo={appLogo} />
        </AppProvider>
      </ErrorBoundary>

      {notification && (
        <Alert className="app-toast" type={notification.type} showIcon message={notification.message} />
      )}

      <footer className="app-footer">
        <span>Copyright: Wojciech Pietruszyński</span>
        <a href="https://www.linkedin.com/in/wojciech-pietruszynski/" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <span>Wersja aplikacji: {APP_VERSION}</span>
      </footer>
    </ConfigProvider>
  );
}

export default App;
