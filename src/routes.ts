import type { AuthRole } from './api/client';
import type { Tab } from './types/ui';
import type { TranslationKey } from './i18n';

/**
 * Mapa zakładek na trasy.
 *
 * Nawigację realizował wcześniej stan `activeTab` w orkiestratorze, co dawało
 * cztery wymierne skutki: brak odnośnika do konkretnego widoku, niedziałający
 * przycisk cofania, powrót do widoku domyślnego po odświeżeniu strony i brak
 * możliwości podziału kodu na porcje ładowane wraz z trasą. Adres jest teraz
 * źródłem prawdy o aktywnym widoku.
 */
export type RouteDefinition = {
  tab: Tab;
  path: string;
  labelKey: TranslationKey;
  /** `null` = widok dostępny dla każdej zalogowanej roli. */
  roles: AuthRole[] | null;
};

export const ROUTES: RouteDefinition[] = [
  { tab: 'customers', path: '/customers', labelKey: 'tabCustomers', roles: null },
  { tab: 'add-points', path: '/add-points', labelKey: 'tabAddPoints', roles: ['ADMIN'] },
  { tab: 'coupons', path: '/coupons', labelKey: 'tabCoupons', roles: null },
  { tab: 'promotions', path: '/promotions', labelKey: 'tabPromotions', roles: ['ADMIN', 'TECHNICAL'] },
  { tab: 'reports', path: '/reports', labelKey: 'tabReports', roles: ['ADMIN', 'TECHNICAL'] },
  { tab: 'tools', path: '/tools', labelKey: 'tabAdminTools', roles: null },
];

export const DEFAULT_ROUTE = '/customers';

export function isRouteAllowed(route: RouteDefinition, role: AuthRole | null): boolean {
  return route.roles === null || (role !== null && route.roles.includes(role));
}

export function routesForRole(role: AuthRole | null): RouteDefinition[] {
  return ROUTES.filter((route) => isRouteAllowed(route, role));
}
