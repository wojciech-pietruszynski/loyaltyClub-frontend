import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Trzy wymagania WCAG 2.1 dla okien modalnych, których brakowało:
 *
 * 1. przechwycenie fokusu wewnątrz okna (2.4.3 Focus Order) — tabulator nie
 *    wyprowadza już na treść zasłoniętą nakładką,
 * 2. zamknięcie klawiszem Escape (2.1.2 No Keyboard Trap),
 * 3. przywrócenie fokusu do elementu, który okno otworzył (2.4.3).
 *
 * Zwraca `ref`, który należy podpiąć do panelu okna dialogowego.
 */
export function useModalA11y<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const panelRef = useRef<T | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Zapamiętaj element wywołujący i oddaj mu fokus po zamknięciu.
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const trigger = triggerRef.current;

    return () => {
      if (trigger && document.contains(trigger)) {
        trigger.focus();
      }
    };
  }, [isOpen]);

  // Ustaw fokus na pierwszym elemencie interaktywnym okna.
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusable[0];
    if (first) {
      first.focus();
    } else {
      panel.setAttribute('tabindex', '-1');
      panel.focus();
    }
  }, [isOpen]);

  // Escape zamyka okno, Tab krąży wewnątrz niego.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (active instanceof HTMLElement && !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  return panelRef;
}
