/**
 * Konwersja pól liczbowych formularzy na granicy wysyłki.
 *
 * Wszystkie pola liczbowe w typach formularzy są łańcuchami znaków (bo takie
 * wartości daje `<input>`). Wcześniej część hooków wysyłała je bez konwersji
 * i rzutowanie spoczywało na deserializatorze backendu — te funkcje
 * ujednolicają konwersję w jednym miejscu.
 */

/** Łańcuch → liczba. Pusty lub niepoprawny łańcuch daje `null`. */
export function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const trimmed = value.trim().replace(',', '.');
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Jak `toNumberOrNull`, ale z wartością domyślną zamiast `null`. */
export function toNumber(value: string | number | null | undefined, fallback = 0): number {
  return toNumberOrNull(value) ?? fallback;
}

/** Łańcuch → liczba całkowita. Pusty lub niepoprawny łańcuch daje `null`. */
export function toIntegerOrNull(value: string | number | null | undefined): number | null {
  const parsed = toNumberOrNull(value);
  return parsed === null ? null : Math.trunc(parsed);
}

/** Jak `toIntegerOrNull`, ale z wartością domyślną zamiast `null`. */
export function toInteger(value: string | number | null | undefined, fallback = 0): number {
  return toIntegerOrNull(value) ?? fallback;
}

/** Pusty łańcuch → `null`; w przeciwnym razie przycięty łańcuch. */
export function toTextOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
