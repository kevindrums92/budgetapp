/**
 * Screen1_Welcome
 * Pantalla 1: Bienvenida al módulo de presupuestos
 */

import { Target, ChevronLeft } from 'lucide-react';
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

export default function Screen1_Welcome({
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
        <div className="mb-8">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              {t('onboarding.screen1.title')}
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {t('onboarding.screen1.subtitle')}
            </p>
          </SlideAnimation>
        </div>

        {/* Hero Icon */}
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-8 flex justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-900/30">
              <Target size={64} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
            </div>
          </div>
        </SlideAnimation>

        {/* Feature List */}
        <div className="space-y-4">
          <SlideAnimation direction="up" delay={150}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-gray-900 dark:text-gray-50">
                {t('onboarding.screen1.feature1Title')}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('onboarding.screen1.feature1Description')}
              </p>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={200}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-gray-900 dark:text-gray-50">
                {t('onboarding.screen1.feature2Title')}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('onboarding.screen1.feature2Description')}
              </p>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={250}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-gray-900 dark:text-gray-50">
                {t('onboarding.screen1.feature3Title')}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('onboarding.screen1.feature3Description')}
              </p>
            </div>
          </SlideAnimation>
        </div>
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
          {t('onboarding.screen1.continue')}
        </button>
      </div>
    </div>
  );
}
