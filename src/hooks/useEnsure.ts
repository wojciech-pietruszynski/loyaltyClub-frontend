import { useCallback, useRef } from 'react';

/**
 * Owija funkcję pobierającą tak, aby wykonała się co najwyżej raz na sesję.
 *
 * Orkiestrator pobierał wcześniej komplet danych sześcioma (dla roli ADMIN —
 * siedmioma) równoległymi żądaniami zaraz po zalogowaniu, niezależnie od
 * aktywnej zakładki. Teraz każda sekcja woła `ensure...` przy wejściu na swoją
 * trasę, a dane raz pobrane nie są pobierane ponownie przy powrocie.
 */
export function useEnsure(fetcher: () => Promise<void>): () => Promise<void> {
  const startedRef = useRef(false);

  return useCallback(async () => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    await fetcher();
  }, [fetcher]);
}
