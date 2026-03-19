import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppHeader } from './AppHeader';
import type { Language } from '../i18n';

describe('AppHeader Component', () => {
  const mockProps = {
    appLogo: 'logo.png',
    loading: false,
    expiresAt: Date.now() + 15 * 60 * 1000,
    language: 'en' as Language,
    setLanguage: vi.fn(),
    languageOptions: [
      { value: 'en' as Language, short: 'EN' },
      { value: 'pl' as Language, short: 'PL' }
    ],
    theme: 'light' as const,
    setTheme: vi.fn(),
    handleLogout: vi.fn(),
    t: (key: string) => key, // Mock translator
  };

  it('renders logo and session countdown', () => {
    render(<AppHeader {...mockProps} />);
    expect(screen.getByAltText('appTitle')).toBeInTheDocument();
    // countdown shows m:ss format
    expect(screen.getByText(/^\d+:\d{2}$/)).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    const { container } = render(<AppHeader {...mockProps} loading={true} />);
    // Ant Design Spin usually has ant-spin class
    expect(container.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('calls handleLogout when logout button is clicked', () => {
    render(<AppHeader {...mockProps} />);
    const logoutBtn = screen.getByText('logout');
    fireEvent.click(logoutBtn);
    expect(mockProps.handleLogout).toHaveBeenCalled();
  });

  it('calls setTheme when theme button is clicked', () => {
    render(<AppHeader {...mockProps} />);
    const themeBtn = screen.getByText('darkMode');
    fireEvent.click(themeBtn);
    expect(mockProps.setTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setLanguage when language is changed', () => {
    render(<AppHeader {...mockProps} />);
    // Segmented options are buttons with role "radio" or just labels/divs depending on antd version.
    // In AntD 5 it uses standard radio/button structure.
    const plOption = screen.getByText('PL');
    fireEvent.click(plOption);
    expect(mockProps.setLanguage).toHaveBeenCalledWith('pl');
  });
});
