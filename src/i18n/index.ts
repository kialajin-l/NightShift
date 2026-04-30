// i18n module - NightShift
// Loads translation maps from en.ts / zh.ts and provides translate() + useTranslation()

import en from './en';
import zh from './zh';

export type Locale = 'en' | 'zh';

type EnKeys = keyof typeof en;
type ZhKeys = keyof typeof zh;
export type TranslationKey = EnKeys | ZhKeys | string;

const locales: Record<Locale, Record<string, string>> = { en, zh };

let currentLocale: Locale = 'zh';

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Translate a key with optional parameter interpolation.
 * Falls back to English, then to the raw key if not found.
 */
export function translate(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dict = locales[currentLocale] ?? locales.en;
  let text: string | undefined = dict[key as string] ?? locales.en[key as string];

  if (text === undefined) {
    text = key as string;
  }

  if (params && typeof text === 'string') {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\{${k}\}`, 'g'), String(v));
    }
  }

  return text;
}

export function useTranslation(): { t: typeof translate; locale: Locale } {
  return {
    t: translate,
    locale: currentLocale,
  };
}

export const supportedLocales = ['en', 'zh'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
