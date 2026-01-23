/**
 * Screen1_Welcome
 * Pantalla 1: Bienvenido a SmartSpend
 * Primera impresión - Logo, título y features principales
 */

import { WifiOff, Shield, TrendingUp } from 'lucide-react';
import OnboardingLayout from '../../../components/OnboardingLayout';
import FeatureCard from '../../../components/FeatureCard';
import SlideAnimation, { StaggeredAnimation } from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen1_Welcome() {
  const { handleNext, handleSkip } = useOnboardingProgress();

  return (
    <OnboardingLayout
      showSkip
      onSkip={handleSkip}
      showProgress
      currentStep={1}
      totalSteps={6}
    >
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <SlideAnimation direction="down" delay={0}>
          {/* Logo */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0d9488] shadow-lg">
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
              <rect x="10" y="35" width="8" height="15" rx="2" fill="white" fillOpacity="0.9"/>
              <rect x="26" y="25" width="8" height="25" rx="2" fill="white" fillOpacity="0.9"/>
              <rect x="42" y="20" width="8" height="30" rx="2" fill="white" fillOpacity="0.9"/>
              <path d="M8 40 L22 28 L36 32 L52 14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="52" cy="14" r="3" fill="white"/>
            </svg>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={100}>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight text-gray-900">
            Bienvenido a
            <br />
            <span className="bg-gradient-to-r from-[#18B7B0] to-[#0F8580] bg-clip-text text-transparent">
              SmartSpend
            </span>
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={150}>
          <p className="mx-auto max-w-sm text-base leading-relaxed text-gray-600">
            La forma más inteligente de gestionar tus finanzas personales
          </p>
        </SlideAnimation>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <StaggeredAnimation staggerDelay={80}>
          <FeatureCard
            icon={WifiOff}
            title="Funciona sin conexión"
            description="Tus datos están en tu dispositivo, siempre disponibles"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            compact
          />

          <FeatureCard
            icon={Shield}
            title="Privacidad total"
            description="Tú decides si sincronizar o mantener todo local"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            compact
          />

          <FeatureCard
            icon={TrendingUp}
            title="Control financiero"
            description="Presupuestos, análisis y automatización en un solo lugar"
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
            compact
          />
        </StaggeredAnimation>
      </div>

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
          className="w-full rounded-2xl bg-gradient-to-r from-[#18B7B0] to-[#0F8580] py-4 text-base font-bold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
        >
          Empezar
        </button>
      </div>
    </OnboardingLayout>
  );
}
