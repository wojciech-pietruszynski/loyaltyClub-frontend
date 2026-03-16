import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ConfigProvider, Space, Tabs, theme as antdTheme } from 'antd';
import { Percent, PlusCircle, Ticket, UserPlus, Users, Wrench } from 'lucide-react';
import { useEffectEvent } from 'react';
import api, { getAuthCountry, getAuthRole, getExpiresAt, isAuthenticated, login, logout, type AuthRole } from './api/client';
import { translate, type Language, type TranslationKey } from './i18n';
import appLogo from './assets/logo.png';
import { AddCustomerSection } from './components/AddCustomerSection';
import { AddPointsSection } from './components/AddPointsSection';
import { AppHeader } from './components/AppHeader';
import { CouponsSection } from './components/CouponsSection';
import { CustomerDetailsModal } from './components/CustomerDetailsModal';
import { CustomersSection } from './components/CustomersSection';
import { LoginView } from './components/LoginView';
import { StorePromotionsSection } from './components/StorePromotionsSection';
import { TechnicalAccountsSection } from './components/TechnicalAccountsSection';
import { ToolsSection } from './components/ToolsSection';
import type { Coupon, CouponTemplate, Customer, CustomerTransaction, StorePromotion, TechnicalUser } from './types';
import { localeByLanguage, type CouponTemplateFormState, type CouponFormState, type CustomerCouponFormState, type CustomerEditFormState, type CustomerModalTab, type NewCustomerFormState, type NewPointsFormState, type PromotionFormState, type Tab, type TechnicalUserFormState, type Theme } from './types/ui';
import './App.css';

type ApiErrorData = {
  detail?: string;
  error?: string;
};
type ApiErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: ApiErrorData;
  };
};

