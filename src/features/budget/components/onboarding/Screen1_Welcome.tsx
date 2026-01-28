/**
 * Screen1_Welcome
 * Pantalla 1: Bienvenida al módulo de presupuestos
 */

import { Target, DollarSign, TrendingDown, TrendingUp, ChevronLeft } from 'lucide-react';
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

export default function Screen1_Welcome({
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

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto px-6 pt-4">
        <div className="mb-8">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              Organiza tu dinero con Planes
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Crea límites de gasto y metas de ahorro para controlar tus finanzas de forma inteligente.
            </p>
          </SlideAnimation>
        </div>

        {/* Hero Icon */}
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-8 flex justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-[#18B7B0]/10">
              <Target size={64} className="text-[#18B7B0]" strokeWidth={2} />
            </div>
          </div>
        </SlideAnimation>

        {/* Feature List */}
        <div className="space-y-4 pb-4">
          <SlideAnimation direction="up" delay={150}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                  <TrendingDown size={18} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-gray-50">
                    Límites de Gasto
                  </h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 pl-12">
                Define un tope de gasto para categorías específicas y mantén tus gastos bajo control.
              </p>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={200}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                  <TrendingUp size={18} className="text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-gray-50">
                    Metas de Ahorro
                  </h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 pl-12">
                Establece objetivos de ahorro y visualiza tu progreso en tiempo real.
              </p>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={250}>
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                  <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-gray-50">
                    Seguimiento Inteligente
                  </h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 pl-12">
                Alertas automáticas, sugerencias diarias y análisis de resultados completados.
              </p>
            </div>
          </SlideAnimation>
        </div>
      </main>

      {/* CTA Button - Fixed at Bottom */}
      <div className="shrink-0 px-6 pt-4 pb-2">
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
