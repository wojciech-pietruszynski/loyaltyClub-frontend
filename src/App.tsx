import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, ConfigProvider, Input, Segmented, Space, Spin, Tabs, Typography, theme as antdTheme } from 'antd';
import { Eye, EyeOff, Info, PenSquare, Percent, PlusCircle, Ticket, UserPlus, Users, Wrench, X } from 'lucide-react';
import api, { getAuthCountry, getAuthRole, getExpiresAt, isAuthenticated, login, logout, type AuthRole } from './api/client';
import { translate, type Language, type TranslationKey } from './i18n';
import appLogo from './assets/logo.png';
import type { Coupon, CouponTemplate, Customer, CustomerTransaction, StorePromotion, TechnicalUser } from './types';
import './App.css';

type Tab = 'customers' | 'add-points' | 'coupons' | 'add-customer' | 'store-promotions' | 'tools' | 'technical-accounts';
type CustomerModalTab = 'profile' | 'balance' | 'issue-coupon' | 'coupon-history';
type Theme = 'light' | 'dark';

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

  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    customerNumber: '',
    phoneNumber: '',
    country: '',
  });
  const [newPoints, setNewPoints] = useState({ customerId: '', points: 0, description: translate(language, 'purchaseProducts') });
  const [couponForm, setCouponForm] = useState({
    customerId: '',
    couponTemplateId: '',
    reason: '',
  });
  const [couponTemplateForm, setCouponTemplateForm] = useState({
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
  const [customerEditForm, setCustomerEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    customerNumber: '',
    phoneNumber: '',
    country: '',
  });
  const [customerCouponForm, setCustomerCouponForm] = useState({
    couponTemplateId: '',
    reason: '',
  });
  const [technicalUsers, setTechnicalUsers] = useState<TechnicalUser[]>([]);
  const [technicalUserForm, setTechnicalUserForm] = useState({
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
  const [promotionForm, setPromotionForm] = useState({
    id: null as number | null,
    name: '',
    country: '',
    pointsPerCurrency: '',
    startsAt: '',
    endsAt: '',
    enabled: true,
  });
  const t = (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params);

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
        left = reasonLabel(a.reason);
        right = reasonLabel(b.reason);
      } else if (couponSortBy === 'country') {
        left = a.country;
        right = b.country;
      } else {
        left = a.status;
        right = b.status;
      }
      return left.localeCompare(right);
    });
  }, [coupons, couponCodeSearch, couponSortBy, couponSortValue]);

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
      const left = getExpiresAt() - Date.now();
      if (left <= 0) {
        handleLogout(true);
      } else {
        setSessionLeftMs(left);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      fetchData();
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
    if (authRole === 'TECHNICAL' && (activeTab === 'add-points' || activeTab === 'store-promotions' || activeTab === 'technical-accounts')) {
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [couponDialog, promotionView, selectedCustomer, technicalPasswordModalUser]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const extractApiError = (err: any, fallback: string) =>
    err?.response?.data?.detail || err?.response?.data?.error || fallback;

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
      } else {
        setStorePromotions([]);
        setTechnicalUsers([]);
        setTechnicalPasswordModalUser(null);
        setTechnicalPasswordValue('');
        setTechnicalPasswordVisible(false);
      }
      setSessionLeftMs(getExpiresAt() - Date.now());
    } catch (err: any) {
      if (err.response?.status === 401 || err.message === 'Session expired') {
        handleLogout(true);
        return;
      }
      setError(t('apiConnectionError', { details: extractApiError(err, err.message) }));
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      setCustomerModalError(extractApiError(err, t('apiConnectionError', { details: err.message })));
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    navigationTabs.push({ key: 'store-promotions', label: <Space size={6}><Percent size={16} />{t('tabStorePromotions')}</Space> });
    navigationTabs.push({ key: 'technical-accounts', label: <Space size={6}><Wrench size={16} />{t('tabTechnicalAccounts')}</Space> });
  }

  if (!loggedIn) {
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
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>{t('login')}</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t('password')}</label>
                <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} required />
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

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: '#6366f1', borderRadius: 10 },
      }}
    >
      <div className="container">
        <header className="header">
          <img className="app-logo" src={appLogo} alt={t('appTitle')} />
          <div className="topbar-controls">
            <Space className="session-pill" size={8}>
              <Typography.Text className="session-label">{t('session')}</Typography.Text>
              <Typography.Text strong>{sessionCountdown}</Typography.Text>
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
              <Button type="default" onClick={() => handleLogout()}>{t('logout')}</Button>
            </div>
          </div>
        </header>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as Tab)}
          items={navigationTabs}
        />

        <div className="content">
          {error && <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} />}

        {activeTab === 'customers' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{t('tabCustomers')}</h2>
            </div>
            {customers.length === 0 ? (
              <p>{t('noCustomersInSystem')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('firstName')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('lastName')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('email')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('customerNumberShort')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('phone')}</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('points')}</th>
                      <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{c.firstName}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{c.lastName}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{c.email}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{c.customerNumber}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{c.phoneNumber}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{c.country}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{c.loyaltyPoints}</td>
                        <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                          <button
                            className="btn icon-btn"
                            type="button"
                            aria-label={t('customerDetailsModalTitle')}
                            title={t('customerDetailsModalTitle')}
                            onClick={() => {
                              void openCustomerModal(c);
                            }}
                          >
                            <Info size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {selectedCustomer && (
          <div
            className="modal-overlay"
            onClick={closeCustomerModal}
            role="presentation"
          >
            <div
              className="card modal-panel"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={t('customerDetailsModalTitle')}
            >
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0 }}>{t('customerDetailsModalTitle')}</h2>
                  <div style={{ color: 'var(--text-light)' }}>
                    {selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.customerNumber})
                  </div>
                </div>
                <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCustomerModal} aria-label={t('close')} title={t('close')}>
                  <X size={16} />
                </button>
              </div>

              <div className="modal-tabs">
                <button className={`btn ${customerModalTab === 'profile' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('profile')}>
                  {t('customerModalTabProfile')}
                </button>
                <button className={`btn ${customerModalTab === 'balance' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('balance')}>
                  {t('customerModalTabBalance')}
                </button>
                <button className={`btn ${customerModalTab === 'issue-coupon' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('issue-coupon')}>
                  {t('customerModalTabCreateCoupon')}
                </button>
                <button className={`btn ${customerModalTab === 'coupon-history' ? 'btn-primary' : ''}`} type="button" onClick={() => setCustomerModalTab('coupon-history')}>
                  {t('customerModalTabCouponHistory')}
                </button>
              </div>

              {customerModalError && <div className="error-msg" style={{ marginBottom: '1rem' }}>{customerModalError}</div>}
              {customerModalLoading && <div>{t('loading')}</div>}

              {!customerModalLoading && customerModalTab === 'profile' && (
                <form onSubmit={handleSaveCustomer}>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    <div className="form-group"><label>{t('firstName')}</label><input className="input" value={customerEditForm.firstName} onChange={(e) => setCustomerEditForm({ ...customerEditForm, firstName: e.target.value })} required /></div>
                    <div className="form-group"><label>{t('lastName')}</label><input className="input" value={customerEditForm.lastName} onChange={(e) => setCustomerEditForm({ ...customerEditForm, lastName: e.target.value })} required /></div>
                    <div className="form-group"><label>{t('email')}</label><input className="input" type="email" value={customerEditForm.email} onChange={(e) => setCustomerEditForm({ ...customerEditForm, email: e.target.value })} required /></div>
                    <div className="form-group"><label>{t('customerNumber')}</label><input className="input" value={customerEditForm.customerNumber} onChange={(e) => setCustomerEditForm({ ...customerEditForm, customerNumber: e.target.value })} required /></div>
                    <div className="form-group"><label>{t('phoneNumber')}</label><input className="input" value={customerEditForm.phoneNumber} onChange={(e) => setCustomerEditForm({ ...customerEditForm, phoneNumber: e.target.value })} required /></div>
                    <div className="form-group">
                      <label>{t('country')}</label>
                      <select className="input" value={customerEditForm.country} onChange={(e) => setCustomerEditForm({ ...customerEditForm, country: e.target.value })} required>
                        <option value="">{t('selectCountry')}</option>
                        {availableCountries.map((countryCode) => (<option key={countryCode} value={countryCode}>{countryCode}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">{t('save')}</button>
                  </div>
                </form>
              )}

              {!customerModalLoading && customerModalTab === 'balance' && (
                <div>
                  <div className="card" style={{ marginTop: 0 }}>
                    <strong>{t('currentBalance')}: </strong>{selectedCustomer.loyaltyPoints} {t('pointsShort')}
                  </div>
                  <h3>{t('purchaseHistoryChartTitle')}</h3>
                  {purchaseHistorySeries.points.length === 0 ? (
                    <p>{t('noPurchaseHistory')}</p>
                  ) : (
                    <div className="purchase-chart">
                      {purchaseHistorySeries.points.map((point) => {
                        const ratio = purchaseHistorySeries.maxTotal > 0 ? point.total / purchaseHistorySeries.maxTotal : 0;
                        return (
                          <div key={point.date} className="purchase-chart-row">
                            <div className="purchase-chart-label">{point.date}</div>
                            <div className="purchase-chart-bar-wrap">
                              <div className="purchase-chart-bar" style={{ width: `${Math.max(5, Math.round(ratio * 100))}%` }} />
                            </div>
                            <div className="purchase-chart-value">{point.total}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!customerModalLoading && customerModalTab === 'issue-coupon' && (
                <form onSubmit={handleIssueCouponForSelectedCustomer}>
                  <div className="form-group">
                    <label>{t('couponTemplate')}</label>
                    <select className="input" value={customerCouponForm.couponTemplateId} onChange={(e) => setCustomerCouponForm({ ...customerCouponForm, couponTemplateId: e.target.value })} required>
                      <option value="">{t('selectTemplate')}</option>
                      {couponTemplates
                        .filter((template) => template.country === selectedCustomer.country)
                        .map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.couponPrefix} | {template.country} | {t('templateOptionValue')} {template.couponValue} | {t('templateOptionMin')} {template.minimumPurchaseValue} | {t('templateOptionPoints')} {template.requiredPoints} | {template.validityDays} {t('templateOptionDays')}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('reason')}</label>
                    <select className="input" value={customerCouponForm.reason} onChange={(e) => setCustomerCouponForm({ ...customerCouponForm, reason: e.target.value })} required>
                      <option value="">{t('selectReason')}</option>
                      <option value="POINTS_EXCHANGE">{t('reasonPointsExchange')}</option>
                      <option value="COMPLAINT">{t('reasonComplaint')}</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">{t('generateCoupon')}</button>
                  </div>
                </form>
              )}

              {!customerModalLoading && customerModalTab === 'coupon-history' && (
                <div>
                  {customerCoupons.length === 0 ? (
                    <p>{t('noCustomerCoupons')}</p>
                  ) : (
                    <div style={{ overflowX: 'auto', maxHeight: '45vh' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('code')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('reason')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('createdAt')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('expiresAt')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerCoupons.map((coupon) => (
                            <tr key={coupon.id}>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.couponCode}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{statusLabel(coupon.status)}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{reasonLabel(coupon.reason)}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{new Date(coupon.issuedAt).toLocaleString()}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{new Date(coupon.expiresAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'add-customer' && (
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2>{t('tabAddCustomer')}</h2>
            <form onSubmit={handleAddCustomer}>
              <div className="form-group"><label>{t('firstName')}</label><input className="input" value={newCustomer.firstName} onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} required /></div>
              <div className="form-group"><label>{t('lastName')}</label><input className="input" value={newCustomer.lastName} onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} required /></div>
              <div className="form-group"><label>{t('email')}</label><input className="input" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} required /></div>
              <div className="form-group"><label>{t('customerNumber')}</label><input className="input" value={newCustomer.customerNumber} onChange={(e) => setNewCustomer({ ...newCustomer, customerNumber: e.target.value })} required /></div>
              <div className="form-group"><label>{t('phoneNumber')}</label><input className="input" value={newCustomer.phoneNumber} onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })} required /></div>
              <div className="form-group">
                <label>{t('country')}</label>
                <select className="input" value={newCustomer.country} onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })} required>
                  <option value="">{t('selectCountry')}</option>
                  {availableCountries.map((countryCode) => (<option key={countryCode} value={countryCode}>{countryCode}</option>))}
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{t('addCustomer')}</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'add-points' && authRole === 'ADMIN' && (
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2>{t('tabAddPoints')}</h2>
            <form onSubmit={handleAddPoints}>
              <div className="form-group">
                <label>{t('chooseCustomer')}</label>
                <select className="input" value={newPoints.customerId} onChange={(e) => setNewPoints({ ...newPoints, customerId: e.target.value })} required>
                  <option value="">{t('select')}</option>
                  {customers.map((c) => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.customerNumber})</option>))}
                </select>
              </div>
              <div className="form-group"><label>{t('pointsCount')}</label><input className="input" type="number" value={newPoints.points} onChange={(e) => setNewPoints({ ...newPoints, points: parseInt(e.target.value, 10) || 0 })} required /></div>
              <div className="form-group"><label>{t('description')}</label><input className="input" value={newPoints.description} onChange={(e) => setNewPoints({ ...newPoints, description: e.target.value })} required /></div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{t('addPointsAction')}</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div>
            <div className="grid coupon-actions-grid">
              <div
                className="card action-tile"
                style={{ textAlign: 'center' }}
                role="button"
                tabIndex={0}
                onClick={() => { setCouponDialogError(null); setCouponDialog('issue'); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCouponDialogError(null);
                    setCouponDialog('issue');
                  }
                }}
              >
                <h3>{t('createCouponTileTitle')}</h3>
                <p>{t('createCouponTileDesc')}</p>
              </div>
              <div
                className="card action-tile"
                style={{ textAlign: 'center' }}
                role="button"
                tabIndex={0}
                onClick={() => { setCouponDialogError(null); setCouponDialog('template'); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCouponDialogError(null);
                    setCouponDialog('template');
                  }
                }}
              >
                <h3>{t('createTemplateTileTitle')}</h3>
                <p>{t('createTemplateTileDesc')}</p>
              </div>
              <div
                className="card action-tile"
                style={{ textAlign: 'center' }}
                role="button"
                tabIndex={0}
                onClick={() => { setCouponDialogError(null); setCouponDialog('browse'); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCouponDialogError(null);
                    setCouponDialog('browse');
                  }
                }}
              >
                <h3>{t('browseCouponsTileTitle')}</h3>
                <p>{t('browseCouponsTileDesc')}</p>
              </div>
              <div
                className="card action-tile"
                style={{ textAlign: 'center' }}
                role="button"
                tabIndex={0}
                onClick={() => { setCouponDialogError(null); setCouponDialog('browse-templates'); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCouponDialogError(null);
                    setCouponDialog('browse-templates');
                  }
                }}
              >
                <h3>{t('toolsBrowseTemplatesTileTitle')}</h3>
                <p>{t('toolsBrowseTemplatesTileDesc')}</p>
              </div>
            </div>

            {couponDialog === 'issue' && (
              <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
                <div className="card modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-issue-title">
                  <div className="modal-header">
                    <h2 id="coupon-issue-title" style={{ margin: 0 }}>{t('createCouponTitle')}</h2>
                    <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                      <X size={16} />
                    </button>
                  </div>
                  {couponDialogError && <div className="error-msg" style={{ marginBottom: '1rem' }}>{couponDialogError}</div>}
                  <form onSubmit={handleIssueCoupon}>
                    <div className="form-group">
                      <label>{t('customer')}</label>
                      <select className="input" value={couponForm.customerId} onChange={(e) => setCouponForm({ ...couponForm, customerId: e.target.value })} required>
                        <option value="">{t('select')}</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.country}, {t('pointsShort')}: {c.loyaltyPoints})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('couponTemplate')}</label>
                      <select className="input" value={couponForm.couponTemplateId} onChange={(e) => setCouponForm({ ...couponForm, couponTemplateId: e.target.value })} required>
                        <option value="">{t('selectTemplate')}</option>
                        {couponTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.couponPrefix} | {template.country} | {t('templateOptionValue')} {template.couponValue} | {t('templateOptionMin')} {template.minimumPurchaseValue} | {t('templateOptionPoints')} {template.requiredPoints} | {template.validityDays} {t('templateOptionDays')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('reason')}</label>
                      <select className="input" value={couponForm.reason} onChange={(e) => setCouponForm({ ...couponForm, reason: e.target.value })} required>
                        <option value="">{t('selectReason')}</option>
                        <option value="POINTS_EXCHANGE">{t('reasonPointsExchange')}</option>
                        <option value="COMPLAINT">{t('reasonComplaint')}</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary" type="submit">{t('generateCoupon')}</button>
                      <button className="btn" type="button" onClick={closeCouponDialog}>{t('cancel')}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {couponDialog === 'template' && (
              <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
                <div className="card modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-template-title">
                  <div className="modal-header">
                    <h2 id="coupon-template-title" style={{ margin: 0 }}>{t('createCouponTemplateTitle')}</h2>
                    <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                      <X size={16} />
                    </button>
                  </div>
                  {couponDialogError && <div className="error-msg" style={{ marginBottom: '1rem' }}>{couponDialogError}</div>}
                  <form onSubmit={handleCreateCouponTemplate}>
                    <div className="form-group"><label>{t('couponValue')}</label><input className="input" type="number" step="0.01" value={couponTemplateForm.couponValue} onChange={(e) => setCouponTemplateForm({ ...couponTemplateForm, couponValue: e.target.value })} required /></div>
                    <div className="form-group"><label>{t('minimumPurchaseValue')}</label><input className="input" type="number" step="0.01" value={couponTemplateForm.minimumPurchaseValue} onChange={(e) => setCouponTemplateForm({ ...couponTemplateForm, minimumPurchaseValue: e.target.value })} required /></div>
                    <div className="form-group"><label>{t('requiredPoints')}</label><input className="input" type="number" value={couponTemplateForm.requiredPoints} onChange={(e) => setCouponTemplateForm({ ...couponTemplateForm, requiredPoints: e.target.value })} required /></div>
                    <div className="form-group">
                      <label>{t('country')}</label>
                      <select className="input" value={couponTemplateForm.country} onChange={(e) => setCouponTemplateForm({ ...couponTemplateForm, country: e.target.value })} required>
                        <option value="">{t('selectCountry')}</option>
                        {availableCountries.map((countryCode) => (<option key={countryCode} value={countryCode}>{countryCode}</option>))}
                      </select>
                    </div>
                    <div className="form-group"><label>{t('validityDays')}</label><input className="input" type="number" value={couponTemplateForm.validityDays} onChange={(e) => setCouponTemplateForm({ ...couponTemplateForm, validityDays: e.target.value })} required /></div>
                    <div className="form-group">
                      <label>{t('couponPrefix')}</label>
                      <select className="input" value={couponTemplateForm.couponPrefix} onChange={(e) => setCouponTemplateForm({ ...couponTemplateForm, couponPrefix: e.target.value })} required>
                        <option value="">{t('selectPrefix')}</option>
                        {availableCouponPrefixes.map((prefix) => (<option key={prefix} value={prefix}>{prefix}</option>))}
                      </select>
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary" type="submit">{t('save')}</button>
                      <button className="btn" type="button" onClick={closeCouponDialog}>{t('cancel')}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {couponDialog === 'browse' && (
              <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
                <div className="card modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-browse-title">
                  <div className="modal-header">
                    <h2 id="coupon-browse-title" style={{ margin: 0 }}>{t('browseCouponsTitle')}</h2>
                    <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('searchByCode')}</label>
                      <input
                        className="input"
                        value={couponCodeSearch}
                        onChange={(e) => setCouponCodeSearch(e.target.value)}
                        placeholder={t('searchCodePlaceholder')}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('sortBy')}</label>
                      <select
                        className="input"
                        value={couponSortBy}
                        onChange={(e) => {
                          setCouponSortBy(e.target.value as 'reason' | 'country' | 'status');
                          setCouponSortValue('ALL');
                        }}
                      >
                        <option value="reason">{t('reason')}</option>
                        <option value="country">{t('country')}</option>
                        <option value="status">{t('status')}</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t('value')}</label>
                      <select className="input" value={couponSortValue} onChange={(e) => setCouponSortValue(e.target.value)}>
                        <option value="ALL">{t('all')}</option>
                        {couponSortValues.map((value) => (
                          <option key={value} value={value}>
                            {couponSortBy === 'reason' && (value === 'POINTS_EXCHANGE' || value === 'COMPLAINT')
                              ? reasonLabel(value)
                              : couponSortBy === 'status' && (value === 'ACTIVE' || value === 'USED' || value === 'EXPIRED')
                                ? statusLabel(value)
                              : value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredCoupons.length === 0 ? (
                    <p>{t('noCouponsForFilters')}</p>
                  ) : (
                    <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('code')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('customer')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('value')}</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('minPurchaseShort')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('reason')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('createdAt')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('expiresAt')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCoupons.map((coupon) => (
                            <tr key={coupon.id}>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.couponCode}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.customerName}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{coupon.country}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{coupon.couponValue}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{coupon.minimumPurchaseValue}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{reasonLabel(coupon.reason)}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{statusLabel(coupon.status)}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{new Date(coupon.issuedAt).toLocaleString()}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{new Date(coupon.expiresAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="form-actions">
                    <button className="btn" type="button" onClick={closeCouponDialog}>{t('close')}</button>
                  </div>
                </div>
              </div>
            )}

            {couponDialog === 'browse-templates' && (
              <div className="modal-overlay" onClick={closeCouponDialog} role="presentation">
                <div className="card modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="coupon-templates-browse-title">
                  <div className="modal-header">
                    <h2 id="coupon-templates-browse-title" style={{ margin: 0 }}>{t('browseCouponTemplatesTitle')}</h2>
                    <button className="btn icon-btn modal-close-btn" type="button" onClick={closeCouponDialog} aria-label={t('close')} title={t('close')}>
                      <X size={16} />
                    </button>
                  </div>
                  {couponTemplates.length === 0 ? (
                    <p>{t('noCouponTemplates')}</p>
                  ) : (
                    <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('couponPrefix')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('couponValue')}</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('minimumPurchaseValue')}</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('requiredPoints')}</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('validityDays')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {couponTemplates.map((template) => (
                            <tr key={template.id}>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{template.couponPrefix}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{template.country}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.couponValue}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.minimumPurchaseValue}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.requiredPoints}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{template.validityDays}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="form-actions">
                    <button className="btn" type="button" onClick={closeCouponDialog}>{t('close')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'store-promotions' && authRole === 'ADMIN' && (
          <div>
            <div className="grid coupon-actions-grid">
              <div
                className="card action-tile"
                style={{ textAlign: 'center' }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  resetPromotionForm();
                  setPromotionView('create');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    resetPromotionForm();
                    setPromotionView('create');
                  }
                }}
              >
                <h3>{t('promotionCreateTileTitle')}</h3>
                <p>{t('promotionCreateTileDesc')}</p>
              </div>
              <div
                className="card action-tile"
                style={{ textAlign: 'center' }}
                role="button"
                tabIndex={0}
                onClick={() => setPromotionView('browse')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPromotionView('browse');
                  }
                }}
              >
                <h3>{t('promotionBrowseTileTitle')}</h3>
                <p>{t('promotionBrowseTileDesc')}</p>
              </div>
            </div>

            {promotionView === 'create' && (
              <div
                className="modal-overlay"
                onClick={closePromotionModal}
                role="presentation"
              >
                <div
                  className="card modal-panel"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="promotion-create-title"
                >
                  <div className="modal-header">
                    <h2 id="promotion-create-title" style={{ margin: 0 }}>
                      {promotionForm.id === null ? t('promotionCreateTitle') : t('promotionEditTitle')}
                    </h2>
                    <button className="btn icon-btn modal-close-btn" type="button" onClick={closePromotionModal} aria-label={t('close')} title={t('close')}>
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleSavePromotion}>
                    <div className="form-group">
                      <label>{t('promotionName')}</label>
                      <input
                        className="input"
                        value={promotionForm.name}
                        onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('country')}</label>
                      <select
                        className="input"
                        value={promotionForm.country}
                        onChange={(e) => setPromotionForm({ ...promotionForm, country: e.target.value })}
                        required
                      >
                        <option value="">{t('selectCountry')}</option>
                        {availableCountries.map((countryCode) => (
                          <option key={countryCode} value={countryCode}>{countryCode}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('promotionPointsPerCurrency')}</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={promotionForm.pointsPerCurrency}
                        onChange={(e) => setPromotionForm({ ...promotionForm, pointsPerCurrency: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('promotionStartsAt')}</label>
                      <input
                        className="input"
                        type="datetime-local"
                        value={promotionForm.startsAt}
                        onChange={(e) => setPromotionForm({ ...promotionForm, startsAt: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('promotionEndsAt')}</label>
                      <input
                        className="input"
                        type="datetime-local"
                        value={promotionForm.endsAt}
                        onChange={(e) => setPromotionForm({ ...promotionForm, endsAt: e.target.value })}
                      />
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary" type="submit" disabled={promotionSaving}>
                        {promotionSaving ? t('loading') : t('save')}
                      </button>
                      <button
                        className="btn"
                        type="button"
                        onClick={closePromotionModal}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {promotionView === 'browse' && (
              <div className="modal-overlay" onClick={() => setPromotionView(null)} role="presentation">
                <div
                  className="card modal-panel"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="promotion-list-title"
                >
                  <div className="modal-header">
                    <h2 id="promotion-list-title" style={{ margin: 0 }}>{t('promotionListTitle')}</h2>
                    <button className="btn icon-btn modal-close-btn" type="button" onClick={() => setPromotionView(null)} aria-label={t('close')} title={t('close')}>
                      <X size={16} />
                    </button>
                  </div>
                  {storePromotions.length === 0 ? (
                    <p>{t('noPromotions')}</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionName')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('country')}</th>
                            <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionPointsPerCurrency')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionStartsAt')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('promotionEndsAt')}</th>
                            <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{t('status')}</th>
                            <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
                          </tr>
                        </thead>
                        <tbody>
                          {storePromotions.map((promotion) => (
                            <tr key={promotion.id}>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.name}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{promotion.country}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right' }}>{promotion.pointsPerCurrency}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{new Date(promotion.startsAt).toLocaleString()}</td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>
                                {promotion.endsAt ? new Date(promotion.endsAt).toLocaleString() : '-'}
                              </td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={promotion.enabled}
                                    onChange={(e) => {
                                      void handleTogglePromotionStatus(promotion, e.target.checked);
                                    }}
                                  />
                                  <span className="slider" />
                                </label>
                              </td>
                              <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                                <button
                                  className="btn icon-btn"
                                  type="button"
                                  onClick={() => handleEditPromotion(promotion)}
                                  title={t('edit')}
                                  aria-label={t('edit')}
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
                  <div className="form-actions">
                    <button className="btn" type="button" onClick={() => setPromotionView(null)}>
                      {t('close')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2>{t('toolsTitle')}</h2>
            <p>{t('toolsDescription')}</p>
            <form onSubmit={handleImportCustomers}>
              <div className="form-group">
                <label>{t('csvFile')}</label>
                <input className="input" type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} required />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={importing}>
                  {importing ? t('importing') : t('importCsv')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'technical-accounts' && authRole === 'ADMIN' && (
          <div className="card">
            <h2>{t('tabTechnicalAccounts')}</h2>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <h3 style={{ marginTop: 0 }}>{t('createTechnicalAccount')}</h3>
                <form onSubmit={handleCreateTechnicalUser}>
                  <div className="form-group">
                    <label>{t('login')}</label>
                    <input
                      className="input"
                      value={technicalUserForm.username}
                      onChange={(e) => setTechnicalUserForm({ ...technicalUserForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('password')}</label>
                    <input
                      className="input"
                      type="text"
                      value={technicalUserForm.password}
                      onChange={(e) => setTechnicalUserForm({ ...technicalUserForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('country')}</label>
                    <select
                      className="input"
                      value={technicalUserForm.country}
                      onChange={(e) => setTechnicalUserForm({ ...technicalUserForm, country: e.target.value })}
                      required
                    >
                      <option value="">{t('selectCountry')}</option>
                      {availableCountries.map((countryCode) => (
                        <option key={countryCode} value={countryCode}>{countryCode}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit" disabled={technicalUsersLoading}>
                      {t('save')}
                    </button>
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
                          <th style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {technicalUsers.map((user) => (
                          <tr key={user.id}>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{user.username}</td>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{user.country}</td>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={user.enabled}
                                  onChange={(e) => {
                                    void handleToggleTechnicalUser(user.id, e.target.checked);
                                  }}
                                />
                                <span className="slider" />
                              </label>
                            </td>
                            <td style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
                              <button
                                className="btn icon-btn"
                                type="button"
                                onClick={() => {
                                  setTechnicalPasswordModalUser(user);
                                  setTechnicalPasswordValue(user.passwordPreview);
                                  setTechnicalPasswordVisible(false);
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

            {technicalPasswordModalUser && (
              <div className="modal-overlay" onClick={closeTechnicalPasswordModal} role="presentation">
                <div
                  className="card modal-panel"
                  role="dialog"
                  aria-modal="true"
                  onClick={(e) => e.stopPropagation()}
                >
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
                      <input
                        className="input"
                        type={technicalPasswordVisible ? 'text' : 'password'}
                        value={technicalPasswordValue}
                        onChange={(e) => setTechnicalPasswordValue(e.target.value)}
                      />
                      <button
                        className="btn icon-btn"
                        type="button"
                        onClick={() => setTechnicalPasswordVisible((prev) => !prev)}
                        title={technicalPasswordVisible ? t('hidePassword') : t('showPassword')}
                        aria-label={technicalPasswordVisible ? t('hidePassword') : t('showPassword')}
                      >
                        {technicalPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => {
                        void handleUpdateTechnicalUserPassword(technicalPasswordModalUser.id, technicalPasswordValue);
                      }}
                    >
                      {t('save')}
                    </button>
                    <button className="btn" type="button" onClick={closeTechnicalPasswordModal}>
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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







