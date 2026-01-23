/**
 * Screen3_BudgetsCalm
 * Pantalla 3: Presupuestos Tranquilos
 * Gestión de presupuestos sin estrés con categorías
 */

import { Coffee, ShoppingBag, Home, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OnboardingLayout from '../../../components/OnboardingLayout';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen3_BudgetsCalm() {
  const { t } = useTranslation('onboarding');
  const { handleNext, handleBack, handleSkip } = useOnboardingProgress();

  return (
    <OnboardingLayout
      showBackButton
      onBack={handleBack}
      showSkip
      onSkip={handleSkip}
      showProgress
      currentStep={3}
      totalSteps={6}
    >
      {/* Header */}
      <div className="mb-6">
        <SlideAnimation direction="right" delay={0}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
            {t('welcome.screen3.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <p className="text-base leading-relaxed text-gray-600">
            {t('welcome.screen3.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Category Cards Example */}
      <div className="mb-6 space-y-3">
        <SlideAnimation direction="up" delay={100}>
          {/* Alimentación */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
                  <Coffee size={20} className="text-orange-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('welcome.screen3.categoryFood')}</p>
                  <p className="text-xs text-gray-500">$ 245.000 de $ 400.000</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600">61%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[61%] rounded-full bg-emerald-500" />
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={150}>
          {/* Compras */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                  <ShoppingBag size={20} className="text-purple-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('welcome.screen3.categoryShop')}</p>
                  <p className="text-xs text-gray-500">$ 180.000 de $ 200.000</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-600">90%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[90%] rounded-full bg-amber-500" />
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={200}>
          {/* Hogar */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                  <Home size={20} className="text-blue-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('welcome.screen3.categoryHome')}</p>
                  <p className="text-xs text-gray-500">$ 320.000 de $ 500.000</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600">64%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[64%] rounded-full bg-emerald-500" />
            </div>
          </div>
        </SlideAnimation>
      </div>

      {/* Info card */}
      <SlideAnimation direction="up" delay={250}>
        <div className="flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
          <TrendingDown size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
          <p className="text-sm leading-relaxed text-gray-700">
            {t('welcome.screen3.alertNote')}
          </p>
        </div>
      </SlideAnimation>

      {/* CTA Button - Fixed Bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent px-6 pt-8"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-2xl bg-gray-900 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
        >
          {t('welcome.screen3.continue')}
        </button>
      </div>
    </OnboardingLayout>
  );
}
