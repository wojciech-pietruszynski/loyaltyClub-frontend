import { useCallback, useEffect, useRef } from 'react';
import { extractApiError } from '../api/errors';
import { ResponseShapeError } from '../api/schema';
import type { TranslationKey } from '../i18n';
import type { Translator } from '../types/ui';

export type ApiErrorMessage = (err: unknown, fallbackKey: TranslationKey) => string;

/**
 * Zwraca stabilną funkcję tłumaczącą wyjątek na komunikat dla użytkownika.
 *
 * Wszystkie hooki domenowe używają jej zamiast powielonego wyrażenia
 * `err.response?.data?.detail` i zamiast stałych tekstów po angielsku —
 * tekst zapasowy jest kluczem słownika, więc podlega tłumaczeniu.
 *
 * Identyczność funkcji nie zmienia się przy zmianie języka (translator trzymany
 * w referencji), dzięki czemu `useCallback` w hookach nie unieważnia się
 * i nie wywołuje ponownego pobrania danych po przełączeniu języka.
 */
export function useApiErrorMessage(t: Translator): ApiErrorMessage {
  const translatorRef = useRef(t);

  useEffect(() => {
    translatorRef.current = t;
  }, [t]);

  return useCallback((err: unknown, fallbackKey: TranslationKey) => {
    if (err instanceof ResponseShapeError) {
      return translatorRef.current('invalidServerResponse');
    }
    return extractApiError(err, translatorRef.current(fallbackKey));
  }, []);
}
