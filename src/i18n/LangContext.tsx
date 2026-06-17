import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Lang, translations, TranslationKey, getStoredLang, setStoredLang } from './translations.js';

interface LangContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang());

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    setStoredLang(newLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'rw' : 'en');
  }, [lang, setLang]);

  const t = useCallback((key: TranslationKey) => {
    return translations[lang][key] || translations.en[key] || key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, t, toggleLang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
