import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { AuthRole } from '../api/client';
import { createFormatters, translate, translatePlural, type Language, type PluralTranslationKey, type TranslationKey } from '../i18n';
import { useCoupons } from '../hooks/useCoupons';
import { useCustomers } from '../hooks/useCustomers';
import { useHierarchyPromotions } from '../hooks/useHierarchyPromotions';
import { usePromotions } from '../hooks/usePromotions';
import { useReports } from '../hooks/useReports';
import { useTechnicalUsers } from '../hooks/useTechnicalUsers';
import type { Coupon } from '../types';
import type { Theme } from '../types/ui';
import { AppContext, type AppContextValue } from './appContext';

const NOTIFICATION_TIMEOUT_MS = 3_000;

export type Notification = { type: 'success' | 'error'; message: string } | null;

type AppProviderProps = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  session: {
    role: AuthRole | null;
    country: string | null;
    expiresAt: number;
    logout: () => void;
  };
  onNotification: (notification: Notification) => void;
  children: ReactNode;
};

/**
 * Tworzy hooki dziedzinowe i udostępnia je razem z rzeczami przekrojowymi
 * (tłumaczenia, formatowanie, sesja, konfiguracja, powiadomienia) przez
 * kontekst — zamiast przekazywać wszystko w dół drzewa jako właściwości.
 */
export function AppProvider({ language, setLanguage, theme, setTheme, session, onNotification, children }: AppProviderProps) {
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params),
    [language],
  );
  const tPlural = useCallback(
    (key: PluralTranslationKey, count: number, params?: Record<string, string | number>) => translatePlural(language, key, count, params),
    [language],
  );
  const format = useMemo(() => createFormatters(language), [language]);

  const customers = useCustomers(t);
  const coupons = useCoupons(t);
  const promotions = usePromotions(t);
  const hierarchyPromotions = useHierarchyPromotions(t);
  const technicalUsers = useTechnicalUsers(t);
  const reports = useReports(t);

  const { ensureMetadata } = promotions;

  // Jedyne dane pobierane od razu po zalogowaniu: słowniki krajów i prefiksów,
  // z których korzysta większość formularzy. Kolekcje dziedzinowe pobierają
  // sekcje przy wejściu na swoją trasę.
  useEffect(() => {
    void ensureMetadata();
  }, [ensureMetadata]);

  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((notification: Notification) => {
    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
    }
    onNotification(notification);
    if (notification) {
      notificationTimer.current = setTimeout(() => onNotification(null), NOTIFICATION_TIMEOUT_MS);
    }
  }, [onNotification]);

  useEffect(() => () => {
    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
    }
  }, []);

  const notifySuccess = useCallback((message: string) => notify({ type: 'success', message }), [notify]);
  const notifyError = useCallback((message: string) => notify({ type: 'error', message }), [notify]);

  const reasonLabel = useCallback(
    (reason: Coupon['reason']) => t(reason === 'POINTS_EXCHANGE' ? 'reasonPointsExchange' : 'reasonComplaint'),
    [t],
  );
  const statusLabel = useCallback(
    (status: Coupon['status']) => t(status === 'ACTIVE' ? 'active' : status === 'USED' ? 'used' : 'expired'),
    [t],
  );

  const value = useMemo<AppContextValue>(() => ({
    language,
    setLanguage,
    theme,
    setTheme,
    t,
    tPlural,
    format,
    reasonLabel,
    statusLabel,
    session: {
      role: session.role,
      country: session.country,
      isAdmin: session.role === 'ADMIN',
      expiresAt: session.expiresAt,
      logout: session.logout,
    },
    config: {
      countries: promotions.availableCountries,
      couponPrefixes: promotions.availableCouponPrefixes,
    },
    data: { customers, coupons, promotions, hierarchyPromotions, technicalUsers, reports },
    notifySuccess,
    notifyError,
  }), [
    language, setLanguage, theme, setTheme, t, tPlural, format, reasonLabel, statusLabel,
    session.role, session.country, session.expiresAt, session.logout,
    customers, coupons, promotions, hierarchyPromotions, technicalUsers, reports,
    notifySuccess, notifyError,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
