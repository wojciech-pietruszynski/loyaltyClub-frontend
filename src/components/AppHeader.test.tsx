import { screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppHeader } from './AppHeader';
import { renderWithApp } from '../test/harness';

describe('AppHeader', () => {
  it('renders the logo and the session countdown', () => {
    renderWithApp(<AppHeader appLogo="logo.png" loading={false} />);
    expect(screen.getByAltText('appTitle')).toBeInTheDocument();
    expect(screen.getByText(/^\d+:\d{2}$/)).toBeInTheDocument();
  });

  it('shows the country scope taken from the session', () => {
    renderWithApp(<AppHeader appLogo="logo.png" loading={false} />, {
      session: { role: 'TECHNICAL', isAdmin: false, country: 'DE' },
    });
    const scopePill = screen.getByText('countryScope').closest('.session-pill');
    expect(scopePill).not.toBeNull();
    expect(within(scopePill as HTMLElement).getByText('DE')).toBeInTheDocument();
  });

  it('shows "all countries" when the session has no country', () => {
    renderWithApp(<AppHeader appLogo="logo.png" loading={false} />);
    expect(screen.getByText('countryScopeGlobal')).toBeInTheDocument();
  });

  it('shows the spinner while data is loading', () => {
    const { container } = renderWithApp(<AppHeader appLogo="logo.png" loading />);
    expect(container.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('logs out on the logout button', () => {
    const logout = vi.fn();
    renderWithApp(<AppHeader appLogo="logo.png" loading={false} />, { session: { logout } });
    fireEvent.click(screen.getByText('logout'));
    expect(logout).toHaveBeenCalled();
  });

  it('switches the theme', () => {
    const { context } = renderWithApp(<AppHeader appLogo="logo.png" loading={false} />);
    fireEvent.click(screen.getByText('darkMode'));
    expect(context.setTheme).toHaveBeenCalledWith('dark');
  });

  it('switches the language', () => {
    const { context } = renderWithApp(<AppHeader appLogo="logo.png" loading={false} />);
    fireEvent.click(screen.getByText('EN'));
    expect(context.setLanguage).toHaveBeenCalledWith('en');
  });
});
