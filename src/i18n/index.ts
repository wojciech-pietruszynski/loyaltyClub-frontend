import de from './de';
import en from './en';
import pl from './pl';
import { createFormatters } from './format';
import type { Language, TranslationKey, TranslationMap } from './types';

const dictionaries: Record<Language, TranslationMap> = {
  pl,
  en,
  de,
};

export type { Language, TranslationKey };
export { createFormatters };
export type { Formatters } from './format';

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) {
    return text;
  }
  return Object.entries(params).reduce(
    (acc, [param, value]) => acc.replace(new RegExp(`{{${param}}}`, 'g'), String(value)),
    text,
  );
}

export const translate = (language: Language, key: TranslationKey, params?: Record<string, string | number>): string => {
  const text = dictionaries[language][key] ?? dictionaries.pl[key] ?? key;
  return interpolate(text, params);
};

/**
 * Klucze mające warianty liczby mnogiej (`_one`, `_few`, `_many`, `_other`).
 * Polski wymaga formy trójstopniowej, więc samo `{{count}}` w jednym łańcuchu
 * nie wystarcza — kategorię wybiera `Intl.PluralRules` dla lokalizacji języka.
 */
export type PluralTranslationKey = 'customersFound' | 'couponsFound' | 'importedCustomers';

export const translatePlural = (
  language: Language,
  key: PluralTranslationKey,
  count: number,
  params?: Record<string, string | number>,
): string => {
  const category = createFormatters(language).pluralCategory(count);
  const dictionary = dictionaries[language];
  const candidate = `${key}_${category}` as TranslationKey;
  const fallback = `${key}_other` as TranslationKey;
  const text = dictionary[candidate] ?? dictionary[fallback] ?? pl[fallback] ?? key;
  return interpolate(text, { count, ...params });
};
