/**
 * usePaywallPurchase
 * Hook compartido para manejar la compra/activación de trial desde el PaywallModal
 *
 * Encapsula toda la lógica de:
 * - Obtener offerings de RevenueCat
 * - Ejecutar la compra (activar trial)
 * - Sincronizar con Zustand store
 * - Cerrar el modal automáticamente
 * - Manejo de errores
 */

import { useState, useCallback } from 'react';
import { useBudgetStore } from '@/state/budget.store';
import type { RevenueCatPackage } from '@/services/revenuecat.service';

type UsePaywallPurchaseOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function usePaywallPurchase(options?: UsePaywallPurchaseOptions) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleSelectPlan = useCallback(
    async (planId: string) => {
      console.log('[usePaywallPurchase] User selected plan:', planId);
      setIsPurchasing(true);

      try {
        // Import RevenueCat service
        const { purchasePackage, getOfferings } = await import('@/services/revenuecat.service');

        // Get offerings
        const offerings = await getOfferings();

        if (!offerings) {
          throw new Error('No offerings available');
        }

        console.log('[usePaywallPurchase] Offerings loaded:', offerings);

        // Find the selected package
        const packageToPurchase = offerings.availablePackages.find(
          (pkg: RevenueCatPackage) => pkg.identifier === planId
        );

        if (!packageToPurchase) {
          throw new Error(`Package ${planId} not found`);
        }

        // Execute purchase (activates 7-day trial)
        const purchaseResult = await purchasePackage(packageToPurchase);
        console.log('[usePaywallPurchase] Trial activated:', purchaseResult);

        // Sync subscription state with Zustand store
        const syncWithRevenueCat = useBudgetStore.getState().syncWithRevenueCat;
        await syncWithRevenueCat();
        console.log('[usePaywallPurchase] Subscription synced with store');

        // Call success callback if provided
        options?.onSuccess?.();
      } catch (error) {
        console.error('[usePaywallPurchase] Purchase failed:', error);

        // Call error callback if provided
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(errorObj);

        // Re-throw to let PaywallModal handle UI state
        throw error;
      } finally {
        setIsPurchasing(false);
      }
    },
    [options]
  );

  return {
    handleSelectPlan,
    isPurchasing,
  };
}
