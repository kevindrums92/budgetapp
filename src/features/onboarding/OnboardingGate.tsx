/**
 * OnboardingGate
 * Componente que decide si mostrar onboarding o dejar pasar a la app
 * Similar al WelcomeGate anterior pero con el nuevo sistema
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { determineStartScreen, migrateFromLegacyWelcome } from './utils/onboarding.helpers';

export default function OnboardingGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Permitir rutas auxiliares durante el onboarding (ej: crear categoría)
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('returnTo') === 'onboarding') {
        console.log('[OnboardingGate] Allowing auxiliary route during onboarding:', location.pathname);
        setChecking(false);
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
      // CASO 2: Continuar desde progreso guardado (no redirigir)
      else if (startScreen === 'continue') {
        console.log('[OnboardingGate] Continuing from saved progress');
        // No hacer nada, dejar que el usuario continúe donde estaba
      }
      // CASO 3: Debe ir a login directo (returning user)
      else if (startScreen === 'login') {
        // Si no estamos en login, redirigir
        if (location.pathname !== '/onboarding/login') {
          console.log('[OnboardingGate] Redirecting to login');
          navigate('/onboarding/login', { replace: true });
        }
      }
      // CASO 4: Debe ir a app
      else if (startScreen === 'app') {
        // Si estamos en onboarding, salir a app
        if (location.pathname.startsWith('/onboarding')) {
          console.log('[OnboardingGate] Redirecting to app');
          navigate('/', { replace: true });
        }
      }

      setChecking(false);
    };

    checkOnboarding();
  }, [navigate, location.pathname]);

  // Este componente no renderiza nada, solo maneja la lógica de redirección
  return null;
}
