import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, ConfigProvider, theme as antdTheme } from 'antd';
import plPL from 'antd/locale/pl_PL';
import enUS from 'antd/locale/en_US';
import deDE from 'antd/locale/de_DE';
import { Percent, PlusCircle, Ticket, UserPlus, Users, Wrench } from 'lucide-react';

import api from './api/client';
import { translate, type Language, type TranslationKey } from './i18n';
import appLogo from './assets/logo.png';

// Components
import { AddCustomerSection } from './components/AddCustomerSection';
import { AddPointsSection } from './components/AddPointsSection';
import { AppHeader } from './components/AppHeader';
import { CouponsSection } from './components/CouponsSection';
import { CustomerDetailsModal } from './components/CustomerDetailsModal';
import { CustomersSection } from './components/CustomersSection';
import { LoginView } from './components/LoginView';
import { HierarchyPromotionsSection } from './components/HierarchyPromotionsSection';
import { StorePromotionsSection } from './components/StorePromotionsSection';
import { TechnicalAccountsSection } from './components/TechnicalAccountsSection';
import { ToolsSection } from './components/ToolsSection';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useCustomers } from './hooks/useCustomers';
import { useCoupons } from './hooks/useCoupons';
import { useHierarchyPromotions } from './hooks/useHierarchyPromotions';
import { usePromotions } from './hooks/usePromotions';
import { useTechnicalUsers } from './hooks/useTechnicalUsers';

// Types
import type { Customer, HierarchyPromotion, StorePromotion, TechnicalUser } from './types';
import {
  type CouponFormState,
  type CouponTemplateFormState,
  type CustomerModalTab,
  type CustomerEditFormState,
  type HierarchyPromotionFormState,
  type NewCustomerFormState,
  type NewPointsFormState,
  type PromotionFormState,
  type Tab,
  type TechnicalUserFormState,
  type Theme
} from './types/ui';

import './App.css';

