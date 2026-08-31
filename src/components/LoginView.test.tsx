import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginView } from './LoginView';
import type { TranslationKey } from '../i18n';

const baseProps = {
  theme: 'light' as const,
  appLogo: 'logo.png',
  appVersion: '1.2.0',
  authError: null,
  t: (key: TranslationKey) => key,
};

describe('LoginView', () => {
  it('renders the login form and the copyright', () => {
    render(<LoginView {...baseProps} onLogin={vi.fn()} />);
    expect(screen.getByText('loginTitle')).toBeInTheDocument();
    expect(screen.getByLabelText('login')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
    expect(screen.getByText(/Wojciech Pietruszyński/)).toBeInTheDocument();
  });

  it('shows the application version', () => {
    render(<LoginView {...baseProps} onLogin={vi.fn()} />);
    expect(screen.getByText(/1\.2\.0/)).toBeInTheDocument();
  });

  it('shows the authentication error', () => {
    render(<LoginView {...baseProps} authError="invalidCredentials" onLogin={vi.fn()} />);
    expect(screen.getByText('invalidCredentials')).toBeInTheDocument();
  });

  it('passes the typed credentials to the login handler', async () => {
    const onLogin = vi.fn(() => Promise.resolve());
    render(<LoginView {...baseProps} onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText('login'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'tajne123' } });
    fireEvent.click(screen.getByRole('button', { name: 'signIn' }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('admin', 'tajne123'));
  });

  it('clears the password field after an attempt', async () => {
    render(<LoginView {...baseProps} onLogin={vi.fn(() => Promise.resolve())} />);

    fireEvent.change(screen.getByLabelText('login'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'tajne123' } });
    fireEvent.click(screen.getByRole('button', { name: 'signIn' }));

    await waitFor(() => expect(screen.getByLabelText('password')).toHaveValue(''));
  });
});
