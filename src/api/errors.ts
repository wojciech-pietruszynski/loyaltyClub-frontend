/**
 * Jedno miejsce, w którym odczytujemy komunikat błędu z odpowiedzi backendu.
 *
 * Backend zwraca RFC 7807 ProblemDetail — interesujące pole to `detail`.
 * Wcześniej wyrażenie `err.response?.data?.detail` było powielone w każdym
 * hooku (a dwa hooki pomijały je zupełnie i wstawiały stały tekst po
 * angielsku). Teraz wszystkie hooki wołają `extractApiError`.
 */

type ProblemDetailBody = {
  detail?: unknown;
  title?: unknown;
  error?: unknown;
  message?: unknown;
};

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return null;
}

function readResponseBody(err: unknown): ProblemDetailBody | null {
  if (!err || typeof err !== 'object' || !('response' in err)) {
    return null;
  }
  const response = (err as { response?: unknown }).response;
  if (!response || typeof response !== 'object' || !('data' in response)) {
    return null;
  }
  const data = (response as { data?: unknown }).data;
  return data && typeof data === 'object' ? (data as ProblemDetailBody) : null;
}

/**
 * Zwraca komunikat do pokazania użytkownikowi.
 *
 * @param err       obiekt złapany w bloku `catch` (typ `unknown`, nie `any`)
 * @param fallback  tekst zapasowy — zawsze przekazuj wynik `t(...)`,
 *                  żeby komunikat był objęty mechanizmem tłumaczeń
 */
export function extractApiError(err: unknown, fallback: string): string {
  const body = readResponseBody(err);
  const fromBody = body ? firstString(body.detail, body.title, body.error, body.message) : null;
  if (fromBody) {
    return fromBody;
  }

  if (err instanceof Error) {
    return firstString(err.message) ?? fallback;
  }

  if (err && typeof err === 'object' && 'message' in err) {
    return firstString((err as { message?: unknown }).message) ?? fallback;
  }

  return fallback;
}

/** Status HTTP odpowiedzi, jeśli błąd pochodzi z warstwy HTTP. */
export function getErrorStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object' || !('response' in err)) {
    return null;
  }
  const response = (err as { response?: unknown }).response;
  if (!response || typeof response !== 'object' || !('status' in response)) {
    return null;
  }
  const status = (response as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}
