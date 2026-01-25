/**
 * Screen3_RecurringBudgets
 * Pantalla 3: Presupuestos recurrentes
 */

import { Repeat, ChevronLeft, ShoppingCart } from 'lucide-react';
import SlideAnimation from '@/features/onboarding/components/SlideAnimation';
import ProgressDots from '@/features/onboarding/components/ProgressDots';
import { useTranslation } from 'react-i18next';

type Props = {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  showBack: boolean;
  showSkip: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
};

export default function Screen3_RecurringBudgets({
  onNext,
  onBack,
  onSkip,
  showBack,
  showSkip,
  currentStep,
  totalSteps,
}: Props) {
  const { t } = useTranslation('budget');

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Header */}
      <header className="z-10 flex shrink-0 items-center justify-between px-6 pb-2 pt-4">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Volver"
          >
            <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}

        <ProgressDots total={totalSteps} current={currentStep} />

        {showSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            {t('onboarding.skip')}
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pt-4 pb-40">
        <div className="mb-6">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              {t('onboarding.screen3.title')}
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {t('onboarding.screen3.subtitle')}
            </p>
          </SlideAnimation>
        </div>

        {/* Budget Card Example */}
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-50">{t('onboarding.screen3.exampleCategory')}</span>
                  <Repeat size={14} className="text-emerald-500 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('onboarding.screen3.examplePeriod')}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: '68%' }} />
              </div>
            </div>

            {/* Amounts */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  $ 340.000
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / $ 500.000
                </span>
              </div>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                68%
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Quedan $ 160.000
            </p>
          </div>
        </SlideAnimation>

        {/* Timeline visualization */}
        <SlideAnimation direction="up" delay={150}>
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
                1
              </div>
              <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{t('onboarding.screen3.month1')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('onboarding.screen3.month1Amount')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
                2
              </div>
              <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{t('onboarding.screen3.month2')}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('onboarding.screen3.month2Status')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
                3
              </div>
              <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{t('onboarding.screen3.month3')}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('onboarding.screen3.month3Status')}</p>
              </div>
            </div>
          </div>
        </SlideAnimation>

        {/* Info card */}
        <SlideAnimation direction="up" delay={200}>
          <div className="flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
            <Repeat size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {t('onboarding.screen3.infoText')}
            </p>
          </div>
        </SlideAnimation>
      </main>

      {/* CTA Button - Fixed Bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-gray-50 via-gray-50 dark:from-gray-950 dark:via-gray-950 to-transparent px-6 pt-8"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
        }}
      >
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
        >
          {t('onboarding.screen3.continue')}
        </button>
      </div>
    </div>
  );
}
