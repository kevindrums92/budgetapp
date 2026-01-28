/**
 * Screen2_LimitsAndGoals
 * Pantalla 2: Límites de Gasto y Metas de Ahorro
 */

import { ChevronLeft, TrendingDown, TrendingUp } from 'lucide-react';
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

export default function Screen2_LimitsAndGoals({
  onNext,
  onBack,
  onSkip,
  showBack,
  showSkip,
  currentStep,
  totalSteps,
}: Props) {
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

        {showSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            Omitir
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        <div className="mb-6">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              Dos Tipos de Planes
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Elige entre controlar tus gastos o ahorrar para tus objetivos.
            </p>
          </SlideAnimation>
        </div>

        {/* Spending Limit Example */}
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border-2 border-red-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                <TrendingDown size={20} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-50">
                  Límite de Gasto
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mercado · Enero 2026
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: '90%' }} />
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

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Te quedan $ 10.000
            </p>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={150}>
          <div className="mb-6 flex gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
            <TrendingDown size={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" strokeWidth={2.5} />
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              Define un <strong>tope máximo</strong> de gasto para una categoría. Perfecto para controlar gastos variables como mercado, restaurantes o entretenimiento.
            </p>
          </div>
        </SlideAnimation>

        {/* Savings Goal Example */}
        <SlideAnimation direction="up" delay={200}>
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border-2 border-teal-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                <TrendingUp size={20} className="text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-50">
                  Meta de Ahorro
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vacaciones · Enero 2026
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: '67%' }} />
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

            <p className="text-xs text-teal-600 dark:text-teal-400">
              ¡Faltan $ 330.000!
            </p>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={250}>
          <div className="flex gap-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 p-4">
            <TrendingUp size={20} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              Establece un <strong>objetivo de ahorro</strong> para categorías como inversiones, fondo de emergencia o un proyecto especial.
            </p>
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
          Continuar
        </button>
      </div>
    </div>
  );
}
