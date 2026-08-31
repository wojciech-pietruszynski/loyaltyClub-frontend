import { Suspense, lazy } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Alert } from 'antd';
import { BarChart3, Percent, PlusCircle, Ticket, Users, Wrench } from 'lucide-react';
import { useAppContext } from '../context/appContext';
import { AppHeader } from './AppHeader';
import { DEFAULT_ROUTE, routesForRole } from '../routes';
import type { Tab } from '../types/ui';

// Podział kodu na porcje ładowane wraz z trasą — możliwy dopiero od chwili,
// gdy widok wybiera router, a nie stan zakładki w orkiestratorze.
const CustomersSection = lazy(() => import('./CustomersSection').then((m) => ({ default: m.CustomersSection })));
const AddPointsSection = lazy(() => import('./AddPointsSection').then((m) => ({ default: m.AddPointsSection })));
const CouponsSection = lazy(() => import('./CouponsSection').then((m) => ({ default: m.CouponsSection })));
const PromotionsPage = lazy(() => import('./PromotionsPage').then((m) => ({ default: m.PromotionsPage })));
const ReportsAuditSection = lazy(() => import('./ReportsAuditSection').then((m) => ({ default: m.ReportsAuditSection })));
const ToolsSection = lazy(() => import('./ToolsSection').then((m) => ({ default: m.ToolsSection })));

const SECTION_BY_TAB: Record<Tab, React.ComponentType> = {
  customers: CustomersSection,
  'add-points': AddPointsSection,
  coupons: CouponsSection,
  promotions: PromotionsPage,
  reports: ReportsAuditSection,
  tools: ToolsSection,
};

const ICON_BY_TAB: Record<Tab, React.ReactNode> = {
  customers: <Users size={16} />,
  'add-points': <PlusCircle size={16} />,
  coupons: <Ticket size={16} />,
  promotions: <Percent size={16} />,
  reports: <BarChart3 size={16} />,
  tools: <Wrench size={16} />,
};

type AppShellProps = {
  appLogo: string;
};

export function AppShell({ appLogo }: AppShellProps) {
  const { t, session, data } = useAppContext();
  const routes = routesForRole(session.role);

  const loading = data.customers.loading
    || data.coupons.loading
    || data.promotions.loading
    || data.technicalUsers.loading;

  return (
    <div className="container">
      <AppHeader appLogo={appLogo} loading={loading} />

      <div className="app-body">
        <nav className="sidebar" aria-label={t('mainNavigation')}>
          {routes.map((route) => (
            <NavLink
              key={route.tab}
              to={route.path}
              className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}
            >
              {ICON_BY_TAB[route.tab]}
              {t(route.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="content">
          <Suspense fallback={<p>{t('loading')}</p>}>
            <Routes>
              <Route path="/" element={<Navigate to={DEFAULT_ROUTE} replace />} />
              {routes.map((route) => {
                const Section = SECTION_BY_TAB[route.tab];
                return <Route key={route.tab} path={route.path} element={<Section />} />;
              })}
              <Route
                path="*"
                element={(
                  <div className="card">
                    <h2 style={{ marginTop: 0 }}>{t('notFoundTitle')}</h2>
                    <p>{t('notFoundDescription')}</p>
                    <NavLink className="btn btn-primary" to={DEFAULT_ROUTE}>{t('backToCustomers')}</NavLink>
                  </div>
                )}
              />
            </Routes>
          </Suspense>
        </div>
      </div>

      {data.customers.error && (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message={data.customers.error} />
      )}
    </div>
  );
}
