import { describe, it, expect } from 'vitest';
import { DEFAULT_ROUTE, ROUTES, isRouteAllowed, routesForRole } from './routes';

describe('trasy panelu', () => {
  it('gives every tab its own address', () => {
    const paths = ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain(DEFAULT_ROUTE);
  });

  it('gives an administrator every tab', () => {
    expect(routesForRole('ADMIN')).toHaveLength(ROUTES.length);
  });

  it('hides the point-adding tab from a technical account', () => {
    const tabs = routesForRole('TECHNICAL').map((route) => route.tab);
    expect(tabs).not.toContain('add-points');
    expect(tabs).toContain('coupons');
    expect(tabs).toContain('reports');
  });

  it('leaves only the tabs open to everyone when there is no role', () => {
    const tabs = routesForRole(null).map((route) => route.tab);
    expect(tabs).toEqual(['customers', 'coupons', 'tools']);
  });

  it('checks a single route against a role', () => {
    const addPoints = ROUTES.find((route) => route.tab === 'add-points');
    expect(addPoints).toBeDefined();
    expect(isRouteAllowed(addPoints!, 'ADMIN')).toBe(true);
    expect(isRouteAllowed(addPoints!, 'TECHNICAL')).toBe(false);
  });
});
