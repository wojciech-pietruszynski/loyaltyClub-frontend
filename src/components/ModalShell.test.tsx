import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModalShell } from './ModalShell';
import { renderWithApp } from '../test/harness';

function renderModal(onClose = vi.fn()) {
  const result = renderWithApp(
    <>
      <button type="button">poza oknem</button>
      <ModalShell titleId="test-title" title="Tytuł okna" onClose={onClose}>
        <button type="button">pierwszy</button>
        <button type="button">ostatni</button>
      </ModalShell>
    </>,
  );
  return { ...result, onClose };
}

describe('ModalShell — dostępność okna dialogowego', () => {
  it('marks the panel as a modal dialog with an accessible name', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'test-title');
  });

  it('moves focus into the dialog when it opens', () => {
    renderModal();
    // Pierwszy element interaktywny okna to przycisk zamknięcia w nagłówku.
    expect(document.activeElement).toBe(screen.getByLabelText('close'));
  });

  it('closes on the Escape key', () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps Tab inside the dialog', () => {
    renderModal();
    const last = screen.getByText('ostatni');
    last.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(screen.getByLabelText('close'));
  });

  it('wraps backwards from the first element to the last one', () => {
    renderModal();
    const first = screen.getByLabelText('close');
    first.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('ostatni'));
  });

  it('returns focus to the element that opened the dialog', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'otwierający';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = renderModal();
    unmount();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('closes on the close button', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByLabelText('close'));
    expect(onClose).toHaveBeenCalled();
  });
});
