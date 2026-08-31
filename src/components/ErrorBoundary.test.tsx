import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import type { TranslationKey } from '../i18n';

const t = (key: TranslationKey) => key;

function Exploding({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Wybuch w renderze');
  }
  return <p>zawartość</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React loguje przechwycony błąd — wyciszamy, żeby nie zaśmiecać wyniku testów.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children while nothing throws', () => {
    render(<ErrorBoundary t={t}><Exploding shouldThrow={false} /></ErrorBoundary>);
    expect(screen.getByText('zawartość')).toBeInTheDocument();
  });

  it('shows a message instead of a blank screen when rendering throws', () => {
    render(<ErrorBoundary t={t}><Exploding shouldThrow /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('errorBoundaryTitle')).toBeInTheDocument();
    expect(screen.getByText('Wybuch w renderze')).toBeInTheDocument();
  });

  it('lets the user retry the render', () => {
    const { rerender } = render(<ErrorBoundary t={t}><Exploding shouldThrow /></ErrorBoundary>);
    expect(screen.getByText('errorBoundaryTitle')).toBeInTheDocument();

    rerender(<ErrorBoundary t={t}><Exploding shouldThrow={false} /></ErrorBoundary>);
    fireEvent.click(screen.getByText('errorBoundaryRetry'));

    expect(screen.getByText('zawartość')).toBeInTheDocument();
  });
});
