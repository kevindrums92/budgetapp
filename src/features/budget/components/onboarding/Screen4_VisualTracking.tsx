/**
 * Screen4_HealthCheck
 * Pantalla 4: Health Check y seguimiento inteligente
 */

import { AlertTriangle, Target, ChevronLeft } from 'lucide-react';
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

export default function Screen4_HealthCheck({
  onNext,
  onBack,
  showBack,
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

        <div className="h-10 w-10" />
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto px-6 pt-4">
        <div className="mb-6">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              {t('onboarding.screen4.title', 'Alertas Inteligentes')}
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {t('onboarding.screen4.subtitle', 'Recibe notificaciones automáticas sobre el estado de tus planes.')}
            </p>
          </SlideAnimation>
        </div>

        {/* Health Check Banners */}
        <div className="mb-6 space-y-3">
          <SlideAnimation direction="up" delay={100}>
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3 border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {t('onboarding.screen4.limitsExceeded', '⚠️ Tienes 2 límites excedidos')}
              </p>
            </div>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={150}>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 border border-teal-200 dark:border-teal-800">
              <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
                {t('onboarding.screen4.goalsProgress', '🎯 Has completado el 75% de tus metas de ahorro')}
              </p>
            </div>
          </SlideAnimation>
        </div>

        <SlideAnimation direction="up" delay={200}>
          <div className="mb-6 flex gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" strokeWidth={2.5} />
            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">{t('onboarding.screen4.summaryTitle', 'Resumen Automático')}</p>
              <p dangerouslySetInnerHTML={{ __html: t('onboarding.screen4.summaryDescription', 'Visualiza un <strong>resumen del estado</strong> de todos tus planes activos: límites excedidos y progreso de metas.') }} />
            </div>
          </div>
        </SlideAnimation>

        {/* Intelligent Metrics Example */}
        <SlideAnimation direction="up" delay={250}>
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">
              {t('onboarding.screen4.metricsTitle', 'Métricas Inteligentes')}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('onboarding.screen4.dailySuggestion', 'Sugerencia Diaria')}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  $ 15.000
                </p>
              </div>

              <div>
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('onboarding.screen4.daysRemaining', 'Días restantes')}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  12 días
                </p>
              </div>
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={300}>
          <div className="mb-4 flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
            <Target size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">{t('onboarding.screen4.recommendationsTitle', 'Recomendaciones Personalizadas')}</p>
              <p dangerouslySetInnerHTML={{ __html: t('onboarding.screen4.recommendationsDescription', 'Recibe <strong>sugerencias diarias</strong> de cuánto gastar o ahorrar para cumplir tus objetivos según los días restantes.') }} />
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
          {t('onboarding.screen4.start', '¡Comenzar!')}
        </button>
      </div>
    </div>
  );
}
