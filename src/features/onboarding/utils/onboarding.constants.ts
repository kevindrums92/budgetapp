/**
 * Onboarding Constants
 * Constantes para el sistema de onboarding
 */

// LocalStorage Keys
export const ONBOARDING_KEYS = {
  COMPLETED: 'budget.onboarding.completed.v2', // Boolean - onboarding completado
  PROGRESS: 'budget.onboarding.progress.v2', // JSON - progreso actual
  SELECTIONS: 'budget.onboarding.selections.v2', // JSON - selecciones del usuario
  TIMESTAMP: 'budget.onboarding.timestamp.v2', // Number - cuándo se completó
  LOGOUT: 'budget.onboarding.logout.v2', // Boolean - usuario hizo logout explícito
} as const;

// Legacy key (deprecar después de migración)
export const LEGACY_WELCOME_KEY = 'budget.welcomeSeen.v1';

// Welcome Onboarding Screen Titles
export const WELCOME_SCREENS = {
  1: 'Bienvenido a SmartSpend',
  2: 'Registro Instantáneo',
  3: 'Presupuestos Tranquilos',
  4: 'Análisis de Hábitos',
  5: 'Automatización de Movimientos',
  6: 'Entiende tu Plata',
} as const;

// Total screens per phase
export const PHASE_SCREEN_COUNTS = {
  welcome: 6,
  login: 1,
  config: 2, // ConfigIntro + LanguageSelect (expandible a 5)
} as const;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  slide: 300,
  fade: 200,
  stagger: 50,
} as const;

// Language options
export const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

// Default state
export const DEFAULT_ONBOARDING_STATE = {
  phase: 'welcome' as const,
  step: 1,
  completed: false,
  isFirstTime: true,
  isReturningUser: false,
  welcomeSkipped: false,
  configSkipped: false,
  selections: {},
};
