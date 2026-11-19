"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createI18n, type I18n } from "@/lib/i18n-core";
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY, parseLocale, type Locale } from "@/lib/locale";

export type { I18n, Params, RichParams } from "@/lib/i18n-core";
export type { Locale } from "@/lib/locale";

const I18nContext = createContext<I18n>(createI18n("en", () => {}));

function persistLocale(locale: Locale) {
  try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* storage can be blocked */ }
  try { document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`; } catch { /* cookies can be blocked */ }
}

/**
 * `initialLocale` comes from the cookie on the server, so the first paint is already in the right language.
 * Without it (first visit after this feature shipped, or a page with no server hint) the saved choice is read
 * from localStorage right after mount.
 */
export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");

  useEffect(() => {
    if (initialLocale) return;
    try {
      const saved = parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
      if (saved && saved !== "en") {
        // Deferred a tick so it is not a synchronous state update inside the effect (react-hooks lint rule)
        queueMicrotask(() => setLocaleState(saved));
        persistLocale(saved);
      }
    } catch { /* storage can be blocked */ }
  }, [initialLocale]);

  // Screen readers pick the voice from <html lang>, and the Bengali font and spacing rules key off it too.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo(() => createI18n(locale, setLocale), [locale, setLocale]);
  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
