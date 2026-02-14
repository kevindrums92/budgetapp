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
import esHistory from './locales/es/history.json';
import esLegal from './locales/es/legal.json';
import esNotifications from './locales/es/notifications.json';
import esPaywall from './locales/es/paywall.json';
import esBatch from './locales/es/batch.json';
import esTour from './locales/es/tour.json';
import esSession from './locales/es/session.json';
import esForecasting from './locales/es/forecasting.json';

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
import enHistory from './locales/en/history.json';
import enLegal from './locales/en/legal.json';
import enNotifications from './locales/en/notifications.json';
import enPaywall from './locales/en/paywall.json';
import enBatch from './locales/en/batch.json';
import enTour from './locales/en/tour.json';
import enSession from './locales/en/session.json';
import enForecasting from './locales/en/forecasting.json';

import ptCommon from './locales/pt/common.json';
import ptOnboarding from './locales/pt/onboarding.json';
import ptProfile from './locales/pt/profile.json';
import ptHome from './locales/pt/home.json';
import ptBudget from './locales/pt/budget.json';
import ptStats from './locales/pt/stats.json';
import ptTrips from './locales/pt/trips.json';
import ptTransactions from './locales/pt/transactions.json';
import ptCategories from './locales/pt/categories.json';
import ptBackup from './locales/pt/backup.json';
import ptScheduled from './locales/pt/scheduled.json';
import ptHistory from './locales/pt/history.json';
import ptLegal from './locales/pt/legal.json';
import ptNotifications from './locales/pt/notifications.json';
import ptPaywall from './locales/pt/paywall.json';
import ptBatch from './locales/pt/batch.json';
import ptTour from './locales/pt/tour.json';
import ptSession from './locales/pt/session.json';
import ptForecasting from './locales/pt/forecasting.json';

import frCommon from './locales/fr/common.json';
import frOnboarding from './locales/fr/onboarding.json';
import frProfile from './locales/fr/profile.json';
import frHome from './locales/fr/home.json';
import frBudget from './locales/fr/budget.json';
import frStats from './locales/fr/stats.json';
import frTrips from './locales/fr/trips.json';
import frTransactions from './locales/fr/transactions.json';
import frCategories from './locales/fr/categories.json';
import frBackup from './locales/fr/backup.json';
import frScheduled from './locales/fr/scheduled.json';
import frHistory from './locales/fr/history.json';
import frLegal from './locales/fr/legal.json';
import frNotifications from './locales/fr/notifications.json';
import frPaywall from './locales/fr/paywall.json';
import frBatch from './locales/fr/batch.json';
import frTour from './locales/fr/tour.json';
import frSession from './locales/fr/session.json';
import frForecasting from './locales/fr/forecasting.json';

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
    history: esHistory,
    legal: esLegal,
    notifications: esNotifications,
    paywall: esPaywall,
    batch: esBatch,
    tour: esTour,
    session: esSession,
    forecasting: esForecasting,
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
    history: enHistory,
    legal: enLegal,
    notifications: enNotifications,
    paywall: enPaywall,
    batch: enBatch,
    tour: enTour,
    session: enSession,
    forecasting: enForecasting,
  },
  pt: {
    common: ptCommon,
    onboarding: ptOnboarding,
    profile: ptProfile,
    home: ptHome,
    budget: ptBudget,
    stats: ptStats,
    trips: ptTrips,
    transactions: ptTransactions,
    categories: ptCategories,
    backup: ptBackup,
    scheduled: ptScheduled,
    history: ptHistory,
    legal: ptLegal,
    notifications: ptNotifications,
    paywall: ptPaywall,
    batch: ptBatch,
    tour: ptTour,
    session: ptSession,
    forecasting: ptForecasting,
  },
  fr: {
    common: frCommon,
    onboarding: frOnboarding,
    profile: frProfile,
    home: frHome,
    budget: frBudget,
    stats: frStats,
    trips: frTrips,
    transactions: frTransactions,
    categories: frCategories,
    backup: frBackup,
    scheduled: frScheduled,
    history: frHistory,
    legal: frLegal,
    notifications: frNotifications,
    paywall: frPaywall,
    batch: frBatch,
    tour: frTour,
    session: frSession,
    forecasting: frForecasting,
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
    ns: ['common', 'onboarding', 'profile', 'home', 'budget', 'stats', 'trips', 'transactions', 'categories', 'backup', 'scheduled', 'history', 'legal', 'notifications', 'paywall', 'batch', 'tour', 'session', 'forecasting'],
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
