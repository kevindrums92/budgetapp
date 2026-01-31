/**
 * RevenueCatProvider
 *
 * Initializes RevenueCat SDK and syncs subscription status.
 * Should be mounted at the root level of the app.
 *
 * Key responsibilities:
 * 1. Configure RevenueCat SDK
 * 2. Link SDK to authenticated user via Purchases.logIn()
 * 3. Fetch subscription using 3-tier fallback (RevenueCat → Supabase → localStorage)
 * 4. Update Zustand store with current subscription state
 */

import { useEffect, useState } from 'react';
import { useBudgetStore } from '@/state/budget.store';

export default function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeRevenueCat() {
      try {
        console.log('[RevenueCat] Initializing SDK...');

        const { configureRevenueCat } = await import('@/services/revenuecat.service');
        const { isNative } = await import('@/shared/utils/platform');

        // Configure SDK (anonymous mode initially)
        await configureRevenueCat();

        // Link to authenticated user if session exists
        if (isNative()) {
          try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              const { Purchases } = await import('@revenuecat/purchases-capacitor');
              await Purchases.logIn({ appUserID: user.id });
              console.log('[RevenueCat] Linked to user:', user.id);
            }
          } catch (loginError) {
            console.warn('[RevenueCat] Failed to link user (non-blocking):', loginError);
          }
        }

        // Fetch subscription using new service (RevenueCat → Supabase → localStorage)
        try {
          const { getSubscription } = await import('@/services/subscription.service');
          const { supabase } = await import('@/lib/supabaseClient');
          const { data: { user } } = await supabase.auth.getUser();

          const subscription = await getSubscription(user?.id ?? null);
          useBudgetStore.getState().setSubscription(subscription);
        } catch (subError) {
          console.warn('[RevenueCat] Failed to fetch subscription (non-blocking):', subError);
        }

        setIsInitialized(true);
        console.log('[RevenueCat] Initialization complete');
      } catch (error) {
        console.error('[RevenueCat] Initialization failed:', error);
        // Don't block the app if RevenueCat fails to initialize
        setIsInitialized(true);
      }
    }

    initializeRevenueCat();
  }, []);

  // Don't render children until initialized (prevents race conditions)
  // But also don't block forever - render after 3 seconds max
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[RevenueCat] Initialization timeout, proceeding anyway');
        setIsInitialized(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500 dark:border-gray-700 dark:border-t-emerald-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
