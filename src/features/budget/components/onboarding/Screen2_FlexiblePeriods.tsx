/**
 * Screen2_FlexiblePeriods
 * Pantalla 2: Períodos flexibles
 */

import { Calendar, ChevronLeft } from 'lucide-react';
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

export default function Screen2_FlexiblePeriods({
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
              {t('onboarding.screen2.title')}
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {t('onboarding.screen2.subtitle')}
            </p>
          </SlideAnimation>
        </div>

        {/* Period Options */}
        <div className="space-y-3 mb-6">
          <SlideAnimation direction="up" delay={100}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm border-2 border-emerald-500">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Calendar size={20} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-gray-50">{t('onboarding.screen2.weekTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('onboarding.screen2.weekDescription')}</p>
                </div>
              </div>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={150}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Calendar size={20} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-gray-50">{t('onboarding.screen2.monthTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('onboarding.screen2.monthDescription')}</p>
                </div>
              </div>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={200}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Calendar size={20} className="text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-gray-50">{t('onboarding.screen2.quarterTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('onboarding.screen2.quarterDescription')}</p>
                </div>
              </div>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={250}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Calendar size={20} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-gray-50">{t('onboarding.screen2.yearTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('onboarding.screen2.yearDescription')}</p>
                </div>
              </div>
            </div>
          </SlideAnimation>
        </div>

        {/* Info card */}
        <SlideAnimation direction="up" delay={300}>
          <div className="flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
            <Calendar size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {t('onboarding.screen2.example')}
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
          {t('onboarding.screen2.continue')}
        </button>
      </div>
    </div>
  );
}
