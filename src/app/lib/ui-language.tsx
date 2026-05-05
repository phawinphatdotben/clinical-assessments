"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UiLanguage = "en" | "th";

const STORAGE_KEY = "ui-language";

type UiLanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  toggleLanguage: () => void;
};

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>("en");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "en" || raw === "th") {
        queueMicrotask(() => setLanguageState(raw));
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const setLanguage = (next: UiLanguage) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage access errors
    }
  };

  const toggleLanguage = () => setLanguage(language === "en" ? "th" : "en");

  const value = { language, setLanguage, toggleLanguage };

  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage() {
  const ctx = useContext(UiLanguageContext);
  if (!ctx) {
    throw new Error("useUiLanguage must be used inside UiLanguageProvider");
  }
  return ctx;
}

export function t(language: UiLanguage, english: string, thai: string): string {
  return language === "th" ? thai : english;
}
