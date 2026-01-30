/**
 * Onboarding Types
 * Tipos para el sistema completo de onboarding
 */

export type OnboardingPhase = 'welcome' | 'login' | 'config' | 'complete';

export type AuthMethod = 'guest' | 'google' | 'apple' | 'email';

export interface OnboardingState {
  phase: OnboardingPhase;
  step: number;
  completed: boolean; // TRUE = ya se hizo alguna vez (no volver a mostrar welcome/config)

  // Context flags
  isFirstTime: boolean; // TRUE = nunca completó onboarding, FALSE = logout
  isReturningUser: boolean; // TRUE = ya completó onboarding antes, ahora logout

  // Skip tracking por fase (solo aplica en primera vez)
  welcomeSkipped: boolean; // Welcome → Login
  configSkipped: boolean; // Config → App
  // Login NO es skippeable

  selections: {
    authMethod?: AuthMethod;
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    currency?: string;
    notifications?: boolean;
    selectedCategories?: string[]; // IDs de categorías por defecto seleccionadas
    selectedPlan?: 'monthly' | 'annual' | 'lifetime' | null; // Plan seleccionado en Screen7
  };

  // Timestamps
  firstCompletedAt?: number; // Cuando se completó por PRIMERA vez
  lastLoginAt?: number; // Último login (para logout tracking)
}

export interface OnboardingProgress {
  phase: OnboardingPhase;
  step: number;
  welcomeSkipped?: boolean;
  configSkipped?: boolean;
}

export interface OnboardingSelections {
  authMethod?: AuthMethod;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  currency?: string;
  notifications?: boolean;
  selectedCategories?: string[]; // IDs de categorías por defecto seleccionadas
}

export interface OnboardingContextValue {
  state: OnboardingState;
  updatePhase: (phase: OnboardingPhase) => void;
  updateStep: (step: number) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrency: (currency: string) => void;
  setSelectedCategories: (categoryIds: string[]) => void;
  setSelectedPlan: (plan: 'monthly' | 'annual' | 'lifetime' | null) => void;
  skipWelcome: () => void;
  skipConfig: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void; // Para testing
}
