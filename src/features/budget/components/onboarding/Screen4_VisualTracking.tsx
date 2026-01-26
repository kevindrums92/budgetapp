/**
 * Screen4_VisualTracking
 * Pantalla 4: Seguimiento visual
 */

import { TrendingUp, ChevronLeft, AlertTriangle } from 'lucide-react';
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

export default function Screen4_VisualTracking({
  onNext,
  onBack,
  showBack,
  currentStep,
  totalSteps,
}: Props) {
  const { t } = useTranslation('budget');

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
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

        <div className="h-10 w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        <div className="mb-6">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              {t('onboarding.screen4.title')}
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {t('onboarding.screen4.subtitle')}
            </p>
          </SlideAnimation>
        </div>

        {/* Progress Example Cards */}
        <div className="mb-6 space-y-4">
          {/* Healthy Budget - 45% */}
          <SlideAnimation direction="up" delay={100}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-50">
                    {t('onboarding.screen4.exampleTransport')}
                  </span>
                </div>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  45%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: '45%' }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  $ 225.000 / $ 500.000
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('onboarding.screen4.statusGood')}
                </span>
              </div>
            </div>
          </SlideAnimation>

          {/* Warning Budget - 78% */}
          <SlideAnimation direction="up" delay={150}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-50">
                    {t('onboarding.screen4.exampleEntertainment')}
                  </span>
                </div>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  78%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: '78%' }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  $ 390.000 / $ 500.000
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {t('onboarding.screen4.statusWarning')}
                </span>
              </div>
            </div>
          </SlideAnimation>

          {/* Exceeded Budget - 105% */}
          <SlideAnimation direction="up" delay={200}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-50">
                    {t('onboarding.screen4.exampleRestaurants')}
                  </span>
                </div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  105%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  $ 525.000 / $ 500.000
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {t('onboarding.screen4.statusExceeded')}
                </span>
              </div>
            </div>
          </SlideAnimation>
        </div>

        {/* Info card */}
        <SlideAnimation direction="up" delay={250}>
          <div className="flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
            <TrendingUp size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">{t('onboarding.screen4.colorsTitle')}</p>
              <p>
                {t('onboarding.screen4.colorsDescription')}
              </p>
            </div>
          </div>
        </SlideAnimation>
      </main>

      {/* CTA Button - Fixed Bottom */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-gray-50 via-gray-50 dark:from-gray-950 dark:via-gray-950 to-transparent px-6 pt-8"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
        >
          {t('onboarding.screen4.start')}
        </button>
      </div>
    </div>
  );
}
