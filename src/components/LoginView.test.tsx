import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginView } from './LoginView';

describe('LoginView Component', () => {
  const mockProps = {
    theme: 'light' as const,
    appLogo: 'logo.png',
    appVersion: '1.0.0',
    username: 'admin',
    password: 'password',
    setUsername: vi.fn(),
    setPassword: vi.fn(),
    handleLogin: vi.fn(async (e) => e.preventDefault()),
    authError: null,
    t: (key: string) => key,
  };

  it('renders login form and copyright', () => {
    render(<LoginView {...mockProps} />);
    expect(screen.getByText('loginTitle')).toBeInTheDocument();
    expect(screen.getByText('signIn')).toBeInTheDocument();
    expect(screen.getByText('Copyright: Wojciech Pietruszyński')).toBeInTheDocument();
  });

  it('calls setUsername and setPassword on input change', () => {
    render(<LoginView {...mockProps} />);
    // Input for username
    const usernameInput = screen.getByDisplayValue('admin');
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    expect(mockProps.setUsername).toHaveBeenCalledWith('newuser');

    // Input for password
    const passwordInput = screen.getByDisplayValue('password');
    fireEvent.change(passwordInput, { target: { value: 'newpass' } });
    expect(mockProps.setPassword).toHaveBeenCalledWith('newpass');
  });

  it('calls handleLogin on form submit', () => {
    render(<LoginView {...mockProps} />);
    const submitBtn = screen.getByText('signIn');
    fireEvent.click(submitBtn);
    expect(mockProps.handleLogin).toHaveBeenCalled();
  });

  it('shows error alert when authError is present', () => {
    render(<LoginView {...mockProps} authError="Invalid credentials" />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
