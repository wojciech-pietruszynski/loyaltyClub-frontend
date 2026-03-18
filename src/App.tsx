import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, ConfigProvider, Space, Tabs, theme as antdTheme } from 'antd';
import { Percent, PlusCircle, Ticket, UserPlus, Users, Wrench } from 'lucide-react';

import api from './api/client';
import { translate, type Language, type TranslationKey } from './i18n';
import appLogo from './assets/logo.png';

// Components
import { AddCustomerSection } from './components/AddCustomerSection';
import { AppHeader } from './components/AppHeader';
import { CustomersSection } from './components/CustomersSection';
import { LoginView } from './components/LoginView';
import { ToolsSection } from './components/ToolsSection';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useCustomers } from './hooks/useCustomers';
import { useCoupons } from './hooks/useCoupons';
import { usePromotions } from './hooks/usePromotions';
import { useTechnicalUsers } from './hooks/useTechnicalUsers';

// Types
import type { Customer } from './types';
import { type NewCustomerFormState, type Tab, type Theme } from './types/ui';

import './App.css';

// Utils
function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiErr = err as any;
    return apiErr.response?.data?.detail || apiErr.response?.data?.error || apiErr.message || fallback;
  }
  return (err as any)?.message || fallback;
}

function App() {
  const appVersion = '1.1.0';
  
  // UI State
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem('app_language');
    return saved === 'pl' || saved === 'en' || saved === 'de' ? saved : 'pl';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem('app_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [success, setSuccess] = useState<string | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  // Business Logic Hooks
  const auth = useAuth();
  const customerApi = useCustomers();
  const couponApi = useCoupons();
  const promoApi = usePromotions();
  const techApi = useTechnicalUsers();

  // Translations
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params), [language]);

  // Derived State
  const sessionCountdown = useMemo(() => {
    const totalSeconds = Math.floor(auth.sessionLeftMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [auth.sessionLeftMs]);

  // Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await auth.login(username, password)) {
      setSuccess(t('loginTitle'));
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleLogout = useCallback(() => {
    auth.logout();
    setActiveTab('customers');
  }, [auth]);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!auth.loggedIn) return;
    await Promise.all([
      customerApi.fetchCustomers(),
      couponApi.fetchCoupons(),
      couponApi.fetchTemplates(),
      promoApi.fetchPromotions(),
      promoApi.fetchMetadata()
    ]);
    if (auth.authRole === 'ADMIN') {
      await techApi.fetchTechnicalUsers();
    }
  }, [auth.loggedIn, auth.authRole, customerApi, couponApi, promoApi, techApi]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Tab Navigation
  const navigationTabs = useMemo(() => {
    const tabs: { key: Tab; label: React.ReactNode }[] = [
      { key: 'customers', label: <Space size={6}><Users size={16} />{t('tabCustomers')}</Space> },
      { key: 'add-customer', label: <Space size={6}><UserPlus size={16} />{t('tabAddCustomer')}</Space> },
      { key: 'coupons', label: <Space size={6}><Ticket size={16} />{t('tabCoupons')}</Space> },
      { key: 'tools', label: <Space size={6}><Wrench size={16} />{t('tabTools')}</Space> },
    ];
    if (auth.authRole === 'ADMIN') {
      tabs.splice(2, 0, { key: 'add-points', label: <Space size={6}><PlusCircle size={16} />{t('tabAddPoints')}</Space> });
      tabs.push({ key: 'technical-accounts', label: <Space size={6}><Wrench size={16} />{t('tabTechnicalAccounts')}</Space> });
    }
    if (auth.authRole === 'ADMIN' || auth.authRole === 'TECHNICAL') {
      tabs.push({ key: 'store-promotions', label: <Space size={6}><Percent size={16} />{t('tabStorePromotions')}</Space> });
    }
    return tabs;
  }, [auth.authRole, t]);

  // Forms State (Keeping simple forms local to App or move to more specific components if needed)
  const [newCustomer, setNewCustomer] = useState<NewCustomerFormState>({ firstName: '', lastName: '', email: '', customerNumber: '', phoneNumber: '', country: '' });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const openCustomerModal = async (customer: Customer) => {
    // Implement modal logic if needed
    console.log('Open modal for:', customer);
  };

  if (!auth.loggedIn) {
    return (
      <LoginView
        theme={theme}
        appLogo={appLogo}
        appVersion={appVersion}
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
        handleLogin={handleLogin}
        authError={auth.authError}
        t={t}
      />
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: '#6366f1', borderRadius: 10 },
      }}
    >
      <div className="container">
        <AppHeader
          appLogo={appLogo}
          loading={customerApi.loading || couponApi.loading || promoApi.loading || techApi.loading}
          sessionCountdown={sessionCountdown}
          language={language}
          setLanguage={setLanguage}
          languageOptions={[{ value: 'pl', short: 'PL' }, { value: 'en', short: 'EN' }, { value: 'de', short: 'DE' }]}
          theme={theme}
          setTheme={setTheme}
          handleLogout={handleLogout}
          t={t}
        />

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as Tab)}
          items={navigationTabs}
        />

        <div className="content">
          {customerApi.error && <Alert style={{ marginBottom: 16 }} type="error" showIcon message={customerApi.error} />}

          {activeTab === 'customers' && (
            <CustomersSection customers={customerApi.customers} t={t} openCustomerModal={openCustomerModal} />
          )}

          {activeTab === 'add-customer' && (
            <AddCustomerSection
              t={t}
              newCustomer={newCustomer}
              setNewCustomer={setNewCustomer}
              availableCountries={promoApi.availableCountries}
              handleAddCustomer={async (e) => {
                e.preventDefault();
                if (await customerApi.addCustomer(newCustomer)) {
                  setSuccess(t('customerAddedSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                  setNewCustomer({ firstName: '', lastName: '', email: '', customerNumber: '', phoneNumber: '', country: '' });
                }
              }}
            />
          )}

          {/* ... Other sections would be integrated here similarly ... */}
          
          {activeTab === 'tools' && (
            <ToolsSection
              t={t}
              importing={importing}
              setImportFile={setImportFile}
              handleImportCustomers={async (e) => {
                e.preventDefault();
                if (!importFile) return;
                setImporting(true);
                try {
                   const formData = new FormData();
                   formData.append('file', importFile);
                   await api.post('/customers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                   await customerApi.fetchCustomers();
                   setSuccess(t('importCustomersSuccess'));
                } catch (err) {
                   customerApi.setError(extractApiError(err, t('importCustomersError')));
                } finally {
                   setImporting(false);
                }
              }}
            />
          )}
        </div>
      </div>
      {success && <Alert className="app-toast" type="success" showIcon message={success} />}
      <footer className="app-footer">
        <span>Copyright: Wojciech Pietruszyński</span>
        <a href="https://www.linkedin.com/in/wojciech-pietruszynski/" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <span>Wersja aplikacji: {appVersion}</span>
      </footer>
    </ConfigProvider>
  );
}

export default App;
