import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywallPurchase } from '@/hooks/usePaywallPurchase';
import PaywallModal from '@/shared/components/modals/PaywallModal';
import type { ProFeature, PaywallTrigger } from '@/constants/pricing';

type ProFeatureGateProps = {
  feature: ProFeature;
  trigger?: PaywallTrigger;
  fallback?: ReactNode;
  children: ReactNode;
};

export default function ProFeatureGate({
  feature,
  trigger = 'settings',
  fallback,
  children,
}: ProFeatureGateProps) {
  const { canUseFeature } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  // Paywall purchase handler
  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
  });

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return (
      <>
        {fallback}
        <PaywallModal
          open={showPaywall}
          onClose={() => setShowPaywall(false)}
          trigger={trigger}
          onSelectPlan={handleSelectPlan}
        />
      </>
    );
  }

  return (
    <>
      <LockedPlaceholder onUnlock={() => setShowPaywall(true)} />
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger={trigger}
        onSelectPlan={handleSelectPlan}
      />
    </>
  );
}

function LockedPlaceholder({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useTranslation('paywall');

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-100 p-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
        <Lock size={20} className="text-gray-500" />
      </div>
      <p className="mb-1 text-sm font-semibold text-gray-700">
        {t('gate.locked')}
      </p>
      <button
        type="button"
        onClick={onUnlock}
        className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98]"
      >
        {t('gate.unlock')}
      </button>
    </div>
  );
}
