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

import { useEffect } from 'react';
import { useBudgetStore } from '@/state/budget.store';
import { getStoredSession } from '@/shared/utils/offlineSession';

export default function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function initializeRevenueCat() {
      try {
        console.log('[RevenueCat] Initializing SDK...');

        const { configureRevenueCat } = await import('@/services/revenuecat.service');
        const { isNative } = await import('@/shared/utils/platform');

        // Configure SDK (anonymous mode initially)
        await configureRevenueCat();

        // Link to authenticated user if session exists (offline-safe: read from localStorage)
        if (isNative()) {
          try {
            const stored = getStoredSession();
            if (stored) {
              const { Purchases } = await import('@revenuecat/purchases-capacitor');
              await Purchases.logIn({ appUserID: stored.userId });
              console.log('[RevenueCat] Linked to user:', stored.userId);
            }
          } catch (loginError) {
            console.warn('[RevenueCat] Failed to link user (non-blocking):', loginError);
          }
        }

        // Fetch subscription using service (RevenueCat → Supabase → localStorage fallback)
        try {
          const { getSubscription } = await import('@/services/subscription.service');
          const stored = getStoredSession();
          const subscription = await getSubscription(stored?.userId ?? null);
          useBudgetStore.getState().setSubscription(subscription);
        } catch (subError) {
          console.warn('[RevenueCat] Failed to fetch subscription (non-blocking):', subError);
        }

        console.log('[RevenueCat] Initialization complete');
      } catch (error) {
        console.error('[RevenueCat] Initialization failed:', error);
      }
    }

    initializeRevenueCat();
  }, []);

  // NEVER block children - render immediately.
  // RevenueCat/subscription loading happens in background.
  // This is critical for offline-first: the app must render instantly.
  return <>{children}</>;
}
