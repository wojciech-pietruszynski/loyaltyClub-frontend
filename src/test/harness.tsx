import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppContext, type AppContextValue } from '../context/appContext';
import { createFormatters } from '../i18n';
import type { CouponsApi } from '../hooks/useCoupons';
import type { CustomersApi } from '../hooks/useCustomers';
import type { HierarchyPromotionsApi } from '../hooks/useHierarchyPromotions';
import type { PromotionsApi } from '../hooks/usePromotions';
import type { ReportsApi } from '../hooks/useReports';
import type { TechnicalUsersApi } from '../hooks/useTechnicalUsers';

const noop = () => {};
const asyncVoid = () => Promise.resolve();
const asyncTrue = () => Promise.resolve(true);

function customersApi(): CustomersApi {
  return {
    customers: [],
    loading: false,
    error: null,
    fetchCustomers: vi.fn(asyncVoid),
    ensureCustomers: vi.fn(asyncVoid),
    addCustomer: vi.fn(asyncTrue),
    addPoints: vi.fn(asyncTrue),
    updateCustomer: vi.fn(asyncTrue),
    fetchTransactions: vi.fn(() => Promise.resolve([])),
    fetchCoupons: vi.fn(() => Promise.resolve([])),
    fetchPurchaseHistory: vi.fn(() => Promise.resolve({ points: [], maxTotal: 0 })),
    importCustomers: vi.fn(() => Promise.resolve(0)),
    setCustomers: vi.fn(noop),
    setError: vi.fn(noop),
  };
}

function couponsApi(): CouponsApi {
  return {
    coupons: [],
    couponTemplates: [],
    loading: false,
    error: null,
    fetchCoupons: vi.fn(asyncVoid),
    ensureCoupons: vi.fn(asyncVoid),
    fetchTemplates: vi.fn(asyncVoid),
    ensureTemplates: vi.fn(asyncVoid),
    issueCoupon: vi.fn(asyncTrue),
    createTemplate: vi.fn(asyncTrue),
    setCoupons: vi.fn(noop),
    setCouponTemplates: vi.fn(noop),
    setError: vi.fn(noop),
  };
}

function promotionsApi(): PromotionsApi {
  return {
    storePromotions: [],
    availableCountries: ['PL', 'DE'],
    availableCouponPrefixes: ['KUPPL'],
    loading: false,
    error: null,
    fetchPromotions: vi.fn(asyncVoid),
    ensurePromotions: vi.fn(asyncVoid),
    fetchMetadata: vi.fn(asyncVoid),
    ensureMetadata: vi.fn(asyncVoid),
    savePromotion: vi.fn(asyncTrue),
    togglePromotion: vi.fn(asyncTrue),
    setError: vi.fn(noop),
  };
}

function hierarchyPromotionsApi(): HierarchyPromotionsApi {
  return {
    hierarchyPromotions: [],
    loading: false,
    error: null,
    fetchHierarchyPromotions: vi.fn(asyncVoid),
    ensureHierarchyPromotions: vi.fn(asyncVoid),
    saveHierarchyPromotion: vi.fn(asyncTrue),
    toggleHierarchyPromotion: vi.fn(asyncTrue),
    setError: vi.fn(noop),
  };
}

function technicalUsersApi(): TechnicalUsersApi {
  return {
    technicalUsers: [],
    loading: false,
    error: null,
    fetchTechnicalUsers: vi.fn(asyncVoid),
    ensureTechnicalUsers: vi.fn(asyncVoid),
    createTechnicalUser: vi.fn(asyncTrue),
    toggleTechnicalUser: vi.fn(asyncTrue),
    updatePassword: vi.fn(asyncTrue),
    setError: vi.fn(noop),
  };
}

function reportsApi(): ReportsApi {
  return {
    summary: null,
    auditLogs: [],
    loading: false,
    exporting: false,
    error: null,
    fetchSummary: vi.fn(asyncVoid),
    fetchAuditLogs: vi.fn(asyncVoid),
    exportCsv: vi.fn(asyncTrue),
    setError: vi.fn(noop),
  };
}

export type ContextOverrides = {
  customers?: Partial<CustomersApi>;
  coupons?: Partial<CouponsApi>;
  promotions?: Partial<PromotionsApi>;
  hierarchyPromotions?: Partial<HierarchyPromotionsApi>;
  technicalUsers?: Partial<TechnicalUsersApi>;
  reports?: Partial<ReportsApi>;
  session?: Partial<AppContextValue['session']>;
  config?: Partial<AppContextValue['config']>;
  notifySuccess?: AppContextValue['notifySuccess'];
  notifyError?: AppContextValue['notifyError'];
};

/**
 * Buduje wartość kontekstu na potrzeby testów.
 *
 * `t` zwraca sam klucz, a `tPlural` klucz z liczbą — testy sprawdzają wtedy,
 * *który* komunikat trafia na ekran, nie jego brzmienie w danym języku.
 */
export function createTestContext(overrides: ContextOverrides = {}): AppContextValue {
  return {
    language: 'pl',
    setLanguage: vi.fn(noop),
    theme: 'light',
    setTheme: vi.fn(noop),
    t: (key) => key,
    tPlural: (key, count) => `${key}:${count}`,
    format: createFormatters('pl'),
    reasonLabel: (reason) => reason,
    statusLabel: (status) => status,
    session: {
      role: 'ADMIN',
      country: null,
      isAdmin: true,
      expiresAt: Date.now() + 15 * 60 * 1000,
      logout: vi.fn(noop),
      ...overrides.session,
    },
    config: {
      countries: ['PL', 'DE'],
      couponPrefixes: ['KUPPL'],
      ...overrides.config,
    },
    data: {
      customers: { ...customersApi(), ...overrides.customers },
      coupons: { ...couponsApi(), ...overrides.coupons },
      promotions: { ...promotionsApi(), ...overrides.promotions },
      hierarchyPromotions: { ...hierarchyPromotionsApi(), ...overrides.hierarchyPromotions },
      technicalUsers: { ...technicalUsersApi(), ...overrides.technicalUsers },
      reports: { ...reportsApi(), ...overrides.reports },
    },
    notifySuccess: overrides.notifySuccess ?? vi.fn(noop),
    notifyError: overrides.notifyError ?? vi.fn(noop),
  };
}

/** Renderuje komponent w kontekście aplikacji i w routerze pamięciowym. */
export function renderWithApp(
  ui: ReactElement,
  overrides: ContextOverrides = {},
): RenderResult & { context: AppContextValue } {
  const context = createTestContext(overrides);
  const result = render(
    <MemoryRouter>
      <AppContext.Provider value={context}>{ui}</AppContext.Provider>
    </MemoryRouter>,
  );
  return { ...result, context };
}
