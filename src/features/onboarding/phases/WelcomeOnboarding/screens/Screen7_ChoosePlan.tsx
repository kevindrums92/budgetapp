/**
 * Screen7_ChoosePlan
 * Pantalla 7: Elección de Plan (Lite vs Pro)
 * Ofrece prueba gratuita de 7 días o continuar con Lite
 */

import { Crown, Check, Sparkles, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';
import SlideAnimation from '../../../components/SlideAnimation';
import PaywallModal from '@/shared/components/modals/PaywallModal';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';
import { useOnboarding } from '../../../OnboardingContext';

export default function Screen7_ChoosePlan() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { handleBack } = useOnboardingProgress();
  const { setSelectedPlan } = useOnboarding();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleProTrial = () => {
    setShowPaywall(true);
  };

  const handleLite = () => {
    // User chose free tier → clear any selected plan and go to normal login
    setSelectedPlan(null);
    console.log('[Screen7_ChoosePlan] Lite selected → Normal Login');
    navigate('/onboarding/login');
  };

  const handleSelectPlan = (planId: string) => {
    // User selected a Pro plan → save plan and go to Pro login screen
    setSelectedPlan(planId as 'monthly' | 'annual' | 'lifetime');
    console.log('[Screen7_ChoosePlan] Plan selected:', planId, '→ Pro Login');
    navigate('/onboarding/login-pro');
  };

  return (
    <FullscreenLayout
      headerLeft={
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
          aria-label="Volver"
        >
          <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
      }
      headerCenter={<ProgressDots total={7} current={7} />}
      contentClassName="pb-8"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <SlideAnimation direction="down" delay={0}>
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#18B7B0]/10">
              <Crown size={32} className="text-[#18B7B0]" />
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen7.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={100}>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen7.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Plan Options */}
      <div className="space-y-4">
        {/* Pro Trial Option */}
        <SlideAnimation direction="up" delay={150}>
          <button
            type="button"
            onClick={handleProTrial}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#18B7B0] to-[#16a39d] p-6 text-left shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
          >
            {/* Sparkle badge */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3">
              <Sparkles size={20} className="text-white" />
            </div>

            <div className="relative">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
                <Crown size={14} className="text-white" />
                <span className="text-xs font-bold text-white">
                  {t('welcome.screen7.proTrialBadge')}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-extrabold text-white">
                {t('welcome.screen7.proTrialTitle')}
              </h3>
              <p className="mb-2 text-sm leading-relaxed text-white/90">
                {t('welcome.screen7.proTrialDescription')}
              </p>

              {/* Ad-Free Note */}
              <p className="mb-4 text-xs text-white/75">
                ✨ {t('welcome.screen7.proAdFreeNote')}
              </p>

              {/* Pro Features */}
              <div className="space-y-2">
                {['unlimited', 'cloudSync', 'stats', 'notifications'].map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-white" strokeWidth={3} />
                    <span className="text-xs text-white/90">
                      {t(`welcome.screen7.features.${feature}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        </SlideAnimation>

        {/* Lite Option */}
        <SlideAnimation direction="up" delay={200}>
          <button
            type="button"
            onClick={handleLite}
            className="w-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-left shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('welcome.screen7.liteBadge')}
              </span>
            </div>

            <h3 className="mb-2 text-xl font-extrabold text-gray-900 dark:text-gray-50">
              {t('welcome.screen7.liteTitle')}
            </h3>
            <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {t('welcome.screen7.liteDescription')}
            </p>

            {/* Ads Note */}
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              {t('welcome.screen7.liteAdsNote')}
            </p>

            {/* Lite Features */}
            <div className="space-y-1.5">
              {['basicTracking', 'budgets', 'categories'].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" strokeWidth={2.5} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t(`welcome.screen7.liteFeatures.${feature}`)}
                  </span>
                </div>
              ))}
            </div>
          </button>
        </SlideAnimation>
      </div>

      {/* Disclaimer */}
      <SlideAnimation direction="up" delay={250}>
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('welcome.screen7.disclaimer')}
        </p>
      </SlideAnimation>

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="onboarding"
        onSelectPlan={handleSelectPlan}
      />
    </FullscreenLayout>
  );
}
