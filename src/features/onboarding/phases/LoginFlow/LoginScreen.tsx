/**
 * LoginScreen
 * Pantalla de autenticación - obligatoria (no skippeable)
 * Contextos:
 * 1. Primera vez: Welcome → Login → Config → App
 * 2. Logout: Login → App (directo)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, User, Chrome, Apple, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { isNative } from '@/shared/utils/platform';
import { getOAuthRedirectUrl } from '@/config/env';
import { useOnboarding } from '../../OnboardingContext';
import { ONBOARDING_KEYS } from '../../utils/onboarding.constants';

export default function LoginScreen() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { state, updatePhase, setAuthMethod } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthError, setOAuthError] = useState<{ message: string; isRetryable: boolean } | null>(null);

  // Sync context with URL when component mounts
  useEffect(() => {
    if (state.phase !== 'login') {
      console.log('[LoginScreen] Syncing context phase to login');
      updatePhase('login');
    }
  }, [state.phase, updatePhase]);

  /**
   * Listener para errores de OAuth callback
   */
  useEffect(() => {
    const handleOAuthError = (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string; code: number; isRetryable: boolean }>;
      const { error, isRetryable } = customEvent.detail;

      console.log('[LoginScreen] OAuth error received:', { error, isRetryable });

      // Stop loading state
      setLoading(false);

      // Show error modal
      setOAuthError({
        message: error,
        isRetryable,
      });
    };

    window.addEventListener('oauth-error', handleOAuthError);

    return () => {
      window.removeEventListener('oauth-error', handleOAuthError);
    };
  }, []);

  /**
   * Listener para detectar cuando el usuario regresa del OAuth
   * y la sesión se crea exitosamente
   */
  useEffect(() => {
    const checkSession = async () => {
      // Si hay flag de logout, ignorar sesión existente (puede estar cerrándose)
      // El usuario llegó aquí porque hizo logout, no por OAuth callback
      if (localStorage.getItem(ONBOARDING_KEYS.LOGOUT) === 'true') {
        console.log('[LoginScreen] Logout flag detected, ignoring existing session');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('[LoginScreen] Session detected on mount, handling OAuth callback');
        handleOAuthCallback();
      }
    };

    // Check inicial al montar
    checkSession();

    // Listener para cambios de auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[LoginScreen] Auth event:', event);

        if (event === 'SIGNED_IN' && session) {
          handleOAuthCallback();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Maneja el retorno exitoso de OAuth
   */
  const handleOAuthCallback = async () => {
    setAuthMethod('google');

    // Limpiar flag de logout (el usuario se logueó de nuevo)
    localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);

    // ✅ ALWAYS check cloud data first to determine if THIS specific user is new or returning.
    // The localStorage COMPLETED flag is device-scoped (not per-user), so after logout + login
    // with a different account, the flag would still be true from the previous user.
    try {
      console.log('[LoginScreen] Checking cloud data for returning user detection...');
      const { getCloudState } = await import('@/services/cloudState.service');
      const cloudData = await getCloudState();

      if (cloudData) {
        const hasCloudData = (cloudData.categoryDefinitions && cloudData.categoryDefinitions.length > 0) ||
                             (cloudData.transactions && cloudData.transactions.length > 0) ||
                             (cloudData.trips && cloudData.trips.length > 0);

        if (hasCloudData) {
          console.log('[LoginScreen] OAuth success → App (returning user, cloud has data)');
          localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
          localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
          navigate('/', { replace: true });
          return;
        }
      }

      // No cloud data → new user, go to FirstConfig
      console.log('[LoginScreen] OAuth success → First Config (new user, no cloud data)');
      navigate('/onboarding/config/1', { replace: true });
    } catch (err) {
      console.error('[LoginScreen] Error checking cloud data:', err);
      // Fallback: use localStorage flag only if cloud check fails
      const onboardingCompleted = localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';
      if (onboardingCompleted) {
        console.log('[LoginScreen] OAuth success → App (cloud check failed, using local flag)');
        navigate('/', { replace: true });
      } else {
        console.log('[LoginScreen] OAuth success → First Config (cloud check failed, no local flag)');
        navigate('/onboarding/config/1', { replace: true });
      }
    }
  };

  /**
   * Maneja la selección de modo invitado
   */
  const handleGuestMode = async () => {
    setLoading(true);
    setError(null);

    try {
      // Guardar método de autenticación
      setAuthMethod('guest');

      // Limpiar flag de logout (el usuario eligió continuar como invitado)
      localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);

      // Verificar directamente en localStorage (más confiable que el estado del contexto)
      const onboardingCompleted = localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';

      if (!onboardingCompleted) {
        // Primera vez: ir a First Config (guest mode, no cloud data to check)
        console.log('[LoginScreen] Guest mode selected → First Config');
        navigate('/onboarding/config/1', { replace: true });
      } else {
        // Returning user (logout): ir directo a app
        console.log('[LoginScreen] Guest mode selected → App (returning user)');
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('[LoginScreen] Error en guest mode:', err);
      setError(t('login.errorGuest'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el login con Google OAuth
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Native apps use custom URL scheme for OAuth deep linking
      // The scheme changes per environment (smartspend:// vs smartspend-dev://)
      const redirectTo = isNative() ? getOAuthRedirectUrl() : window.location.origin;

      console.log('[LoginScreen] OAuth redirect URL:', redirectTo);

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (authError) throw authError;

      // El OAuth redirige automáticamente
      // La lógica de siguiente pantalla se maneja en el callback de auth (useEffect listener)
      console.log('[LoginScreen] Google OAuth initiated');
    } catch (err: any) {
      console.error('[LoginScreen] Error en Google login:', err);
      setError(err.message || t('login.errorGoogle'));
      setLoading(false);
    }
  };

  /**
   * Navegar a la página de autenticación con email/contraseña
   */
  const handleEmailAuth = () => {
    navigate('/onboarding/auth');
  };

  /**
   * Placeholder para Apple (próximamente)
   */
  const handleAppleComingSoon = () => {
    setError(t('login.errorApple'));
    setTimeout(() => setError(null), 3000);
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header con icono de seguridad */}
      <div className="flex flex-col items-center px-6 pt-8 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <Shield size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('login.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t('login.subtitle')}
        </p>
      </div>

      {/* Features de privacidad - Texto informativo */}
      <div className="mx-6 mb-8">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('login.privacyNote')}
          </p>
        </div>
      </div>

      {/* Opciones de autenticación - ORDEN SOLICITADO */}
      <div className="flex-1 px-6 pb-8">
        <div className="space-y-3">
          {/* 1. Botón GRANDE: Explorar como invitado */}
          <button
            type="button"
            onClick={handleGuestMode}
            disabled={loading}
            className="flex w-full items-center gap-4 rounded-2xl bg-[#18B7B0] p-4 shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">{t('login.guestTitle')}</p>
              <p className="mt-0.5 text-xs text-white/80">{t('login.guestDesc')}</p>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-white" />}
          </button>

          {/* 2. Separador */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 dark:bg-gray-950 px-2 text-gray-600 dark:text-gray-400">{t('login.divider')}</span>
            </div>
          </div>

          {/* 3. Grid 2 columnas: Google y Apple */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                <Chrome className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{t('login.google')}</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </button>

            {/* Apple Sign In - Coming Soon */}
            <button
              type="button"
              onClick={handleAppleComingSoon}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm opacity-60 transition-all active:scale-[0.98]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black">
                <Apple className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{t('login.apple')}</span>
            </button>
          </div>

          {/* 4. Link simple: Email/Password */}
          <button
            type="button"
            onClick={handleEmailAuth}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-[#18B7B0] transition-colors hover:text-[#13948e]"
          >
            <Mail className="h-4 w-4" />
            <span>{t('login.emailLink')}</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Privacy Notice */}
        <p className="mt-6 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {t('login.termsPrefix')}{' '}
          <button
            type="button"
            onClick={() => navigate('/legal/terms')}
            className="font-medium text-[#18B7B0] underline"
          >
            {t('login.termsService')}
          </button>{' '}
          {t('login.termsAnd')}{' '}
          <button
            type="button"
            onClick={() => navigate('/legal/privacy')}
            className="font-medium text-[#18B7B0] underline"
          >
            {t('login.termsPrivacy')}
          </button>
        </p>
      </div>

      {/* OAuth Error Modal */}
      {oauthError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOAuthError(null)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Error de conexión
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {oauthError.message}
            </p>

            {/* Actions */}
            <div className={oauthError.isRetryable ? "flex gap-3" : ""}>
              <button
                type="button"
                onClick={() => setOAuthError(null)}
                className={`${
                  oauthError.isRetryable
                    ? "flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    : "w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
                }`}
              >
                Cerrar
              </button>

              {oauthError.isRetryable && (
                <button
                  type="button"
                  onClick={() => {
                    setOAuthError(null);
                    handleGoogleLogin();
                  }}
                  className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#13948e]"
                >
                  Reintentar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
