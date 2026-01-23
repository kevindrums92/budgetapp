import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import esCommon from './locales/es/common.json';
import esOnboarding from './locales/es/onboarding.json';
import esProfile from './locales/es/profile.json';
import esHome from './locales/es/home.json';
import esBudget from './locales/es/budget.json';
import esStats from './locales/es/stats.json';
import esTrips from './locales/es/trips.json';
import esTransactions from './locales/es/transactions.json';
import esCategories from './locales/es/categories.json';
import esBackup from './locales/es/backup.json';
import esScheduled from './locales/es/scheduled.json';

import enCommon from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enProfile from './locales/en/profile.json';
import enHome from './locales/en/home.json';
import enBudget from './locales/en/budget.json';
import enStats from './locales/en/stats.json';
import enTrips from './locales/en/trips.json';
import enTransactions from './locales/en/transactions.json';
import enCategories from './locales/en/categories.json';
import enBackup from './locales/en/backup.json';
import enScheduled from './locales/en/scheduled.json';

const resources = {
  es: {
    common: esCommon,
    onboarding: esOnboarding,
    profile: esProfile,
    home: esHome,
    budget: esBudget,
    stats: esStats,
    trips: esTrips,
    transactions: esTransactions,
    categories: esCategories,
    backup: esBackup,
    scheduled: esScheduled,
  },
  en: {
    common: enCommon,
    onboarding: enOnboarding,
    profile: enProfile,
    home: enHome,
    budget: enBudget,
    stats: enStats,
    trips: enTrips,
    transactions: enTransactions,
    categories: enCategories,
    backup: enBackup,
    scheduled: enScheduled,
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
    ns: ['common', 'onboarding', 'profile', 'home', 'budget', 'stats', 'trips', 'transactions', 'categories', 'backup', 'scheduled'],
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
