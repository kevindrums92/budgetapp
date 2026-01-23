/**
 * Onboarding Helpers
 * Funciones puras sin dependencia del contexto
 * Para usar fuera del OnboardingProvider
 */

import { ONBOARDING_KEYS, LEGACY_WELCOME_KEY } from './onboarding.constants';
import { supabase } from '@/lib/supabaseClient';

/**
 * Determina qué pantalla mostrar al iniciar la app
 * Versión standalone sin dependencia del contexto
 */
export async function determineStartScreen(): Promise<'app' | 'onboarding' | 'login' | 'continue'> {
  // 1. Check si el onboarding ya se completó alguna vez
  const onboardingEverCompleted =
    localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';

  // 2. Check si hay progreso guardado (usuario en medio del onboarding)
  const savedProgress = getSavedProgress();

  // 3. Check si hay sesión activa
  const { data } = await supabase.auth.getSession();
  const hasActiveSession = !!data.session;

  // 4. Check si el usuario hizo logout explícito
  const hasLoggedOut = localStorage.getItem(ONBOARDING_KEYS.LOGOUT) === 'true';

  console.log('[determineStartScreen] Estado:', {
    onboardingEverCompleted,
    hasActiveSession,
    hasLoggedOut,
    savedProgress,
    completedKey: localStorage.getItem(ONBOARDING_KEYS.COMPLETED),
    progressKey: localStorage.getItem(ONBOARDING_KEYS.PROGRESS),
    logoutKey: localStorage.getItem(ONBOARDING_KEYS.LOGOUT),
  });

  // CASO 1: Usuario con sesión activa → APP
  if (hasActiveSession) {
    // Si tiene sesión pero nunca hizo onboarding, marcarlo como completado
    // (esto cubre casos edge como deep links o sesiones previas)
    if (!onboardingEverCompleted) {
      markOnboardingComplete();
    }
    // Limpiar flag de logout ya que ahora está logueado
    localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);
    console.log('[determineStartScreen] → APP (sesión activa)');
    return 'app';
  }

  // CASO 2: Logout explícito → LOGIN
  // Usuario que ya completó onboarding y cerró sesión
  if (onboardingEverCompleted && hasLoggedOut) {
    console.log('[determineStartScreen] → LOGIN (logout explícito)');
    return 'login';
  }

  // CASO 3: Onboarding ya completado (guest mode) → APP
  // Si el onboarding ya se completó alguna vez, dejar usar la app
  // (funciona en guest mode si no hay sesión ni logout)
  if (onboardingEverCompleted) {
    console.log('[determineStartScreen] → APP (onboarding completado, guest mode)');
    return 'app';
  }

  // CASO 3: Primera vez (nunca completó onboarding)
  // Check legacy welcome para migración
  const legacyWelcomeSeen = localStorage.getItem(LEGACY_WELCOME_KEY);
  if (legacyWelcomeSeen === '1') {
    // Usuario legacy: migrar y enviar directo a app (ya tiene datos)
    markOnboardingComplete();
    console.log('[determineStartScreen] → APP (legacy migrated)');
    return 'app';
  }

  // Si hay progreso guardado, continuar desde donde estaba
  if (savedProgress && savedProgress.phase) {
    console.log('[determineStartScreen] → CONTINUE (progreso guardado en fase:', savedProgress.phase, ')');
    return 'continue'; // El Gate NO debe redirigir, dejar que continue
  }

  console.log('[determineStartScreen] → ONBOARDING (primera vez, sin progreso)');
  return 'onboarding'; // Welcome → Login → Config
}

/**
 * Marca el onboarding como completado
 */
export function markOnboardingComplete() {
  const now = Date.now();

  localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
  localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, now.toString());

  console.log('[Onboarding] Marked as completed at:', new Date(now).toLocaleString());
}

/**
 * Migra desde el legacy welcome
 */
export function migrateFromLegacyWelcome() {
  const legacySeen = localStorage.getItem(LEGACY_WELCOME_KEY);
  if (legacySeen === '1') {
    // Usuario ya pasó por el welcome anterior
    localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
    localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());

    // Eliminar key legacy
    localStorage.removeItem(LEGACY_WELCOME_KEY);

    console.log('[Onboarding] Migrated from legacy welcome');
  }
}

/**
 * Check si el onboarding fue completado
 */
export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';
}

/**
 * Get saved progress
 */
export function getSavedProgress() {
  const saved = localStorage.getItem(ONBOARDING_KEYS.PROGRESS);
  return saved ? JSON.parse(saved) : null;
}

/**
 * Get saved selections
 */
export function getSavedSelections() {
  const saved = localStorage.getItem(ONBOARDING_KEYS.SELECTIONS);
  return saved ? JSON.parse(saved) : {};
}

/**
 * Marca que el usuario hizo logout explícito
 * Para mostrarle el login screen en lugar del welcome
 */
export function markLogout() {
  localStorage.setItem(ONBOARDING_KEYS.LOGOUT, 'true');
  console.log('[Onboarding] Logout marked');
}
