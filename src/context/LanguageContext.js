import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLanguage, saveLanguage } from '../utils/storage';
import { translations } from '../i18n/translations';

const LanguageContext = createContext({
  language: 'en',
  isRTL: false,
  t: (key) => key,
  setLanguage: async () => {},
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await getLanguage();
        if (isMounted && saved) setLanguageState(saved);
      } catch (e) {
        // If reading the saved language fails for any reason, just
        // keep the default ('en') instead of leaving the app stuck.
        console.warn('Could not load saved language:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    try {
      await saveLanguage(lang);
    } catch (e) {
      console.warn('Could not save language:', e);
    }
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, isRTL: language === 'ur', t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}