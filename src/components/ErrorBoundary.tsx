import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Translator } from '../types/ui';

type ErrorBoundaryProps = {
  t: Translator;
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Granica błędów renderowania.
 *
 * Bez niej wyjątek rzucony w dowolnym komponencie wygaszał całe drzewo Reacta
 * i użytkownik dostawał biały ekran bez komunikatu. To jedyny komponent klasowy
 * w projekcie — React nie udostępnia odpowiednika `componentDidCatch`
 * w komponentach funkcyjnych.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Nieobsłużony błąd renderowania:', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    const { t, children } = this.props;

    if (!error) {
      return children;
    }

    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '640px', margin: '3rem auto' }} role="alert">
          <h2 style={{ marginTop: 0 }}>{t('errorBoundaryTitle')}</h2>
          <p>{t('errorBoundaryDescription')}</p>
          <details style={{ marginBottom: '1rem' }}>
            <summary>{t('errorBoundaryDetails')}</summary>
            <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{error.message}</pre>
          </details>
          <div className="form-actions">
            <button className="btn btn-primary" type="button" onClick={this.handleRetry}>
              {t('errorBoundaryRetry')}
            </button>
            <button className="btn" type="button" onClick={this.handleReload}>
              {t('errorBoundaryReload')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
