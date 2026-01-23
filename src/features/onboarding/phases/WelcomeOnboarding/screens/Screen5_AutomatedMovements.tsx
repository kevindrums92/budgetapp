/**
 * Screen5_AutomatedMovements
 * Pantalla 5: Automatización de Movimientos
 * Transacciones recurrentes automáticas con timeline
 */

import React from 'react';
import { Repeat, Wifi, Calendar, CreditCard } from 'lucide-react';
import OnboardingLayout from '../../../components/OnboardingLayout';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen5_AutomatedMovements() {
  const { handleNext, handleBack, handleSkip } = useOnboardingProgress();

  return (
    <OnboardingLayout
      showBackButton
      onBack={handleBack}
      showSkip
      onSkip={handleSkip}
      showProgress
      currentStep={5}
      totalSteps={6}
    >
      {/* Header */}
      <div className="mb-6">
        <SlideAnimation direction="right" delay={0}>
          <div className="mb-4 inline-flex rounded-full bg-indigo-100 px-4 py-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Repeat size={16} strokeWidth={3} />
              Ahorra tiempo
            </span>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
            Automatiza tus
            <br />
            gastos recurrentes
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={100}>
          <p className="text-base leading-relaxed text-gray-600">
            Configura una vez, olvídate del resto. Perfecto para suscripciones y pagos fijos.
          </p>
        </SlideAnimation>
      </div>

      {/* Timeline of Recurring Transactions */}
      <div className="relative mb-6 space-y-4">
        {/* Vertical Line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-200" />

        <SlideAnimation direction="up" delay={150}>
          {/* Transaction 1 - Netflix */}
          <div className="relative flex items-start gap-4">
            <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 shadow-sm">
              <Wifi size={18} className="text-red-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1 rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Netflix</p>
                  <p className="text-xs text-gray-500">Cada 1 de mes</p>
                </div>
                <p className="font-bold text-gray-900">$ 45.000</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-600">Activo</p>
              </div>
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={200}>
          {/* Transaction 2 - Arriendo */}
          <div className="relative flex items-start gap-4">
            <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 shadow-sm">
              <Calendar size={18} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1 rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Arriendo</p>
                  <p className="text-xs text-gray-500">Cada 5 de mes</p>
                </div>
                <p className="font-bold text-gray-900">$ 800.000</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-600">Activo</p>
              </div>
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={250}>
          {/* Transaction 3 - Tarjeta */}
          <div className="relative flex items-start gap-4">
            <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 shadow-sm">
              <CreditCard size={18} className="text-purple-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1 rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Tarjeta de crédito</p>
                  <p className="text-xs text-gray-500">Cada 15 de mes</p>
                </div>
                <p className="font-bold text-gray-900">$ 250.000</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-600">Activo</p>
              </div>
            </div>
          </div>
        </SlideAnimation>
      </div>

      {/* Info callout */}
      <SlideAnimation direction="up" delay={300}>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm leading-relaxed text-gray-700">
            <span className="font-semibold text-emerald-700">Recordatorios automáticos:</span> Te avisamos antes de cada pago para que siempre estés al tanto
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
          Continuar
        </button>
      </div>
    </OnboardingLayout>
  );
}