// Utils
function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiErr = err as any;
    return apiErr.response?.data?.detail || apiErr.response?.data?.error || apiErr.message || fallback;
  }
  return (err as any)?.message || fallback;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString();
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString();
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Business Logic Hooks
  const auth = useAuth();
  const customerApi = useCustomers();
  const couponApi = useCoupons();
  const promoApi = usePromotions();
  const hierarchyPromoApi = useHierarchyPromotions();
  const techApi = useTechnicalUsers();

  // Sync theme & language to DOM / localStorage whenever they change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('app_language', language);
  }, [language]);

  // Translations
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params), [language]);


  // Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await auth.login(username, password)) {
      setSuccess(t('loginTitle'));
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const { logout: authLogout } = auth;
  const handleLogout = useCallback(() => {
    authLogout();
    setActiveTab('customers');
  }, [authLogout]);

  // Data Fetching — destructure stable function refs to avoid re-fetch loop
  const { fetchCustomers } = customerApi;
  const { fetchCoupons, fetchTemplates } = couponApi;
  const { fetchPromotions, fetchMetadata } = promoApi;
  const { fetchHierarchyPromotions } = hierarchyPromoApi;
  const { fetchTechnicalUsers } = techApi;

  const fetchData = useCallback(async () => {
    if (!auth.loggedIn) return;
    await Promise.all([
      fetchCustomers(),
      fetchCoupons(),
      fetchTemplates(),
      fetchPromotions(),
      fetchMetadata(),
      fetchHierarchyPromotions(),
    ]);
    if (auth.authRole === 'ADMIN') {
      await fetchTechnicalUsers();
    }
  }, [auth.loggedIn, auth.authRole, fetchCustomers, fetchCoupons, fetchTemplates, fetchPromotions, fetchMetadata, fetchHierarchyPromotions, fetchTechnicalUsers]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Sidebar Navigation
  const navigationTabs = useMemo(() => {
    const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
      { key: 'customers', icon: <Users size={16} />, label: t('tabCustomers') },
      { key: 'add-customer', icon: <UserPlus size={16} />, label: t('tabAddCustomer') },
      { key: 'coupons', icon: <Ticket size={16} />, label: t('tabCoupons') },
      { key: 'tools', icon: <Wrench size={16} />, label: t('tabTools') },
    ];
    if (auth.authRole === 'ADMIN') {
      tabs.splice(2, 0, { key: 'add-points', icon: <PlusCircle size={16} />, label: t('tabAddPoints') });
      tabs.push({ key: 'technical-accounts', icon: <Wrench size={16} />, label: t('tabTechnicalAccounts') });
    }
    if (auth.authRole === 'ADMIN' || auth.authRole === 'TECHNICAL') {
      tabs.push({ key: 'store-promotions', icon: <Percent size={16} />, label: t('tabStorePromotions') });
      tabs.push({ key: 'hierarchy-promotions', icon: <Percent size={16} />, label: t('tabHierarchyPromotions') });
    }
    return tabs;
  }, [auth.authRole, t]);

  // Forms State
  const [newCustomer, setNewCustomer] = useState<NewCustomerFormState>({ firstName: '', lastName: '', email: '', customerNumber: '', phoneNumber: '', country: '' });
  const [newPoints, setNewPoints] = useState<NewPointsFormState>({ customerId: '', points: 0, description: t('purchaseProducts') });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Coupons State
  const [couponDialog, setCouponDialog] = useState<'issue' | 'template' | 'browse' | 'browse-templates' | null>(null);
  const [couponForm, setCouponForm] = useState<CouponFormState>({ customerId: '', couponTemplateId: '', reason: 'POINTS_EXCHANGE' });
  const [couponTemplateForm, setCouponTemplateForm] = useState<CouponTemplateFormState>({ couponValue: '', minimumPurchaseValue: '', requiredPoints: '', country: '', validityDays: '', couponPrefix: '' });
  const [couponCodeSearch, setCouponCodeSearch] = useState('');
  const [couponSortBy, setCouponSortBy] = useState<'reason' | 'country' | 'status'>('reason');
  const [couponSortValue, setCouponSortValue] = useState('ALL');

  // Promotions State
  const [promotionView, setPromotionView] = useState<'create' | 'browse' | null>(null);
  const [promotionForm, setPromotionForm] = useState<PromotionFormState>({ id: null, name: '', country: '', pointsPerCurrency: '', startsAt: '', endsAt: '', enabled: true });

  // Hierarchy Promotions State
  const [hierarchyPromotionView, setHierarchyPromotionView] = useState<'create' | 'browse' | null>(null);
  const [hierarchyPromotionForm, setHierarchyPromotionForm] = useState<HierarchyPromotionFormState>({
    id: null, name: '', country: '', hierarchy: '', productClass: '', subclass: '',
    type: 'MULTIPLIER', multiplier: '', startsAt: '', endsAt: '', enabled: true,
  });

  // Technical State
  const [technicalUserForm, setTechnicalUserForm] = useState<TechnicalUserFormState>({ username: '', password: '', country: '', enabled: true });
  const [technicalPasswordModalUser, setTechnicalPasswordModalUser] = useState<TechnicalUser | null>(null);
  const [technicalPasswordValue, setTechnicalPasswordValue] = useState('');
  const [technicalPasswordVisible, setTechnicalPasswordVisible] = useState(false);

  // Modal Handlers
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerModalTab, setCustomerModalTab] = useState<CustomerModalTab>('profile');
  const [customerModalLoading, setCustomerModalLoading] = useState(false);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [customerCoupons, setCustomerCoupons] = useState([]);
  const [purchaseHistorySeries, setPurchaseHistorySeries] = useState({ points: [], maxTotal: 0 });
  const [customerEditForm, setCustomerEditForm] = useState<CustomerEditFormState>({ firstName: '', lastName: '', email: '', customerNumber: '', phoneNumber: '', country: '' });
  const [customerCouponForm, setCustomerCouponForm] = useState({ couponTemplateId: '', reason: 'POINTS_EXCHANGE' });
  
  const openCustomerModal = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerModalTab('profile');
    setCustomerEditForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      customerNumber: customer.customerNumber,
      phoneNumber: customer.phoneNumber,
      country: customer.country,
    });
    setCustomerModalLoading(true);
    try {
      const [transactions, coupons, history] = await Promise.all([
        customerApi.fetchTransactions(customer.id),
        customerApi.fetchCoupons(customer.id),
        customerApi.fetchPurchaseHistory(customer.id)
      ]);
      setCustomerTransactions(transactions);
      setCustomerCoupons(coupons);
      setPurchaseHistorySeries(history);
    } finally {
      setCustomerModalLoading(false);
    }
  }, [customerApi]);

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

  const antdLocale = language === 'pl' ? plPL : language === 'de' ? deDE : enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: '#6366f1', borderRadius: 10, zIndexPopupBase: 1200 },
      }}
    >
      <div className="container">
        <AppHeader
          appLogo={appLogo}
          loading={customerApi.loading || couponApi.loading || promoApi.loading || techApi.loading}
          expiresAt={auth.expiresAt}
          language={language}
          setLanguage={setLanguage}
          languageOptions={[{ value: 'pl', short: 'PL' }, { value: 'en', short: 'EN' }, { value: 'de', short: 'DE' }]}
          theme={theme}
          setTheme={setTheme}
          handleLogout={handleLogout}
          t={t}
        />

        <div className="app-body">
          <nav className="sidebar">
            {navigationTabs.map(({ key, icon, label }) => (
              <button
                key={key}
                className={`sidebar-nav-btn${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
                type="button"
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>

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

          {activeTab === 'add-points' && (
            <AddPointsSection
              t={t}
              newPoints={newPoints}
              setNewPoints={setNewPoints}
              customers={customerApi.customers}
              handleAddPoints={async (e) => {
                e.preventDefault();
                if (await customerApi.addPoints(newPoints.customerId, newPoints.points, newPoints.description)) {
                  setSuccess(t('pointsAddedSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                  setNewPoints({ customerId: '', points: 0, description: t('purchaseProducts') });
                }
              }}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsSection
              t={t}
              couponDialog={couponDialog}
              setCouponDialog={setCouponDialog}
              couponDialogError={couponApi.error}
              setCouponDialogError={couponApi.setError}
              closeCouponDialog={() => setCouponDialog(null)}
              handleIssueCoupon={async (e) => {
                e.preventDefault();
                if (await couponApi.issueCoupon(couponForm)) {
                  setSuccess(t('couponGeneratedSuccess', { code: '' }));
                  setTimeout(() => setSuccess(null), 3000);
                  setCouponDialog(null);
                  setCouponForm({ customerId: '', couponTemplateId: '', reason: 'POINTS_EXCHANGE' });
                }
              }}
              couponForm={couponForm}
              setCouponForm={setCouponForm}
              customers={customerApi.customers}
              couponTemplates={couponApi.couponTemplates}
              handleCreateCouponTemplate={async (e) => {
                e.preventDefault();
                if (await couponApi.createTemplate(couponTemplateForm)) {
                  setSuccess(t('couponTemplateSaved'));
                  setTimeout(() => setSuccess(null), 3000);
                  setCouponDialog(null);
                  setCouponTemplateForm({ couponValue: '', minimumPurchaseValue: '', requiredPoints: '', country: '', validityDays: '', couponPrefix: '' });
                }
              }}
              couponTemplateForm={couponTemplateForm}
              setCouponTemplateForm={setCouponTemplateForm}
              availableCountries={promoApi.availableCountries}
              availableCouponPrefixes={promoApi.availableCouponPrefixes}
              couponCodeSearch={couponCodeSearch}
              setCouponCodeSearch={setCouponCodeSearch}
              couponSortBy={couponSortBy}
              setCouponSortBy={setCouponSortBy}
              couponSortValue={couponSortValue}
              setCouponSortValue={setCouponSortValue}
              couponSortValues={[]} // TODO: populate if needed
              filteredCoupons={couponApi.coupons} // Simplified filtering for now
              reasonLabel={(r) => t(r === 'POINTS_EXCHANGE' ? 'reasonPointsExchange' : 'reasonComplaint')}
              statusLabel={(s) => t(s === 'ACTIVE' ? 'active' : s === 'USED' ? 'used' : 'expired')}
              formatDateTime={formatDateTime}
            />
          )}

          {activeTab === 'store-promotions' && (
            <StorePromotionsSection
              t={t}
              availableCountries={promoApi.availableCountries}
              promotionView={promotionView}
              setPromotionView={setPromotionView}
              resetPromotionForm={() => setPromotionForm({ id: null, name: '', country: '', pointsPerCurrency: '', startsAt: '', endsAt: '', enabled: true })}
              closePromotionModal={() => setPromotionView(null)}
              promotionForm={promotionForm}
              setPromotionForm={setPromotionForm}
              handleSavePromotion={async (e) => {
                e.preventDefault();
                if (await promoApi.savePromotion(promotionForm, promotionForm.id || undefined)) {
                  setSuccess(t(promotionForm.id ? 'promotionUpdatedSuccess' : 'promotionCreatedSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                  setPromotionView(null);
                }
              }}
              promotionSaving={promoApi.loading}
              storePromotions={promoApi.storePromotions}
              handleEditPromotion={(p: StorePromotion) => {
                setPromotionForm({
                  id: p.id,
                  name: p.name,
                  country: p.country,
                  pointsPerCurrency: p.pointsPerCurrency.toString(),
                  startsAt: p.startsAt.slice(0, 16),
                  endsAt: p.endsAt ? p.endsAt.slice(0, 16) : '',
                  enabled: p.enabled
                });
                setPromotionView('create');
              }}
              handleTogglePromotionStatus={async (p: StorePromotion, enabled: boolean) => {
                if (await promoApi.togglePromotion(p.id, enabled)) {
                  setSuccess(t(enabled ? 'promotionEnabledSuccess' : 'promotionDisabledSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                }
              }}
              formatDateTime={formatDateTime}
            />
          )}

          {activeTab === 'hierarchy-promotions' && (
            <HierarchyPromotionsSection
              t={t}
              availableCountries={promoApi.availableCountries}
              promotionView={hierarchyPromotionView}
              setPromotionView={setHierarchyPromotionView}
              resetForm={() => setHierarchyPromotionForm({
                id: null, name: '', country: '', hierarchy: '', productClass: '', subclass: '',
                type: 'MULTIPLIER', multiplier: '', startsAt: '', endsAt: '', enabled: true,
              })}
              closeModal={() => setHierarchyPromotionView(null)}
              form={hierarchyPromotionForm}
              setForm={setHierarchyPromotionForm}
              handleSave={async (e) => {
                e.preventDefault();
                if (await hierarchyPromoApi.saveHierarchyPromotion(hierarchyPromotionForm, hierarchyPromotionForm.id || undefined)) {
                  setSuccess(t(hierarchyPromotionForm.id ? 'hierarchyPromotionUpdatedSuccess' : 'hierarchyPromotionCreatedSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                  setHierarchyPromotionView(null);
                }
              }}
              saving={hierarchyPromoApi.loading}
              promotions={hierarchyPromoApi.hierarchyPromotions}
              handleEdit={(p: HierarchyPromotion) => {
                setHierarchyPromotionForm({
                  id: p.id,
                  name: p.name,
                  country: p.country,
                  hierarchy: p.hierarchy ?? '',
                  productClass: p.productClass ?? '',
                  subclass: p.subclass ?? '',
                  type: p.type,
                  multiplier: p.multiplier != null ? p.multiplier.toString() : '',
                  startsAt: p.startsAt.slice(0, 16),
                  endsAt: p.endsAt ? p.endsAt.slice(0, 16) : '',
                  enabled: p.enabled,
                });
                setHierarchyPromotionView('create');
              }}
              handleToggleStatus={async (p: HierarchyPromotion, enabled: boolean) => {
                if (await hierarchyPromoApi.toggleHierarchyPromotion(p.id, enabled)) {
                  setSuccess(t(enabled ? 'hierarchyPromotionEnabledSuccess' : 'hierarchyPromotionDisabledSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                }
              }}
              formatDateTime={formatDateTime}
            />
          )}

          {activeTab === 'technical-accounts' && (
            <TechnicalAccountsSection
              t={t}
              availableCountries={promoApi.availableCountries}
              technicalUserForm={technicalUserForm}
              setTechnicalUserForm={setTechnicalUserForm}
              technicalUsersLoading={techApi.loading}
              handleCreateTechnicalUser={async (e) => {
                e.preventDefault();
                if (await techApi.createTechnicalUser(technicalUserForm)) {
                  setSuccess(t('technicalUserCreated'));
                  setTimeout(() => setSuccess(null), 3000);
                  setTechnicalUserForm({ username: '', password: '', country: '', enabled: true });
                }
              }}
              technicalUsers={techApi.technicalUsers}
              handleToggleTechnicalUser={async (id, enabled) => {
                if (await techApi.toggleTechnicalUser(id, enabled)) {
                  setSuccess(t(enabled ? 'promotionEnabledSuccess' : 'promotionDisabledSuccess')); // Using promotion translations as fallback for now
                  setTimeout(() => setSuccess(null), 3000);
                }
              }}
              technicalPasswordModalUser={technicalPasswordModalUser}
              setTechnicalPasswordModalUser={setTechnicalPasswordModalUser}
              technicalPasswordValue={technicalPasswordValue}
              setTechnicalPasswordValue={setTechnicalPasswordValue}
              technicalPasswordVisible={technicalPasswordVisible}
              setTechnicalPasswordVisible={setTechnicalPasswordVisible}
              closeTechnicalPasswordModal={() => {
                setTechnicalPasswordModalUser(null);
                setTechnicalPasswordValue('');
                setTechnicalPasswordVisible(false);
              }}
              handleUpdateTechnicalUserPassword={async (id, pwd) => {
                if (await techApi.updatePassword(id, pwd)) {
                  setSuccess(t('technicalUserPasswordUpdated'));
                  setTimeout(() => setSuccess(null), 3000);
                  setTechnicalPasswordModalUser(null);
                  setTechnicalPasswordValue('');
                }
              }}
            />
          )}
          
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
                   await api.post('/tools/import-customers', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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

        {selectedCustomer && (
          <CustomerDetailsModal
            selectedCustomer={selectedCustomer}
            closeCustomerModal={() => setSelectedCustomer(null)}
            customerModalTab={customerModalTab}
            setCustomerModalTab={setCustomerModalTab}
            customerModalError={customerApi.error}
            customerModalLoading={customerModalLoading}
            handleSaveCustomer={async (e) => {
              e.preventDefault();
              if (await customerApi.updateCustomer(selectedCustomer.id, customerEditForm)) {
                setSuccess(t('customerSavedSuccess'));
                setTimeout(() => setSuccess(null), 3000);
                setSelectedCustomer(null);
              }
            }}
            customerEditForm={customerEditForm}
            setCustomerEditForm={setCustomerEditForm}
            availableCountries={promoApi.availableCountries}
            purchaseHistorySeries={purchaseHistorySeries}
            customerTransactions={customerTransactions}
            customerCouponForm={customerCouponForm}
            setCustomerCouponForm={setCustomerCouponForm}
            handleIssueCouponForSelectedCustomer={async (e) => {
              e.preventDefault();
              if (await couponApi.issueCoupon({ ...customerCouponForm, customerId: selectedCustomer.id.toString() })) {
                setSuccess(t('couponGeneratedSuccess', { code: '' }));
                setTimeout(() => setSuccess(null), 3000);
                const updatedCoupons = await customerApi.fetchCoupons(selectedCustomer.id);
                setCustomerCoupons(updatedCoupons);
                setCustomerModalTab('coupon-history');
              }
            }}
            couponTemplates={couponApi.couponTemplates}
            customerCoupons={customerCoupons}
            statusLabel={(s) => t(s === 'ACTIVE' ? 'active' : s === 'USED' ? 'used' : 'expired')}
            reasonLabel={(r) => t(r === 'POINTS_EXCHANGE' ? 'reasonPointsExchange' : 'reasonComplaint')}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            t={t}
          />
        )}
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
