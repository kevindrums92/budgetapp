import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Gift } from 'lucide-react';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import PromoCodeSheet from './PromoCodeSheet';
import type { PaywallTrigger } from '@/constants/pricing';
import { PRICING_PLANS } from '@/constants/pricing';
import { openLegalPage } from '@/shared/utils/browser.utils';

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  trigger: PaywallTrigger;
  onSelectPlan?: (planId: string) => void;
  initialPromoCode?: string;
};

const BENEFIT_KEYS = [
  'adFree',
  'aiBatchEntry',
] as const;

export default function PaywallModal({ open, onClose, trigger, onSelectPlan, initialPromoCode = '' }: PaywallModalProps) {
  const { t, i18n } = useTranslation('paywall');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isVisible, setIsVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromoSheet, setShowPromoSheet] = useState(false);

  const isAnnual = selectedPlan === 'annual';
  const currentPlan = PRICING_PLANS[selectedPlan];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setIsVisible(true));
      if (initialPromoCode) {
        setShowPromoSheet(true);
      }
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
      setIsPurchasing(false);
      setError(null);
      setShowPromoSheet(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, initialPromoCode]);

  if (!open) return null;

  async function handleContinue() {
    if (isPurchasing || !onSelectPlan) return;

    setIsPurchasing(true);
    setError(null);
    try {
      await onSelectPlan(selectedPlan);
      onClose();
    } catch (err: any) {
      console.error('[PaywallModal] Purchase failed:', err);
      const errorMessage = err?.message || err?.errorMessage || 'No se pudo procesar la compra. Intenta de nuevo.';
      setError(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleRestore() {
    if (isPurchasing) return;

    setIsPurchasing(true);
    setError(null);
    try {
      const { restorePurchases } = await import('@/services/revenuecat.service');
      const { isNative } = await import('@/shared/utils/platform');
      const { useBudgetStore } = await import('@/state/budget.store');

      if (isNative()) {
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { Purchases } = await import('@revenuecat/purchases-capacitor');
            await Purchases.logIn({ appUserID: user.id });
          }
        } catch (loginError) {
          console.debug('[PaywallModal] Failed to link user for restore:', loginError);
        }
      }

      await restorePurchases();

      const { getSubscription } = await import('@/services/subscription.service');
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user } } = await supabase.auth.getUser();
      const subscription = await getSubscription(user?.id ?? null);
      useBudgetStore.getState().setSubscription(subscription);

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
        contentClassName="flex flex-col"
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
          <>
            {/* Promo Code Button */}
            <button
              type="button"
              onClick={() => setShowPromoSheet(true)}
              disabled={isPurchasing}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 py-3.5 text-sm font-medium text-gray-900 transition-colors active:bg-gray-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:active:bg-gray-800"
            >
              <Gift className="h-4 w-4 text-[#18B7B0]" />
              {t('promoCode.link')}
            </button>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={isPurchasing}
              className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPurchasing ? 'Procesando...' : t('cta.startTrial')}
            </button>
          </>
        }
      >
        {/* App Logo + Title */}
        <div className="mb-6 text-center">
          <img
            src="/icons/icon-96.png"
            alt="SmartSpend"
            className="mx-auto mb-4 h-16 w-16 rounded-2xl"
          />
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(`subtitle.${trigger}`)}
          </p>
        </div>

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

        {/* Toggle Selector */}
        <div className="relative mx-auto mb-8 flex w-full max-w-[280px] items-center rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-800 dark:bg-gray-900">
          <div
            className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out dark:bg-gray-800"
            style={{ transform: isAnnual ? 'translateX(calc(100% + 0px))' : 'translateX(0)' }}
          />
          <button
            type="button"
            onClick={() => { setSelectedPlan('monthly'); setError(null); }}
            className={`relative z-10 flex-1 py-2.5 text-sm font-medium transition-colors ${
              !isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-400'
            }`}
          >
            {t('plans.monthly')}
          </button>
          <button
            type="button"
            onClick={() => { setSelectedPlan('annual'); setError(null); }}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
              isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-400'
            }`}
          >
            {t('plans.annual')}
            <span className="rounded-full bg-[#18B7B0]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#18B7B0]">
              -{PRICING_PLANS.annual.savingsPercent}%
            </span>
          </button>
        </div>

        {/* Price Display */}
        <div className="mb-8 text-center">
          <div className="mb-1 flex items-end justify-center gap-1">
            <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
              ${currentPlan.price}
            </span>
            <span className="pb-1 font-medium text-gray-500 dark:text-gray-400">
              {isAnnual ? t('plans.perYear') : t('plans.perMonth')}
            </span>
          </div>
          {isAnnual && currentPlan.monthlyEquivalent && (
            <p className="text-sm text-[#18B7B0]">
              {t('equivalentMonthly', { price: currentPlan.monthlyEquivalent.toFixed(2) })}
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-center text-sm font-medium text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Bottom section - pushed down via mt-auto */}
        <div className="mt-auto pt-2">
          {/* Restore Purchases */}
          <div className="flex justify-center pb-4">
            <button
              type="button"
              onClick={handleRestore}
              disabled={isPurchasing}
              className="text-sm font-medium text-gray-500 underline decoration-gray-400 underline-offset-4 transition-colors active:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:decoration-gray-600 dark:active:text-white"
            >
              {isPurchasing ? 'Restaurando...' : t('cta.restore')}
            </button>
          </div>

          {/* Legal Links - Required by Apple */}
          <p className="px-2 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-500">
            {t('legal.text')}{' '}
            <button
              type="button"
              onClick={() => {
                const locale = i18n.language || 'es';
                openLegalPage('terms', locale);
              }}
              className="text-[#18B7B0] underline"
            >
              {t('legal.terms')}
            </button>
            {' '}{t('legal.and')}{' '}
            <button
              type="button"
              onClick={() => {
                const locale = i18n.language || 'es';
                openLegalPage('privacy', locale);
              }}
              className="text-[#18B7B0] underline"
            >
              {t('legal.privacy')}
            </button>.
          </p>

          {/* Auto-renewal disclaimer - Required by Apple Guideline 3.1.2 */}
          <p className="mt-3 px-2 text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
            {t('legal.autoRenew')}
          </p>
        </div>
      </FullscreenLayout>

      {/* Promo Code Bottom Sheet */}
      <PromoCodeSheet
        open={showPromoSheet}
        onClose={() => setShowPromoSheet(false)}
        onSuccess={() => {
          setShowPromoSheet(false);
          onClose();
        }}
        initialCode={initialPromoCode}
      />
    </div>
  );
}
