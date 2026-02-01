/**
 * Screen2_FlexiblePeriods
 * Pantalla 2: Dos tipos de planes - Límites vs Metas
 */

import { TrendingDown, TrendingUp, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SlideAnimation from '@/features/onboarding/components/SlideAnimation';
import ProgressDots from '@/features/onboarding/components/ProgressDots';

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
      className="flex h-dvh flex-col bg-gray-50 dark:bg-gray-950"
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
            aria-label={t('onboarding.skip', 'Volver')}
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
            {t('onboarding.skip', 'Omitir')}
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto px-6 pt-4">
        <div className="mb-6">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              {t('onboarding.screen2.title', 'Dos Tipos de Planes')}
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {t('onboarding.screen2.subtitle', 'Elige entre controlar tus gastos o ahorrar para tus objetivos.')}
            </p>
          </SlideAnimation>
        </div>

        {/* Spending Limit Example */}
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-900/30">
                <TrendingDown size={20} className="text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-900 dark:text-gray-50 truncate block">
                  {t('onboarding.screen2.limitTitle', 'Límite de Gasto')}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('onboarding.screen2.limitCategory', 'Mercado')} · {t('onboarding.screen2.limitPeriod', 'Enero 2026')}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full transition-all duration-300" style={{ width: '90%', backgroundColor: '#EAB308' }} />
              </div>
            </div>

            {/* Amounts */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  $ 90.000
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / $ 100.000
                </span>
              </div>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                90%
              </span>
            </div>

            {/* Status message */}
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              {t('onboarding.screen2.limitRemaining', 'Te quedan $ 10.000')}
            </p>
          </div>
        </SlideAnimation>

        {/* Limit explanation */}
        <SlideAnimation direction="up" delay={150}>
          <div className="mb-6 flex gap-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <TrendingDown size={20} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <p dangerouslySetInnerHTML={{ __html: t('onboarding.screen2.limitInfo', 'Define un <strong>tope máximo</strong> de gasto para una categoría. Perfecto para controlar gastos variables como mercado, restaurantes o entretenimiento.') }} />
            </div>
          </div>
        </SlideAnimation>

        {/* Savings Goal Example */}
        <SlideAnimation direction="up" delay={200}>
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                <TrendingUp size={20} className="text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-900 dark:text-gray-50 truncate block">
                  {t('onboarding.screen2.goalTitle', 'Meta de Ahorro')}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('onboarding.screen2.goalCategory', 'Vacaciones')} · {t('onboarding.screen2.goalPeriod', 'Enero 2026')}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full transition-all duration-300" style={{ width: '67%', backgroundColor: '#18B7B0' }} />
              </div>
            </div>

            {/* Amounts */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                  $ 670.000
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / $ 1.000.000
                </span>
              </div>
              <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                67%
              </span>
            </div>

            {/* Status message */}
            <p className="text-xs text-teal-600 dark:text-teal-400">
              {t('onboarding.screen2.goalRemaining', '¡Faltan $ 330.000!')}
            </p>
          </div>
        </SlideAnimation>

        {/* Goal explanation */}
        <SlideAnimation direction="up" delay={250}>
          <div className="mb-4 flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
            <TrendingUp size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <p dangerouslySetInnerHTML={{ __html: t('onboarding.screen2.goalInfo', 'Establece un <strong>objetivo de ahorro</strong> para categorías como inversiones, fondo de emergencia o un proyecto especial.') }} />
            </div>
          </div>
        </SlideAnimation>
      </main>

      {/* CTA Button - Fixed at Bottom */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
        >
          {t('onboarding.screen2.continue', 'Continuar')}
        </button>
      </div>
    </div>
  );
}