function App() {
  const appVersion = '1.0.0';
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem('app_language');
    return saved === 'pl' || saved === 'en' || saved === 'de' ? saved : 'pl';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem('app_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponTemplates, setCouponTemplates] = useState<CouponTemplate[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCouponPrefixes, setAvailableCouponPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(() => isAuthenticated());
  const [authRole, setAuthRole] = useState<AuthRole | null>(() => getAuthRole());
  const [authCountry, setAuthCountry] = useState<string | null>(() => getAuthCountry());
  const [sessionLeftMs, setSessionLeftMs] = useState<number>(0);

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [authError, setAuthError] = useState<string | null>(null);

  const [newCustomer, setNewCustomer] = useState<NewCustomerFormState>({
    firstName: '',
    lastName: '',
    email: '',
    customerNumber: '',
    phoneNumber: '',
    country: '',
  });
  const [newPoints, setNewPoints] = useState<NewPointsFormState>({ customerId: '', points: 0, description: translate(language, 'purchaseProducts') });
  const [couponForm, setCouponForm] = useState<CouponFormState>({
    customerId: '',
    couponTemplateId: '',
    reason: '',
  });
  const [couponTemplateForm, setCouponTemplateForm] = useState<CouponTemplateFormState>({
    couponValue: '',
    minimumPurchaseValue: '',
    requiredPoints: '',
    country: '',
    validityDays: '',
    couponPrefix: '',
  });
  const [couponDialog, setCouponDialog] = useState<'issue' | 'template' | 'browse' | 'browse-templates' | null>(null);
  const [couponDialogError, setCouponDialogError] = useState<string | null>(null);
  const [couponCodeSearch, setCouponCodeSearch] = useState('');
  const [couponSortBy, setCouponSortBy] = useState<'reason' | 'country' | 'status'>('reason');
  const [couponSortValue, setCouponSortValue] = useState<string>('ALL');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerModalTab, setCustomerModalTab] = useState<CustomerModalTab>('profile');
  const [customerModalLoading, setCustomerModalLoading] = useState(false);
  const [customerModalError, setCustomerModalError] = useState<string | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>([]);
  const [customerCoupons, setCustomerCoupons] = useState<Coupon[]>([]);
  const [customerEditForm, setCustomerEditForm] = useState<CustomerEditFormState>({
    firstName: '',
    lastName: '',
    email: '',
    customerNumber: '',
    phoneNumber: '',
    country: '',
  });
  const [customerCouponForm, setCustomerCouponForm] = useState<CustomerCouponFormState>({
    couponTemplateId: '',
    reason: '',
  });
  const [technicalUsers, setTechnicalUsers] = useState<TechnicalUser[]>([]);
  const [technicalUserForm, setTechnicalUserForm] = useState<TechnicalUserFormState>({
    username: '',
    password: '',
    country: '',
    enabled: true,
  });
  const [technicalUsersLoading, setTechnicalUsersLoading] = useState(false);
  const [technicalPasswordModalUser, setTechnicalPasswordModalUser] = useState<TechnicalUser | null>(null);
  const [technicalPasswordValue, setTechnicalPasswordValue] = useState('');
  const [technicalPasswordVisible, setTechnicalPasswordVisible] = useState(false);
  const [storePromotions, setStorePromotions] = useState<StorePromotion[]>([]);
  const [promotionView, setPromotionView] = useState<'create' | 'browse' | null>(null);
  const [promotionSaving, setPromotionSaving] = useState(false);
  const [promotionForm, setPromotionForm] = useState<PromotionFormState>({
    id: null as number | null,
    name: '',
    country: '',
    pointsPerCurrency: '',
    startsAt: '',
    endsAt: '',
    enabled: true,
  });
  const t = (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params);
  const locale = localeByLanguage[language];

  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale);
  const formatDateTime = (value: string) => new Date(value).toLocaleString(locale);

  const reasonLabel = (reason: 'POINTS_EXCHANGE' | 'COMPLAINT') =>
    reason === 'COMPLAINT' ? t('reasonComplaint') : t('reasonPointsExchange');
  const statusLabel = (status: 'ACTIVE' | 'USED' | 'EXPIRED') => {
    if (status === 'ACTIVE') {
      return t('active');
    }
    if (status === 'USED') {
      return t('used');
    }
    return t('expired');
  };

  const languageOptions: { value: Language; label: TranslationKey; short: string }[] = [
    { value: 'pl', label: 'languagePolish', short: 'PL' },
    { value: 'en', label: 'languageEnglish', short: 'EN' },
    { value: 'de', label: 'languageGerman', short: 'DE' },
  ];

  const sessionCountdown = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor(sessionLeftMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [sessionLeftMs]);

  const couponSortValues = useMemo(() => {
    const values = new Set<string>();
    coupons.forEach((coupon) => {
      if (couponSortBy === 'reason') {
        values.add(coupon.reason);
      } else if (couponSortBy === 'country') {
        values.add(coupon.country);
      } else {
        values.add(coupon.status);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [coupons, couponSortBy]);

  const filteredCoupons = useMemo(() => {
    const searched = coupons.filter((coupon) =>
      coupon.couponCode.toLowerCase().includes(couponCodeSearch.trim().toLowerCase()),
    );
    const valueFiltered = searched.filter((coupon) => {
      if (couponSortValue === 'ALL') {
        return true;
      }
      if (couponSortBy === 'reason') {
        return coupon.reason === couponSortValue;
      }
      if (couponSortBy === 'country') {
        return coupon.country === couponSortValue;
      }
      return coupon.status === couponSortValue;
    });
    return [...valueFiltered].sort((a, b) => {
      let left = '';
      let right = '';
      if (couponSortBy === 'reason') {
        left = a.reason === 'COMPLAINT'
          ? translate(language, 'reasonComplaint')
          : translate(language, 'reasonPointsExchange');
        right = b.reason === 'COMPLAINT'
          ? translate(language, 'reasonComplaint')
          : translate(language, 'reasonPointsExchange');
      } else if (couponSortBy === 'country') {
        left = a.country;
        right = b.country;
      } else {
        left = a.status;
        right = b.status;
      }
      return left.localeCompare(right);
    });
  }, [coupons, couponCodeSearch, couponSortBy, couponSortValue, language]);

  const purchaseHistorySeries = useMemo(() => {
    const dailyTotals = new Map<string, number>();
    customerTransactions.forEach((transaction) => {
      if (transaction.points <= 0) {
        return;
      }
      const day = transaction.timestamp.slice(0, 10);
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + transaction.points);
    });

    const points = Array.from(dailyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));

    const maxTotal = points.reduce((acc, item) => Math.max(acc, item.total), 0);
    return { points, maxTotal };
  }, [customerTransactions]);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const interval = window.setInterval(() => {
      handleSessionTick();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      refreshDataForActiveTab();
    }
  }, [activeTab, loggedIn]);

  useEffect(() => {
    window.localStorage.setItem('app_language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem('app_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (authRole === 'TECHNICAL' && (activeTab === 'add-points' || activeTab === 'technical-accounts')) {
      setActiveTab('customers');
    }
  }, [activeTab, authRole]);

  useEffect(() => {
    if (authRole === 'TECHNICAL' && authCountry) {
      setTechnicalUserForm((prev) => ({ ...prev, country: authCountry }));
    }
  }, [authRole, authCountry]);

  useEffect(() => {
    setPromotionForm((prev) => {
      if (prev.id !== null || prev.country) {
        return prev;
      }
      return { ...prev, country: authCountry ?? '' };
    });
  }, [authCountry]);

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }
    const updated = customers.find((customer) => customer.id === selectedCustomer.id);
    if (updated) {
      setSelectedCustomer(updated);
    }
  }, [customers, selectedCustomer]);

  useEffect(() => {
    if (!success) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSuccess(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const closeCouponDialog = () => {
    setCouponDialog(null);
    setCouponDialogError(null);
  };

  const closePromotionModal = () => {
    resetPromotionForm();
    setPromotionView(null);
  };

  const closeTechnicalPasswordModal = () => {
    setTechnicalPasswordModalUser(null);
    setTechnicalPasswordValue('');
    setTechnicalPasswordVisible(false);
  };

  const handleSessionTick = useEffectEvent(() => {
    const left = getExpiresAt() - Date.now();
    if (left <= 0) {
      handleLogout(true);
      return;
    }
    setSessionLeftMs(left);
  });

  const refreshDataForActiveTab = useEffectEvent(() => {
    void fetchData();
  });

  const handleGlobalEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return;
    }
    if (technicalPasswordModalUser) {
      closeTechnicalPasswordModal();
      return;
    }
    if (promotionView) {
      if (promotionView === 'create') {
        closePromotionModal();
      } else {
        setPromotionView(null);
      }
      return;
    }
    if (couponDialog) {
      closeCouponDialog();
      return;
    }
    if (selectedCustomer) {
      closeCustomerModal();
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleGlobalEscape(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const extractApiError = (err: unknown, fallback: string) => {
    if (!err || typeof err !== 'object') {
      return fallback;
    }
    const apiError = err as ApiErrorLike;
    return apiError.response?.data?.detail
      || apiError.response?.data?.error
      || apiError.message
      || fallback;
  };

  const isUnauthorizedOrExpiredError = (err: unknown) => {
    if (!err || typeof err !== 'object') {
      return false;
    }
    const apiError = err as ApiErrorLike;
    return apiError.response?.status === 401 || apiError.message === 'Session expired';
  };

  const dateTimeToInputValue = (value: string | null) => {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  const resetPromotionForm = () => {
    setPromotionForm({
      id: null,
      name: '',
      country: authCountry ?? '',
      pointsPerCurrency: '',
      startsAt: '',
      endsAt: '',
      enabled: true,
    });
  };

  const handleLogout = (sessionExpired = false) => {
    logout();
    setLoggedIn(false);
    setAuthRole(null);
    setAuthCountry(null);
    setCustomers([]);
    setCoupons([]);
    setStorePromotions([]);
    setTechnicalUsers([]);
    resetPromotionForm();
    setError(null);
    setSuccess(null);
    setAuthError(sessionExpired ? t('sessionExpired') : null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const auth = await login(username, password);
      setLoggedIn(true);
      setAuthRole(auth.role);
      setAuthCountry(auth.country);
      setSessionLeftMs(getExpiresAt() - Date.now());
    } catch {
      setAuthError(t('invalidCredentials'));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    clearMessages();
    try {
      const [custRes, countriesRes, couponPrefixesRes, couponsRes, couponTemplatesRes] = await Promise.all([
        api.get<Customer[]>('/customers'),
        api.get<string[]>('/config/countries'),
        api.get<string[]>('/config/coupon-prefixes'),
        api.get<Coupon[]>('/coupons'),
        api.get<CouponTemplate[]>('/coupon-templates'),
      ]);
      setCustomers(custRes.data);
      setAvailableCountries(countriesRes.data);
      setAvailableCouponPrefixes(couponPrefixesRes.data);
      setCoupons(couponsRes.data);
      setCouponTemplates(couponTemplatesRes.data);
      const currentRole = getAuthRole();
      const currentCountry = getAuthCountry();
      setAuthRole(currentRole);
      setAuthCountry(currentCountry);
      if (currentRole === 'ADMIN') {
        const [technicalUsersRes, promotionsRes] = await Promise.all([
          api.get<TechnicalUser[]>('/technical-users'),
          api.get<StorePromotion[]>('/store-promotions'),
        ]);
        setTechnicalUsers(technicalUsersRes.data);
        setStorePromotions(promotionsRes.data);
      } else if (currentRole === 'TECHNICAL') {
        const promotionsRes = await api.get<StorePromotion[]>('/store-promotions');
        setStorePromotions(promotionsRes.data);
        setTechnicalUsers([]);
        setTechnicalPasswordModalUser(null);
        setTechnicalPasswordValue('');
        setTechnicalPasswordVisible(false);
      } else {
        setStorePromotions([]);
        setTechnicalUsers([]);
        setTechnicalPasswordModalUser(null);
        setTechnicalPasswordValue('');
        setTechnicalPasswordVisible(false);
      }
      setSessionLeftMs(getExpiresAt() - Date.now());
    } catch (err: unknown) {
      if (isUnauthorizedOrExpiredError(err)) {
        handleLogout(true);
        return;
      }
      setError(t('apiConnectionError', { details: extractApiError(err, 'Request failed') }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post('/customers', newCustomer);
      setNewCustomer({ firstName: '', lastName: '', email: '', customerNumber: '', phoneNumber: '', country: '' });
      setActiveTab('customers');
      await fetchData();
      setSuccess(t('customerAddedSuccess'));
    } catch (err: unknown) {
      setError(extractApiError(err, t('addCustomerError')));
    }
  };

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post(`/customers/${newPoints.customerId}/add-points`, {
        points: Number(newPoints.points),
        description: newPoints.description,
      });
      setActiveTab('customers');
      await fetchData();
      setSuccess(t('pointsAddedSuccess'));
    } catch (err: unknown) {
      setError(extractApiError(err, t('addPointsError')));
    }
  };

  const handleIssueCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setCouponDialogError(null);
    try {
      const response = await api.post<Coupon>('/coupons/issue', {
        customerId: Number(couponForm.customerId),
        couponTemplateId: Number(couponForm.couponTemplateId),
        reason: couponForm.reason,
      });
      setCouponForm({
        customerId: '',
        couponTemplateId: '',
        reason: '',
      });
      closeCouponDialog();
      await fetchData();
      setSuccess(t('couponGeneratedSuccess', { code: response.data.couponCode }));
    } catch (err: unknown) {
      setCouponDialogError(extractApiError(err, t('issueCouponError')));
    }
  };

  const handleCreateCouponTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setCouponDialogError(null);
    try {
      await api.post('/coupon-templates', {
        couponValue: Number(couponTemplateForm.couponValue),
        minimumPurchaseValue: Number(couponTemplateForm.minimumPurchaseValue),
        requiredPoints: Number(couponTemplateForm.requiredPoints),
        country: couponTemplateForm.country,
        validityDays: Number(couponTemplateForm.validityDays),
        couponPrefix: couponTemplateForm.couponPrefix,
      });
      setCouponTemplateForm({
        couponValue: '',
        minimumPurchaseValue: '',
        requiredPoints: '',
        country: '',
        validityDays: '',
        couponPrefix: '',
      });
      closeCouponDialog();
      await fetchData();
      setSuccess(t('couponTemplateSaved'));
    } catch (err: unknown) {
      setCouponDialogError(extractApiError(err, t('couponTemplateSaveError')));
    }
  };

  const handleImportCustomers = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!importFile) {
      setError(t('selectCsvForImport'));
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setImporting(true);
      const response = await api.post<{ importedCount: number }>('/tools/import-customers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportFile(null);
      setActiveTab('customers');
      await fetchData();
      setSuccess(t('importCustomersSuccess', { count: response.data.importedCount }));
    } catch (err: unknown) {
      setError(extractApiError(err, t('importCustomersError')));
    } finally {
      setImporting(false);
    }
  };

  const handleCreateTechnicalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      setTechnicalUsersLoading(true);
      await api.post('/technical-users', technicalUserForm);
      setTechnicalUserForm({
        username: '',
        password: '',
        country: authCountry ?? '',
        enabled: true,
      });
      const technicalUsersRes = await api.get<TechnicalUser[]>('/technical-users');
      setTechnicalUsers(technicalUsersRes.data);
      setSuccess(t('technicalUserCreated'));
    } catch (err: unknown) {
      setError(extractApiError(err, t('technicalUserCreateError')));
    } finally {
      setTechnicalUsersLoading(false);
    }
  };

  const handleToggleTechnicalUser = async (userId: number, enabled: boolean) => {
    clearMessages();
    try {
      await api.patch(`/technical-users/${userId}/status`, { enabled });
      setTechnicalUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, enabled } : user)));
    } catch (err: unknown) {
      setError(extractApiError(err, t('technicalUserToggleError')));
    }
  };

  const handleUpdateTechnicalUserPassword = async (userId: number, password: string) => {
    if (!password.trim()) {
      setError(t('technicalUserPasswordRequired'));
      return;
    }
    clearMessages();
    try {
      const response = await api.patch<TechnicalUser>(`/technical-users/${userId}/password`, { password });
      setTechnicalUsers((prev) => prev.map((user) => (user.id === userId ? response.data : user)));
      if (technicalPasswordModalUser?.id === userId) {
        setTechnicalPasswordModalUser(response.data);
        setTechnicalPasswordValue(response.data.passwordPreview);
      }
      setTechnicalPasswordModalUser(null);
      setSuccess(t('technicalUserPasswordUpdated'));
    } catch (err: unknown) {
      setError(extractApiError(err, t('technicalUserPasswordUpdateError')));
    }
  };

  const handleEditPromotion = (promotion: StorePromotion) => {
    setPromotionForm({
      id: promotion.id,
      name: promotion.name,
      country: promotion.country,
      pointsPerCurrency: String(promotion.pointsPerCurrency),
      startsAt: dateTimeToInputValue(promotion.startsAt),
      endsAt: dateTimeToInputValue(promotion.endsAt),
      enabled: promotion.enabled,
    });
    setPromotionView('create');
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!promotionForm.name || !promotionForm.country || !promotionForm.pointsPerCurrency || !promotionForm.startsAt) {
      setError(t('promotionValidationError'));
      return;
    }

    const payload = {
      name: promotionForm.name.trim(),
      country: promotionForm.country,
      pointsPerCurrency: Number(promotionForm.pointsPerCurrency),
      startsAt: new Date(promotionForm.startsAt).toISOString(),
      endsAt: promotionForm.endsAt ? new Date(promotionForm.endsAt).toISOString() : null,
      enabled: promotionForm.enabled,
    };

    if (payload.pointsPerCurrency <= 0) {
      setError(t('promotionPointsPerCurrencyError'));
      return;
    }

    try {
      setPromotionSaving(true);
      let successMessage = '';
      if (promotionForm.id === null) {
        await api.post('/store-promotions', payload);
        successMessage = t('promotionCreatedSuccess');
      } else {
        await api.put(`/store-promotions/${promotionForm.id}`, payload);
        successMessage = t('promotionUpdatedSuccess');
      }
      closePromotionModal();
      await fetchData();
      setSuccess(successMessage);
    } catch (err: unknown) {
      setError(extractApiError(err, t('promotionSaveError')));
    } finally {
      setPromotionSaving(false);
    }
  };

  const handleTogglePromotionStatus = async (promotion: StorePromotion, enabled: boolean) => {
    clearMessages();
    try {
      await api.patch(`/store-promotions/${promotion.id}/status`, { enabled });
      setStorePromotions((prev) => prev.map((item) => (item.id === promotion.id ? { ...item, enabled } : item)));
      setSuccess(enabled ? t('promotionEnabledSuccess') : t('promotionDisabledSuccess'));
      if (promotionForm.id === promotion.id) {
        setPromotionForm((prev) => ({ ...prev, enabled }));
      }
    } catch (err: unknown) {
      setError(extractApiError(err, t('promotionStatusUpdateError')));
    }
  };

  const closeCustomerModal = () => {
    setSelectedCustomer(null);
    setCustomerModalTab('profile');
    setCustomerModalError(null);
    setCustomerTransactions([]);
    setCustomerCoupons([]);
    setCustomerCouponForm({ couponTemplateId: '', reason: '' });
  };

  const fetchCustomerModalData = async (customerId: number) => {
    setCustomerModalLoading(true);
    setCustomerModalError(null);
    try {
      const [transactionsRes, customerCouponsRes] = await Promise.all([
        api.get<CustomerTransaction[]>(`/customers/${customerId}/transactions`),
        api.get<Coupon[]>(`/customers/${customerId}/coupons`),
      ]);
      setCustomerTransactions(transactionsRes.data);
      setCustomerCoupons(customerCouponsRes.data);
    } catch (err: unknown) {
      setCustomerModalError(extractApiError(err, t('apiConnectionError', { details: 'Request failed' })));
    } finally {
      setCustomerModalLoading(false);
    }
  };

  const openCustomerModal = async (customer: Customer) => {
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
    await fetchCustomerModalData(customer.id);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      return;
    }
    setCustomerModalError(null);
    clearMessages();
    try {
      const response = await api.put<Customer>(`/customers/${selectedCustomer.id}`, customerEditForm);
      setSelectedCustomer(response.data);
      await fetchData();
      setSuccess(t('customerSavedSuccess'));
    } catch (err: unknown) {
      setCustomerModalError(extractApiError(err, t('customerSaveError')));
    }
  };

  const handleIssueCouponForSelectedCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      return;
    }
    setCustomerModalError(null);
    clearMessages();
    try {
      const response = await api.post<Coupon>('/coupons/issue', {
        customerId: selectedCustomer.id,
        couponTemplateId: Number(customerCouponForm.couponTemplateId),
        reason: customerCouponForm.reason,
      });
      setCustomerCouponForm({ couponTemplateId: '', reason: '' });
      await Promise.all([fetchData(), fetchCustomerModalData(selectedCustomer.id)]);
      setSuccess(t('couponGeneratedSuccess', { code: response.data.couponCode }));
      closeCustomerModal();
    } catch (err: unknown) {
      setCustomerModalError(extractApiError(err, t('issueCouponError')));
    }
  };

  const navigationTabs: { key: Tab; label: React.ReactNode }[] = [
    { key: 'customers', label: <Space size={6}><Users size={16} />{t('tabCustomers')}</Space> },
    { key: 'add-customer', label: <Space size={6}><UserPlus size={16} />{t('tabAddCustomer')}</Space> },
    { key: 'coupons', label: <Space size={6}><Ticket size={16} />{t('tabCoupons')}</Space> },
    { key: 'tools', label: <Space size={6}><Wrench size={16} />{t('tabTools')}</Space> },
  ];
  if (authRole === 'ADMIN') {
    navigationTabs.splice(2, 0, { key: 'add-points', label: <Space size={6}><PlusCircle size={16} />{t('tabAddPoints')}</Space> });
    navigationTabs.push({ key: 'technical-accounts', label: <Space size={6}><Wrench size={16} />{t('tabTechnicalAccounts')}</Space> });
  }
  if (authRole === 'ADMIN' || authRole === 'TECHNICAL') {
    navigationTabs.push({ key: 'store-promotions', label: <Space size={6}><Percent size={16} />{t('tabStorePromotions')}</Space> });
  }

  if (!loggedIn) {
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
        authError={authError}
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
          loading={loading}
          sessionCountdown={sessionCountdown}
          language={language}
          setLanguage={setLanguage}
          languageOptions={languageOptions.map(({ value, short }) => ({ value, short }))}
          theme={theme}
          setTheme={setTheme}
          handleLogout={() => handleLogout()}
          t={t}
        />

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as Tab)}
          items={navigationTabs}
        />

        <div className="content">
          {error && <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} />}

        {activeTab === 'customers' && (
          <CustomersSection customers={customers} t={t} openCustomerModal={openCustomerModal} />
        )}

        {selectedCustomer && (
          <CustomerDetailsModal
            selectedCustomer={selectedCustomer}
            closeCustomerModal={closeCustomerModal}
            customerModalTab={customerModalTab}
            setCustomerModalTab={setCustomerModalTab}
            customerModalError={customerModalError}
            customerModalLoading={customerModalLoading}
            handleSaveCustomer={handleSaveCustomer}
            customerEditForm={customerEditForm}
            setCustomerEditForm={setCustomerEditForm}
            availableCountries={availableCountries}
            purchaseHistorySeries={purchaseHistorySeries}
            customerTransactions={customerTransactions}
            customerCouponForm={customerCouponForm}
            setCustomerCouponForm={setCustomerCouponForm}
            handleIssueCouponForSelectedCustomer={handleIssueCouponForSelectedCustomer}
            couponTemplates={couponTemplates}
            customerCoupons={customerCoupons}
            statusLabel={statusLabel}
            reasonLabel={reasonLabel}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            t={t}
          />
        )}

        {activeTab === 'add-customer' && (
          <AddCustomerSection
            t={t}
            newCustomer={newCustomer}
            setNewCustomer={setNewCustomer}
            availableCountries={availableCountries}
            handleAddCustomer={handleAddCustomer}
          />
        )}

        {activeTab === 'add-points' && authRole === 'ADMIN' && (
          <AddPointsSection
            t={t}
            newPoints={newPoints}
            setNewPoints={setNewPoints}
            customers={customers}
            handleAddPoints={handleAddPoints}
          />
        )}

        {activeTab === 'coupons' && (
          <CouponsSection
            t={t}
            setCouponDialog={setCouponDialog}
            setCouponDialogError={setCouponDialogError}
            closeCouponDialog={closeCouponDialog}
            couponDialog={couponDialog}
            couponDialogError={couponDialogError}
            handleIssueCoupon={handleIssueCoupon}
            couponForm={couponForm}
            setCouponForm={setCouponForm}
            customers={customers}
            couponTemplates={couponTemplates}
            handleCreateCouponTemplate={handleCreateCouponTemplate}
            couponTemplateForm={couponTemplateForm}
            setCouponTemplateForm={setCouponTemplateForm}
            availableCountries={availableCountries}
            availableCouponPrefixes={availableCouponPrefixes}
            couponCodeSearch={couponCodeSearch}
            setCouponCodeSearch={setCouponCodeSearch}
            couponSortBy={couponSortBy}
            setCouponSortBy={setCouponSortBy}
            couponSortValue={couponSortValue}
            setCouponSortValue={setCouponSortValue}
            couponSortValues={couponSortValues}
            filteredCoupons={filteredCoupons}
            reasonLabel={reasonLabel}
            statusLabel={statusLabel}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === 'store-promotions' && (authRole === 'ADMIN' || authRole === 'TECHNICAL') && (
          <StorePromotionsSection
            t={t}
            availableCountries={availableCountries}
            promotionView={promotionView}
            setPromotionView={setPromotionView}
            resetPromotionForm={resetPromotionForm}
            closePromotionModal={closePromotionModal}
            promotionForm={promotionForm}
            setPromotionForm={setPromotionForm}
            handleSavePromotion={handleSavePromotion}
            promotionSaving={promotionSaving}
            storePromotions={storePromotions}
            handleEditPromotion={handleEditPromotion}
            handleTogglePromotionStatus={handleTogglePromotionStatus}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsSection
            t={t}
            importing={importing}
            setImportFile={setImportFile}
            handleImportCustomers={handleImportCustomers}
          />
        )}

        {activeTab === 'technical-accounts' && authRole === 'ADMIN' && (
          <TechnicalAccountsSection
            t={t}
            availableCountries={availableCountries}
            technicalUserForm={technicalUserForm}
            setTechnicalUserForm={setTechnicalUserForm}
            technicalUsersLoading={technicalUsersLoading}
            handleCreateTechnicalUser={handleCreateTechnicalUser}
            technicalUsers={technicalUsers}
            handleToggleTechnicalUser={handleToggleTechnicalUser}
            technicalPasswordModalUser={technicalPasswordModalUser}
            setTechnicalPasswordModalUser={setTechnicalPasswordModalUser}
            technicalPasswordValue={technicalPasswordValue}
            setTechnicalPasswordValue={setTechnicalPasswordValue}
            technicalPasswordVisible={technicalPasswordVisible}
            setTechnicalPasswordVisible={setTechnicalPasswordVisible}
            closeTechnicalPasswordModal={closeTechnicalPasswordModal}
            handleUpdateTechnicalUserPassword={handleUpdateTechnicalUserPassword}
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
    </div>
    </ConfigProvider>
  );
}

export default App;







