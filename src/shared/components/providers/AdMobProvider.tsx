import { useEffect } from 'react';
import { initializeAdMob, checkAndResetSession, prepareInterstitial } from '@/services/ads.service';
import { useSubscription } from '@/hooks/useSubscription';

/**
 * AdMobProvider
 * Initializes AdMob SDK on app startup and manages ad session lifecycle
 */
export default function AdMobProvider({ children }: { children: React.ReactNode }) {
  const { isPro } = useSubscription();

  useEffect(() => {
    // Only initialize ads for free users
    if (isPro) {
      console.log('[AdMobProvider] User is Pro, skipping ad initialization');
      return;
    }

    async function initAds() {
      try {
        console.log('[AdMobProvider] Initializing AdMob SDK...');

        // Initialize AdMob SDK
        await initializeAdMob();

        // Check and reset session if needed (after 24 hours)
        checkAndResetSession();

        // Preload first interstitial ad
        await prepareInterstitial();

        console.log('[AdMobProvider] AdMob SDK initialized successfully');
      } catch (error) {
        console.error('[AdMobProvider] Failed to initialize AdMob:', error);
      }
    }

    initAds();
  }, [isPro]);

  return <>{children}</>;
}
