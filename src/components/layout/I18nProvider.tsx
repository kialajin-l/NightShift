'use client';

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Locale, type TranslationKey, translate, setLocale as setI18nLocale } from '@/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

function getInitialLocale(): Locale {
  if (typeof navigator !== 'undefined') {
    const candidates = [
      ...(navigator.languages || []),
      navigator.language,
    ].filter(Boolean);
    if (candidates.some(lang => lang.startsWith('zh'))) {
      return 'zh';
    }
  }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    setI18nLocale(locale);
  }, [locale]);

  useEffect(() => {
    async function loadLocale() {
      try {
        const res = await fetch('/api/settings/app');
        if (res.ok) {
          const data = await res.json();
          const saved = data.settings?.locale;
          if (saved === 'en' || saved === 'zh') {
            setLocaleState(saved);
            setI18nLocale(saved);
            return;
          }
        }
      } catch { /* ignore */ }
    }
    loadLocale();
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setI18nLocale(newLocale);
    fetch('/api/settings/app', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { locale: newLocale } }),
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(key, params),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
