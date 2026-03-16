import de from './de';
import en from './en';
import pl from './pl';
import type { Language, TranslationKey, TranslationMap } from './types';

const dictionaries: Record<Language, TranslationMap> = {
  pl,
  en,
  de,
};

export type { Language, TranslationKey };

export const translate = (language: Language, key: TranslationKey, params?: Record<string, string | number>): string => {
  const text = dictionaries[language][key] ?? dictionaries.pl[key] ?? key;
  if (!params) {
    return text;
  }
  return Object.entries(params).reduce((acc, [param, value]) => acc.replace(new RegExp(`{{${param}}}`, 'g'), String(value)), text);
};

