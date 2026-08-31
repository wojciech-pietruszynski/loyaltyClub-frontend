import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/appContext';
import { useModalA11y } from '../hooks/useModalA11y';

type ModalShellProps = {
  titleId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  error?: string | null;
  maxWidth?: string;
  children: ReactNode;
};

/**
 * Wspólna powłoka okna dialogowego.
 *
 * Nakładka, panel, nagłówek i przycisk zamknięcia były powielone w dziesięciu
 * miejscach, a żadna kopia nie spełniała wymagań WCAG dla okien modalnych.
 * Zachowania dostępności (przechwycenie fokusu, klawisz Escape, przywrócenie
 * fokusu) dokłada hook `useModalA11y`.
 */
export function ModalShell({ titleId, title, subtitle, onClose, error, maxWidth, children }: ModalShellProps) {
  const { t } = useAppContext();
  const panelRef = useModalA11y<HTMLDivElement>(true, onClose);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className="card modal-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="modal-header">
          <div>
            <h2 id={titleId} style={{ margin: 0 }}>{title}</h2>
            {subtitle && <div style={{ color: 'var(--text-light)' }}>{subtitle}</div>}
          </div>
          <button
            className="btn icon-btn modal-close-btn"
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            title={t('close')}
          >
            <X size={16} />
          </button>
        </div>
        {error && <div className="error-msg" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
        {children}
      </div>
    </div>
  );
}
