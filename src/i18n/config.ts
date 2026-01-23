import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import esCommon from './locales/es/common.json';
import esOnboarding from './locales/es/onboarding.json';
import esProfile from './locales/es/profile.json';

import enCommon from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enProfile from './locales/en/profile.json';

const resources = {
  es: {
    common: esCommon,
    onboarding: esOnboarding,
    profile: esProfile,
  },
  en: {
    common: enCommon,
    onboarding: enOnboarding,
    profile: enProfile,
  },
};

// Custom language detector
const customDetector = {
  name: 'customDetector',
  lookup() {
    // 1. Check localStorage first
    const stored = localStorage.getItem('app_language');
    if (stored && ['es', 'en', 'pt', 'fr'].includes(stored)) {
      return stored;
    }

    // 2. Check navigator.language
    const browserLang = navigator.language.split('-')[0];
    if (['es', 'en', 'pt', 'fr'].includes(browserLang)) {
      return browserLang;
    }

    // 3. Fallback to Spanish
    return 'es';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('app_language', lng);
  },
};

i18n
  .use({
    type: 'languageDetector',
    detect: customDetector.lookup,
    cacheUserLanguage: customDetector.cacheUserLanguage,
  } as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'onboarding', 'profile'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Disable suspense to avoid flicker
    },
    detection: {
      order: ['customDetector'],
      caches: ['localStorage'],
    },
  });

export default i18n;
