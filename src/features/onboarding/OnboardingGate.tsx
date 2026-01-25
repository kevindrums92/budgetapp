/**
 * OnboardingGate
 * Componente que decide si mostrar onboarding o dejar pasar a la app
 * Similar al WelcomeGate anterior pero con el nuevo sistema
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { determineStartScreen, migrateFromLegacyWelcome, getSavedProgress } from './utils/onboarding.helpers';

export default function OnboardingGate() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkOnboarding = async () => {
      // Permitir rutas auxiliares durante el onboarding (ej: crear categoría)
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('returnTo') === 'onboarding') {
        console.log('[OnboardingGate] Allowing auxiliary route during onboarding:', location.pathname);
        return;
      }

      // Migrar desde legacy welcome si existe
      migrateFromLegacyWelcome();

      // Determinar qué pantalla mostrar
      const startScreen = await determineStartScreen();

      console.log('[OnboardingGate] Start screen:', startScreen, 'Current path:', location.pathname);

      // CASO 1: Debe ir a onboarding completo (primera vez, sin progreso)
      if (startScreen === 'onboarding') {
        // Si no estamos en welcome, redirigir
        if (!location.pathname.startsWith('/onboarding/welcome')) {
          console.log('[OnboardingGate] Redirecting to welcome/1');
          navigate('/onboarding/welcome/1', { replace: true });
        }
      }
      // CASO 2: Continuar desde progreso guardado
      else if (startScreen === 'continue') {
        console.log('[OnboardingGate] Continuing from saved progress');

        // ONLY redirect if user is OUTSIDE onboarding
        // If already inside onboarding, let WelcomeOnboardingFlow/ConfigFlow handle it
        if (!location.pathname.startsWith('/onboarding')) {
          const savedProgress = getSavedProgress();

          if (savedProgress && savedProgress.phase && savedProgress.step) {
            // Build the expected path from saved progress
            const savedPath = savedProgress.phase === 'login'
              ? '/onboarding/login'
              : `/onboarding/${savedProgress.phase}/${savedProgress.step}`;

            console.log('[OnboardingGate] Not in onboarding, redirecting to saved progress:', savedPath);
            navigate(savedPath, { replace: true });
          } else {
            // Fallback: si no hay progreso válido y está fuera de onboarding, ir a config/1
            console.log('[OnboardingGate] No valid progress, redirecting to First Config');
            navigate('/onboarding/config/1', { replace: true });
          }
        } else {
          console.log('[OnboardingGate] Already in onboarding, letting Flow components handle navigation');
        }
      }
      // CASO 3: Debe ir a login directo (returning user)
      else if (startScreen === 'login') {
        // Permitir rutas de auth (login, auth pages, reset password)
        const isAuthRoute =
          location.pathname === '/onboarding/login' ||
          location.pathname.startsWith('/onboarding/auth') ||
          location.pathname.startsWith('/onboarding/reset-password');

        // Si no estamos en una ruta de auth, redirigir a login
        if (!isAuthRoute) {
          console.log('[OnboardingGate] Redirecting to login');
          navigate('/onboarding/login', { replace: true });
        }
      }
      // CASO 4: Debe ir a app
      else if (startScreen === 'app') {
        // Allow specific onboarding routes even with active session:
        // - Password reset flow (OTP verification creates session, user needs to change password)
        // - First config flow (New user just verified OTP, needs to complete config)
        // - Login/Auth routes (Guest users who completed onboarding can sign in)
        const isPasswordResetRoute = location.pathname.startsWith('/onboarding/reset-password');
        const isConfigRoute = location.pathname.startsWith('/onboarding/config');
        const isLoginRoute =
          location.pathname === '/onboarding/login' ||
          location.pathname.startsWith('/onboarding/auth');

        // Si estamos en onboarding (pero no en rutas permitidas), salir a app
        if (location.pathname.startsWith('/onboarding') && !isPasswordResetRoute && !isConfigRoute && !isLoginRoute) {
          console.log('[OnboardingGate] Redirecting to app');
          navigate('/', { replace: true });
        }
      }
    };

    checkOnboarding();
  }, [navigate, location.pathname, location.search]);

  // Este componente no renderiza nada, solo maneja la lógica de redirección
  return null;
}
