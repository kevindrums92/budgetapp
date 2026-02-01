/**
 * LoginProScreen
 * Pantalla de autenticación para activar plan Pro/Trial
 * Solo muestra Google y Apple (sin guest mode)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Chrome, Apple, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { isNative } from '@/shared/utils/platform';
import { getOAuthRedirectUrl } from '@/config/env';
import { useOnboarding } from '../../OnboardingContext';
import { ONBOARDING_KEYS } from '../../utils/onboarding.constants';

export default function LoginProScreen() {
  const { t } = useTranslation(['onboarding', 'paywall']);
  const navigate = useNavigate();
  const { state, updatePhase, setAuthMethod } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthError, setOAuthError] = useState<{ message: string; isRetryable: boolean } | null>(null);
  const [revenueCatError, setRevenueCatError] = useState<{ message: string; technicalDetails: string } | null>(null);

  const selectedPlan = state.selections.selectedPlan || 'monthly';

  // ✅ CRITICAL: Mark device as initialized when user reaches login screen
  // This permanent flag ensures WelcomeOnboarding is only shown on first device use
  useEffect(() => {
    const isAlreadyInitialized = localStorage.getItem(ONBOARDING_KEYS.DEVICE_INITIALIZED) === 'true';
    if (!isAlreadyInitialized) {
      localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
      console.log('[LoginProScreen] Device marked as initialized (first time reaching login)');
    }
  }, []);

  // Sync context with URL when component mounts
  useEffect(() => {
    if (state.phase !== 'login') {
      console.log('[LoginProScreen] Syncing context phase to login');
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

      console.log('[LoginProScreen] OAuth error received:', { error, isRetryable });

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
      // Si hay flag de logout, ignorar sesión existente
      if (localStorage.getItem(ONBOARDING_KEYS.LOGOUT) === 'true') {
        console.log('[LoginProScreen] Logout flag detected, ignoring existing session');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('[LoginProScreen] Session detected on mount, handling OAuth callback');
        handleOAuthCallback();
      }
    };

    // Check inicial al montar
    checkSession();

    // Listener para cambios de auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[LoginProScreen] Auth event:', event);

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
   * Activa el trial del plan seleccionado
   */
  const handleOAuthCallback = async () => {
    setAuthMethod('google');

    // Limpiar flag de logout
    localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);

    try {
      console.log('[LoginProScreen] OAuth success → Activating trial for plan:', selectedPlan);

      // Get Supabase session to obtain user ID
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        throw new Error('No user session found after OAuth');
      }

      // ⚠️ CRITICAL: Link RevenueCat to authenticated user BEFORE purchase
      // This ensures subscription is tied to user.id for cross-device sync and restore
      if (isNative()) {
        try {
          const { Purchases } = await import('@revenuecat/purchases-capacitor');
          await Purchases.logIn({ appUserID: user.id });
          console.log('[LoginProScreen] RevenueCat linked to user:', user.email);
        } catch (error) {
          console.warn('[LoginProScreen] Failed to link RevenueCat to user:', error);
          // Continue with purchase even if logIn fails (graceful degradation)
        }
      }

      // ✅ CHECK: Verify if user already has an active subscription
      // This prevents showing purchase flow to users who already bought Pro on another device
      console.log('[LoginProScreen] Checking for existing subscription...');
      const { getSubscription } = await import('@/services/subscription.service');
      const existingSubscription = await getSubscription(user.id);

      if (existingSubscription && (existingSubscription.status === 'active' || existingSubscription.status === 'trialing')) {
        console.log('[LoginProScreen] User already has active subscription:', existingSubscription);

        // Sync to store
        const { useBudgetStore } = await import('@/state/budget.store');
        useBudgetStore.getState().setSubscription(existingSubscription);

        // Navigate based on user data (same logic as after purchase)
        const { getCloudState } = await import('@/services/cloudState.service');
        const cloudData = await getCloudState();

        if (cloudData) {
          const hasCloudData = (cloudData.categoryDefinitions && cloudData.categoryDefinitions.length > 0) ||
                               (cloudData.transactions && cloudData.transactions.length > 0) ||
                               (cloudData.trips && cloudData.trips.length > 0);

          if (hasCloudData) {
            console.log('[LoginProScreen] Existing Pro user with cloud data → App');
            localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
            localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
            navigate('/', { replace: true });
            return;
          }
        }

        // Check local data
        const { loadState } = await import('@/services/storage.service');
        const localData = loadState();

        if (localData) {
          const hasLocalData = (localData.categoryDefinitions && localData.categoryDefinitions.length > 0) ||
                               (localData.transactions && localData.transactions.length > 0) ||
                               (localData.trips && localData.trips.length > 0);

          if (hasLocalData) {
            console.log('[LoginProScreen] Existing Pro user with local data → App');
            localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
            localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
            navigate('/', { replace: true });
            return;
          }
        }

        // New Pro user → First Config
        console.log('[LoginProScreen] Existing Pro user (new device) → First Config');
        navigate('/onboarding/config/1', { replace: true });
        return;
      }

      console.log('[LoginProScreen] No existing subscription found, proceeding with purchase...');

      // Activar trial con RevenueCat
      const { purchasePackage, getOfferings } = await import('@/services/revenuecat.service');

      const offerings = await getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      console.log('[LoginProScreen] Available packages:', offerings.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        productId: pkg.product.identifier
      })));

      // Encontrar el paquete seleccionado
      // Match by identifier OR packageType (RevenueCat might use different identifiers)
      const packageToPurchase = offerings.availablePackages.find(
        (pkg) => pkg.identifier === selectedPlan || pkg.packageType === selectedPlan
      );

      console.log('[LoginProScreen] Selected plan:', selectedPlan);
      console.log('[LoginProScreen] Package found:', packageToPurchase ? 'YES' : 'NO');
      if (packageToPurchase) {
        console.log('[LoginProScreen] Matched package:', {
          identifier: packageToPurchase.identifier,
          packageType: packageToPurchase.packageType,
          productId: packageToPurchase.product.identifier
        });
      }

      if (!packageToPurchase) {
        throw new Error(`Package ${selectedPlan} not found. Available: ${offerings.availablePackages.map(p => p.identifier).join(', ')}`);
      }

      // Ejecutar compra (activa trial de 7 días)
      const purchaseResult = await purchasePackage(packageToPurchase);
      console.log('[LoginProScreen] Trial activated:', purchaseResult);

      // Sync subscription state with Zustand store using new subscription service
      const { useBudgetStore } = await import('@/state/budget.store');
      const subscription = await getSubscription(user.id);
      useBudgetStore.getState().setSubscription(subscription);
      console.log('[LoginProScreen] Subscription synced with store:', subscription?.status);

      // Check cloud data to determine if new or returning user
      const { getCloudState } = await import('@/services/cloudState.service');
      const cloudData = await getCloudState();

      if (cloudData) {
        const hasCloudData = (cloudData.categoryDefinitions && cloudData.categoryDefinitions.length > 0) ||
                             (cloudData.transactions && cloudData.transactions.length > 0) ||
                             (cloudData.trips && cloudData.trips.length > 0);

        if (hasCloudData) {
          console.log('[LoginProScreen] Returning user with cloud data → App');
          localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
          localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
          navigate('/', { replace: true });
          return;
        }
      }

      // Check local data (guest user connecting account)
      const { loadState } = await import('@/services/storage.service');
      const localData = loadState();

      if (localData) {
        const hasLocalData = (localData.categoryDefinitions && localData.categoryDefinitions.length > 0) ||
                             (localData.transactions && localData.transactions.length > 0) ||
                             (localData.trips && localData.trips.length > 0);

        if (hasLocalData) {
          console.log('[LoginProScreen] Guest user with local data → App');
          localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
          localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
          navigate('/', { replace: true });
          return;
        }
      }

      // New user → First Config
      console.log('[LoginProScreen] New user → First Config');
      navigate('/onboarding/config/1', { replace: true });
    } catch (err: any) {
      console.error('[LoginProScreen] Error activating trial - FULL ERROR:', JSON.stringify(err, null, 2));
      console.error('[LoginProScreen] Error message:', err?.message);
      console.error('[LoginProScreen] Error stack:', err?.stack);
      console.error('[LoginProScreen] Error type:', typeof err);
      console.error('[LoginProScreen] Error constructor:', err?.constructor?.name);

      // Show user-friendly error modal
      const errorMessage = err?.message || err?.errorMessage || String(err) || 'Unknown error';
      let userMessage = 'No pudimos activar tu prueba gratuita de 7 días.';

      // Customize message based on error type
      if (errorMessage.includes('No offerings available') || errorMessage.includes('configuration')) {
        userMessage = 'Hubo un problema al conectar con el sistema de suscripciones. Por favor intenta de nuevo.';
      } else if (errorMessage.includes('Network') || errorMessage.includes('network')) {
        userMessage = 'No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.';
      } else if (errorMessage.includes('not found')) {
        userMessage = 'No pudimos encontrar el plan seleccionado. Por favor intenta de nuevo.';
      }

      setRevenueCatError({
        message: userMessage,
        technicalDetails: errorMessage,
      });
    }
  };

  /**
   * Maneja el login con Google OAuth
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const redirectTo = isNative() ? getOAuthRedirectUrl() : window.location.origin;
      console.log('[LoginProScreen] OAuth redirect URL:', redirectTo);

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

      console.log('[LoginProScreen] Google OAuth initiated');
    } catch (err: any) {
      console.error('[LoginProScreen] Error en Google login:', err);
      setError(err.message || t('login.errorGoogle'));
      setLoading(false);
    }
  };

  /**
   * Placeholder para Apple (próximamente)
   */
  const handleAppleComingSoon = () => {
    setError(t('login.errorApple'));
    setTimeout(() => setError(null), 3000);
  };

  // Get plan display name
  const getPlanName = () => {
    switch (selectedPlan) {
      case 'monthly':
        return t('paywall:plans.monthly');
      case 'annual':
        return t('paywall:plans.annual');
      case 'lifetime':
        return t('paywall:plans.lifetime');
      default:
        return t('paywall:plans.monthly');
    }
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header con icono de sparkles */}
      <div className="flex flex-col items-center px-6 pt-8 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
          <Sparkles size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          Activa tu prueba gratuita
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-400">
          Inicia sesión para activar <span className="font-semibold text-emerald-600 dark:text-emerald-400">{getPlanName()}</span> con 7 días de prueba gratuita
        </p>
      </div>

      {/* Features del trial */}
      <div className="mx-6 mb-8 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-50">7 días gratis</span> - Cancela cuando quieras
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-50">Sincronización en la nube</span> - Tus datos seguros
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-50">Acceso completo</span> - Todas las funciones Pro
          </p>
        </div>
      </div>

      {/* Opciones de autenticación - Solo Google y Apple */}
      <div className="flex-1 px-6 pb-8">
        <div className="space-y-3">
          {/* Google OAuth - Full width button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center gap-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-gray-900 shadow-sm">
              <Chrome className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('login.google')}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Continuar con Google</p>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
          </button>

          {/* Apple Sign In - Full width button */}
          <button
            type="button"
            onClick={handleAppleComingSoon}
            disabled={loading}
            className="flex w-full items-center gap-4 rounded-2xl bg-black p-4 shadow-lg opacity-60 transition-all active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Apple className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">{t('login.apple')}</p>
              <p className="mt-0.5 text-xs text-white/70">Continuar con Apple</p>
            </div>
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
            className="font-medium text-emerald-600 dark:text-emerald-400 underline"
          >
            {t('login.termsService')}
          </button>{' '}
          {t('login.termsAnd')}{' '}
          <button
            type="button"
            onClick={() => navigate('/legal/privacy')}
            className="font-medium text-emerald-600 dark:text-emerald-400 underline"
          >
            {t('login.termsPrivacy')}
          </button>
        </p>

        {/* Back to free option */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/onboarding/login')}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← Volver a opciones gratuitas
          </button>
        </div>
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
                  className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  Reintentar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RevenueCat Error Modal */}
      {revenueCatError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Error al activar suscripción
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {revenueCatError.message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setRevenueCatError(null);
                  // Fallback to free flow
                  const onboardingCompleted = localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';
                  if (onboardingCompleted) {
                    navigate('/', { replace: true });
                  } else {
                    navigate('/onboarding/config/1', { replace: true });
                  }
                }}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Continuar sin Pro
              </button>

              <button
                type="button"
                onClick={async () => {
                  setRevenueCatError(null);
                  // Retry OAuth callback (which includes RevenueCat activation)
                  await handleOAuthCallback();
                }}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Reintentar
              </button>
            </div>

            {/* Technical details (collapsed) */}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Detalles técnicos
              </summary>
              <p className="mt-2 rounded bg-gray-100 dark:bg-gray-800 p-2 text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                {revenueCatError.technicalDetails}
              </p>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
