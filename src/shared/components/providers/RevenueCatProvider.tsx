/**
 * RevenueCatProvider
 *
 * Initializes RevenueCat SDK and syncs subscription status with Zustand store.
 * Should be mounted at the root level of the app.
 */

import { useEffect, useState } from 'react';
import { useBudgetStore } from '@/state/budget.store';

export default function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const syncWithRevenueCat = useBudgetStore((s) => s.syncWithRevenueCat);

  useEffect(() => {
    async function initializeRevenueCat() {
      try {
        console.log('[RevenueCat] Initializing SDK...');

        const { configureRevenueCat } = await import('@/services/revenuecat.service');

        // Configure SDK (using anonymous ID for now)
        // In production with auth, pass userId here
        await configureRevenueCat();

        // Sync current subscription status
        await syncWithRevenueCat();

        setIsInitialized(true);
        console.log('[RevenueCat] Initialization complete');
      } catch (error) {
        console.error('[RevenueCat] Initialization failed:', error);
        // Don't block the app if RevenueCat fails to initialize
        setIsInitialized(true);
      }
    }

    initializeRevenueCat();
  }, [syncWithRevenueCat]);

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
