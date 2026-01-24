/**
 * Screen4_HabitsAnalysis
 * Pantalla 4: Análisis de Hábitos
 * Visualización de patrones de gasto con gráficas
 */

import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OnboardingLayout from '../../../components/OnboardingLayout';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen4_HabitsAnalysis() {
  const { t } = useTranslation('onboarding');
  const { handleNext, handleBack, handleSkip } = useOnboardingProgress();

  return (
    <OnboardingLayout
      showBackButton
      onBack={handleBack}
      showSkip
      onSkip={handleSkip}
      showProgress
      currentStep={4}
      totalSteps={6}
    >
      {/* Header */}
      <div className="mb-6">
        <SlideAnimation direction="right" delay={0}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen4.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen4.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Chart Example */}
      <SlideAnimation direction="up" delay={100}>
        <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          {/* Chart Title */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('welcome.screen4.chartTitle')}</p>
            <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1">
              <TrendingUp size={12} className="text-emerald-600" strokeWidth={3} />
              <span className="text-xs font-bold text-emerald-600">-12%</span>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="mb-3 flex h-32 items-end justify-between gap-2">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[#18B7B0] to-[#18B7B0]/70" style={{ height: `${height}%` }} />
                <span className="text-[10px] text-gray-400">
                  {[t('welcome.screen4.dayMon'), t('welcome.screen4.dayTue'), t('welcome.screen4.dayWed'), t('welcome.screen4.dayThu'), t('welcome.screen4.dayFri'), t('welcome.screen4.daySat'), t('welcome.screen4.daySun')][i]}
                </span>
              </div>
            ))}
          </div>

          {/* Chart Stats */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen4.avgDaily')}</p>
              <p className="font-bold text-gray-900 dark:text-gray-50">$ 45.000</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen4.weeklyTotal')}</p>
              <p className="font-bold text-gray-900 dark:text-gray-50">$ 315.000</p>
            </div>
          </div>
        </div>
      </SlideAnimation>

      {/* Insights Cards */}
      <div className="space-y-3">
        <SlideAnimation direction="up" delay={150}>
          <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
              <Calendar size={18} className="text-purple-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen4.insight1Title')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.screen4.insight1Desc')}</p>
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={200}>
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <DollarSign size={18} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen4.insight2Title')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.screen4.insight2Desc')}</p>
            </div>
          </div>
        </SlideAnimation>
      </div>

      {/* CTA Button - Fixed Bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-gray-50 via-gray-50 dark:from-gray-950 dark:via-gray-950 to-transparent px-6 pt-8"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-2xl bg-gray-900 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
        >
          {t('welcome.screen4.continue')}
        </button>
      </div>
    </OnboardingLayout>
  );
}
