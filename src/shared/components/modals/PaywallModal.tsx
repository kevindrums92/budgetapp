import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Crown } from 'lucide-react';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import PricingCard from './PricingCard';
import type { PricingPlanKey, PaywallTrigger } from '@/constants/pricing';

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  trigger: PaywallTrigger;
  onSelectPlan?: (planId: string) => void;
};

const BENEFIT_KEYS = [
  'unlimitedCategories',
  'stats',
  'historyFilters',
  'export',
  'scheduled',
  'adFree',
] as const;

export default function PaywallModal({ open, onClose, trigger, onSelectPlan }: PaywallModalProps) {
  const { t } = useTranslation('paywall');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanKey>('annual');
  const [isVisible, setIsVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
      setIsPurchasing(false); // Reset on close
      setError(null); // Clear error on close
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const subtitleKey = `subtitle.${trigger}` as const;

  async function handleContinue() {
    if (isPurchasing || !onSelectPlan) return;

    setIsPurchasing(true);
    setError(null); // Clear previous errors
    try {
      await onSelectPlan(selectedPlan);
      // If successful, onSuccess callback will close the modal
    } catch (err: any) {
      console.error('[PaywallModal] Purchase failed:', err);
      console.log('[PaywallModal] Error type:', typeof err);
      console.log('[PaywallModal] Error keys:', Object.keys(err || {}));
      console.log('[PaywallModal] Error.message:', err?.message);
      console.log('[PaywallModal] Error.errorMessage:', err?.errorMessage);

      // Show error message in modal
      const errorMessage = err?.message || err?.errorMessage || 'No se pudo procesar la compra. Intenta de nuevo.';
      console.log('[PaywallModal] Setting error state:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleRestore() {
    if (isPurchasing) return;

    setIsPurchasing(true);
    setError(null); // Clear previous errors
    try {
      const { restorePurchases } = await import('@/services/revenuecat.service');
      const { isNative } = await import('@/shared/utils/platform');
      const { useBudgetStore } = await import('@/state/budget.store');

      // Link RevenueCat to user before restoring
      if (isNative()) {
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { Purchases } = await import('@revenuecat/purchases-capacitor');
            await Purchases.logIn({ appUserID: user.id });
          }
        } catch (loginError) {
          console.warn('[PaywallModal] Failed to link user for restore:', loginError);
        }
      }

      await restorePurchases();

      // Fetch subscription using new service
      const { getSubscription } = await import('@/services/subscription.service');
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user } } = await supabase.auth.getUser();
      const subscription = await getSubscription(user?.id ?? null);
      useBudgetStore.getState().setSubscription(subscription);

      // If restore was successful and user is now Pro, close modal
      onClose();
    } catch (err: any) {
      console.error('[PaywallModal] Restore failed:', err);
      setError('No se encontraron compras previas.');
    } finally {
      setIsPurchasing(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[85] transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <FullscreenLayout
        headerRight={
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Cerrar"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        }
        ctaButton={
          <button
            type="button"
            onClick={handleContinue}
            disabled={isPurchasing}
            className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPurchasing ? 'Procesando...' : t('cta.startTrial')}
          </button>
        }
      >
        {/* Crown icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#18B7B0]/10">
            <Crown size={32} className="text-[#18B7B0]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          {t('title')}
        </h1>
        <p className="mb-6 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {t(subtitleKey)}
        </p>

        {/* Benefits */}
        <div className="mb-6 space-y-3">
          {BENEFIT_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18B7B0]/10 dark:bg-[#18B7B0]/20">
                <Check size={14} className="text-[#18B7B0]" strokeWidth={3} />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{t(`benefits.${key}`)}</p>
            </div>
          ))}
        </div>

        {/* Error message - Positioned BEFORE pricing cards for visibility */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300 text-center font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Pricing cards */}
        <div className="space-y-3 pb-4">
          <PricingCard
            planKey="annual"
            selected={selectedPlan === 'annual'}
            onSelect={(plan) => {
              setSelectedPlan(plan);
              setError(null); // Clear error when changing plans
            }}
          />
          <PricingCard
            planKey="monthly"
            selected={selectedPlan === 'monthly'}
            onSelect={(plan) => {
              setSelectedPlan(plan);
              setError(null); // Clear error when changing plans
            }}
          />
          <PricingCard
            planKey="lifetime"
            selected={selectedPlan === 'lifetime'}
            onSelect={(plan) => {
              setSelectedPlan(plan);
              setError(null); // Clear error when changing plans
            }}
          />
        </div>

        {/* Restore purchases */}
        <button
          type="button"
          onClick={handleRestore}
          disabled={isPurchasing}
          className="mt-2 w-full py-2 text-center text-xs text-gray-500 dark:text-gray-400 transition-colors active:text-gray-700 dark:active:text-gray-200 disabled:opacity-50"
        >
          {isPurchasing ? 'Restaurando...' : t('cta.restore')}
        </button>
      </FullscreenLayout>
    </div>
  );
}
