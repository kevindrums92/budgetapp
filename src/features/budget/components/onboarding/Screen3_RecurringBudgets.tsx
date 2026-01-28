/**
 * Screen3_HistoryAndTabs
 * Pantalla 3: Historial y tabs de activos/completados
 */

import { ChevronLeft, Clock, CheckCircle } from 'lucide-react';
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

export default function Screen3_HistoryAndTabs({
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
              Revisa tu Historial
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Filtra entre tus planes activos y completados para analizar resultados.
            </p>
          </SlideAnimation>
        </div>

        {/* Tabs Example */}
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition-all bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
            >
              <Clock size={14} strokeWidth={2.5} />
              Activos
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition-all bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <CheckCircle size={14} strokeWidth={2.5} />
              Completados
            </button>
          </div>
        </SlideAnimation>

        {/* Completed Budget Example with Summary */}
        <SlideAnimation direction="up" delay={150}>
          <div className="mb-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                <svg className="h-5 w-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-900 dark:text-gray-50 truncate block">
                  Fondo de Emergencia
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Meta de ahorro
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  1 dic - 31 dic de 2025
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full transition-all duration-300" style={{ width: '100%', backgroundColor: '#18B7B0' }} />
              </div>
            </div>

            {/* Amounts */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                  $ 550.000
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / $ 500.000
                </span>
              </div>
              <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                110%
              </span>
            </div>

            {/* Status message */}
            <p className="text-xs text-teal-600 dark:text-teal-400">
              ¡Meta alcanzada! 🎉 · Superaste por $ 50.000
            </p>
          </div>
        </SlideAnimation>

        {/* Explanation */}
        <SlideAnimation direction="up" delay={200}>
          <div className="flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
            <CheckCircle size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Resultados Detallados</p>
              <p>
                Cuando un plan termina, se muestra un <strong>resumen completo</strong>: si cumpliste la meta, respetaste el límite, o cuánto te excediste.
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
          Continuar
        </button>
      </div>
    </div>
  );
}
