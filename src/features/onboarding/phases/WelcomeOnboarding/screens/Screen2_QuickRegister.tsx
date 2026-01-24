/**
 * Screen2_QuickRegister
 * Pantalla 2: Registro Instantáneo
 * Explicación de registro rápido y seguro
 */

import { Zap, Lock, Mail, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OnboardingLayout from '../../../components/OnboardingLayout';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen2_QuickRegister() {
  const { t } = useTranslation('onboarding');
  const { handleNext, handleBack, handleSkip } = useOnboardingProgress();

  return (
    <OnboardingLayout
      showBackButton
      onBack={handleBack}
      showSkip
      onSkip={handleSkip}
      showProgress
      currentStep={2}
      totalSteps={6}
    >
      {/* Header */}
      <div className="mb-8">
        <SlideAnimation direction="right" delay={0}>
          <div className="mb-4 inline-flex rounded-full bg-amber-100 px-4 py-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <Zap size={16} strokeWidth={3} />
              {t('welcome.screen2.badge')}
            </span>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen2.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={100}>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen2.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Visual Form Preview */}
      <SlideAnimation direction="up" delay={150}>
        <div className="mb-6 space-y-3 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-lg">
          {/* Email Field */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
            <Mail size={20} className="text-gray-400" />
            <div className="flex-1">
              <div className="h-2 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white dark:bg-gray-900" />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
            <Lock size={20} className="text-gray-400" />
            <div className="flex-1">
              <div className="h-2 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white dark:bg-gray-900" />
            </div>
          </div>

          {/* Name Field */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
            <User size={20} className="text-gray-400" />
            <div className="flex-1">
              <div className="h-2 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
          </div>
        </div>
      </SlideAnimation>

      {/* Security Features */}
      <SlideAnimation direction="up" delay={200}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen2.feature1Title')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.screen2.feature1Desc')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen2.feature2Title')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.screen2.feature2Desc')}</p>
            </div>
          </div>
        </div>
      </SlideAnimation>

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
          {t('welcome.screen2.continue')}
        </button>
      </div>
    </OnboardingLayout>
  );
}
