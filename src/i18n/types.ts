import pl from './pl';

export type TranslationKey = keyof typeof pl;
export type TranslationMap = Record<TranslationKey, string>;
export type Language = 'pl' | 'en' | 'de';
