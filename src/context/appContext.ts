import { createContext, useContext } from 'react';
import type { AuthRole } from '../api/client';
import type { Formatters, Language, PluralTranslationKey } from '../i18n';
import type { CouponsApi } from '../hooks/useCoupons';
import type { CustomersApi } from '../hooks/useCustomers';
import type { HierarchyPromotionsApi } from '../hooks/useHierarchyPromotions';
import type { PromotionsApi } from '../hooks/usePromotions';
import type { ReportsApi } from '../hooks/useReports';
import type { TechnicalUsersApi } from '../hooks/useTechnicalUsers';
import type { Coupon } from '../types';
import type { Theme, Translator } from '../types/ui';

/**
 * Warstwa pośrednicząca między hookami a komponentami.
 *
 * Wcześniej wszystkie dane i wszystkie funkcje pomocnicze schodziły w dół
 * drzewa jako właściwości — do dwóch komponentów trafiały po 22 właściwości,
 * a orkiestrator trzymał 34 stany. Rzeczy przekrojowe (tłumaczenia,
 * formatowanie, sesja, konfiguracja, powiadomienia) i hooki dziedzinowe
 * komponenty pobierają teraz z kontekstu, a stan formularzy trzymają lokalnie.
 */
export type AppContextValue = {
  // Ustawienia interfejsu
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Tłumaczenia i formatowanie zależne od języka
  t: Translator;
  tPlural: (key: PluralTranslationKey, count: number, params?: Record<string, string | number>) => string;
  format: Formatters;
  reasonLabel: (reason: Coupon['reason']) => string;
  statusLabel: (status: Coupon['status']) => string;

  // Sesja
  session: {
    role: AuthRole | null;
    country: string | null;
    isAdmin: boolean;
    expiresAt: number;
    logout: () => void;
  };

  // Dane konfiguracyjne backendu
  config: {
    countries: string[];
    couponPrefixes: string[];
  };

  // Hooki dziedzinowe
  data: {
    customers: CustomersApi;
    coupons: CouponsApi;
    promotions: PromotionsApi;
    hierarchyPromotions: HierarchyPromotionsApi;
    technicalUsers: TechnicalUsersApi;
    reports: ReportsApi;
  };

  // Powiadomienia globalne
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useAppContext musi być wywołany wewnątrz <AppProvider>');
  }
  return value;
}
