/**
 * Formatowanie dat, liczb i walut zależne od języka wybranego w aplikacji.
 *
 * Wcześniej `toLocaleString()` było wołane bez argumentu lokalizacji, więc
 * postać daty zależała od ustawień przeglądarki, a nie od języka interfejsu.
 * Odwzorowanie języka na lokalizację (`localeByLanguage`) istniało już
 * w modelu widoku, ale nie było używane — tutaj jest podpięte do
 * `Intl.DateTimeFormat`, `Intl.NumberFormat` i `Intl.PluralRules`.
 */

import type { Language } from './types';
import { localeByLanguage } from '../types/ui';

/** Waluta używana w danym kraju operatora. Kraje spoza mapy: sama liczba. */
export const currencyByCountry: Record<string, string> = {
  PL: 'PLN',
  DE: 'EUR',
  AT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  LT: 'EUR',
  LV: 'EUR',
  EE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  CH: 'CHF',
  GB: 'GBP',
  UA: 'UAH',
  US: 'USD',
};

export type Formatters = {
  locale: string;
  formatDate: (value?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
  formatNumber: (value?: number | null, fractionDigits?: number) => string;
  formatCurrency: (value?: number | null, country?: string | null) => string;
  pluralCategory: (count: number) => Intl.LDMLPluralRule;
};

const PLACEHOLDER = '-';

/**
 * Buduje komplet formatterów dla wybranego języka.
 * Instancje `Intl.*` są tworzone raz na język — ich konstrukcja jest kosztowna.
 */
const formattersCache = new Map<Language, Formatters>();

export function createFormatters(language: Language): Formatters {
  const cached = formattersCache.get(language);
  if (cached) {
    return cached;
  }

  const locale = localeByLanguage[language];

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const dateTimeFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const pluralRules = new Intl.PluralRules(locale);

  const parseDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatters: Formatters = {
    locale,

    formatDate: (value) => {
      const parsed = parseDate(value);
      return parsed ? dateFormat.format(parsed) : PLACEHOLDER;
    },

    formatDateTime: (value) => {
      const parsed = parseDate(value);
      return parsed ? dateTimeFormat.format(parsed) : PLACEHOLDER;
    },

    formatNumber: (value, fractionDigits) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return PLACEHOLDER;
      return new Intl.NumberFormat(locale, fractionDigits === undefined
        ? undefined
        : { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value);
    },

    formatCurrency: (value, country) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return PLACEHOLDER;
      const currency = country ? currencyByCountry[country.toUpperCase()] : undefined;
      if (!currency) {
        return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
      }
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    },

    pluralCategory: (count) => pluralRules.select(count),
  };

  formattersCache.set(language, formatters);
  return formatters;
}
