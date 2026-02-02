/**
 * AdMob Ads Service
 * Manages interstitial ad frequency, session tracking, and display logic
 */

import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import type { AdPlacement, AdSession, AdFrequencyConfig, AdConfig } from '@/types/ads.types';

const AD_SESSION_KEY = 'budget.adSession.v1';

/**
 * Default frequency configuration
 * - Min 3 minutes between ads
 * - Max 5 ads per session
 * - 2 minute initial delay
 * - Show ad every 3 actions
 */
const DEFAULT_FREQUENCY_CONFIG: AdFrequencyConfig = {
  minTimeBetweenAds: 3 * 60 * 1000, // 3 minutes in ms
  maxAdsPerSession: 5,
  initialDelay: 2 * 60 * 1000, // 2 minutes in ms
  actionsBeforeAd: 3,
};

/**
 * AdMob configuration (iOS and Android)
 * Production Ad Unit IDs
 */
const AD_CONFIG: Record<'ios' | 'android', AdConfig> = {
  ios: {
    appId: 'ca-app-pub-1664291794679786~7314308108',
    interstitialAdUnitId: 'ca-app-pub-1664291794679786/7310438677',
    rewardedAdUnitId: 'ca-app-pub-1664291794679786/4381023000',
    useTestAds: false,
  },
  android: {
    appId: 'ca-app-pub-1664291794679786~3525498108',
    interstitialAdUnitId: 'ca-app-pub-1664291794679786/3166405455',
    rewardedAdUnitId: 'ca-app-pub-1664291794679786/1853323788',
    useTestAds: false,
  },
};

let frequencyConfig: AdFrequencyConfig = DEFAULT_FREQUENCY_CONFIG;
let currentSession: AdSession | null = null;

/**
 * Initialize AdMob SDK
 * Must be called on app startup (before showing ads)
 */
export async function initializeAdMob(): Promise<void> {
  try {
    const platform = getPlatform();
    const config = AD_CONFIG[platform];

    await AdMob.initialize({
      testingDevices: config.useTestAds ? ['290f243bf9a3bd79a754a7fc31512dda'] : undefined,
      initializeForTesting: config.useTestAds,
    });

    console.log('[AdMob] SDK initialized successfully');
  } catch (error) {
    console.error('[AdMob] Failed to initialize:', error);
  }
}

/**
 * Get current platform (iOS or Android)
 */
function getPlatform(): 'ios' | 'android' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'ios';
  }
  return 'android';
}

/**
 * Get current ad session from localStorage
 */
function getSession(): AdSession {
  if (currentSession) return currentSession;

  try {
    const stored = localStorage.getItem(AD_SESSION_KEY);
    if (stored) {
      currentSession = JSON.parse(stored);
      return currentSession!;
    }
  } catch {
    // Invalid JSON, create new session
  }

  // Create new session
  currentSession = {
    startedAt: Date.now(),
    lastAdShown: 0,
    adsShownCount: 0,
    actionCount: 0,
  };

  saveSession();
  return currentSession;
}

/**
 * Save session to localStorage
 */
function saveSession(): void {
  if (!currentSession) return;
  try {
    localStorage.setItem(AD_SESSION_KEY, JSON.stringify(currentSession));
  } catch {
    console.warn('[AdMob] Failed to save session');
  }
}

/**
 * Reset session (call this on app startup or after 24h)
 */
export function resetSession(): void {
  currentSession = {
    startedAt: Date.now(),
    lastAdShown: 0,
    adsShownCount: 0,
    actionCount: 0,
  };
  saveSession();
  console.log('[AdMob] Session reset');
}

/**
 * Update frequency configuration
 */
export function setFrequencyConfig(config: Partial<AdFrequencyConfig>): void {
  frequencyConfig = { ...frequencyConfig, ...config };
  console.log('[AdMob] Frequency config updated:', frequencyConfig);
}

/**
 * Check if ad can be shown based on frequency rules
 */
function canShowAd(placement: AdPlacement): boolean {
  const session = getSession();
  const now = Date.now();

  // Check if session just started (initial delay)
  const timeSinceSessionStart = now - session.startedAt;
  if (timeSinceSessionStart < frequencyConfig.initialDelay) {
    console.log('[AdMob] Too soon since session start:', timeSinceSessionStart);
    return false;
  }

  // Check max ads per session
  if (session.adsShownCount >= frequencyConfig.maxAdsPerSession) {
    console.log('[AdMob] Max ads per session reached:', session.adsShownCount);
    return false;
  }

  // Check minimum time between ads
  const timeSinceLastAd = now - session.lastAdShown;
  if (session.lastAdShown > 0 && timeSinceLastAd < frequencyConfig.minTimeBetweenAds) {
    console.log('[AdMob] Too soon since last ad:', timeSinceLastAd);
    return false;
  }

  // Check action count
  if (session.actionCount < frequencyConfig.actionsBeforeAd) {
    console.log('[AdMob] Not enough actions:', session.actionCount);
    return false;
  }

  console.log('[AdMob] Ad can be shown at placement:', placement);
  return true;
}

/**
 * Increment action count (call after user performs an action)
 */
export function trackAction(): void {
  const session = getSession();
  session.actionCount++;
  saveSession();
  console.log('[AdMob] Action tracked, count:', session.actionCount);
}

/**
 * Prepare interstitial ad (preload)
 */
export async function prepareInterstitial(): Promise<void> {
  try {
    const platform = getPlatform();
    const config = AD_CONFIG[platform];

    await AdMob.prepareInterstitial({
      adId: config.interstitialAdUnitId,
    });

    console.log('[AdMob] Interstitial ad prepared');
  } catch (error) {
    console.error('[AdMob] Failed to prepare interstitial:', error);
  }
}

/**
 * Show interstitial ad if frequency rules allow
 * @param placement - Where the ad is being shown
 * @returns true if ad was shown, false otherwise
 */
export async function maybeShowInterstitial(placement: AdPlacement): Promise<boolean> {
  if (!canShowAd(placement)) {
    return false;
  }

  try {
    // Show the ad
    await AdMob.showInterstitial();

    // Update session
    const session = getSession();
    session.lastAdShown = Date.now();
    session.adsShownCount++;
    session.actionCount = 0; // Reset action count
    saveSession();

    console.log('[AdMob] Interstitial ad shown at placement:', placement);

    // Preload next ad
    prepareInterstitial();

    return true;
  } catch (error) {
    console.error('[AdMob] Failed to show interstitial:', error);
    return false;
  }
}

/**
 * Prepare rewarded video ad (preload)
 */
export async function prepareRewardedVideo(): Promise<void> {
  try {
    const platform = getPlatform();
    const config = AD_CONFIG[platform];

    await AdMob.prepareRewardVideoAd({
      adId: config.rewardedAdUnitId,
    });

    console.log('[AdMob] Rewarded video ad prepared');
  } catch (error) {
    console.error('[AdMob] Failed to prepare rewarded video:', error);
  }
}

/**
 * Show rewarded video ad (always allowed, user-initiated)
 * @returns Reward item if user completed the video, null otherwise
 */
export async function showRewardedVideo(): Promise<AdMobRewardItem | null> {
  try {
    const result = await AdMob.showRewardVideoAd();

    console.log('[AdMob] Rewarded video result:', result);

    // Preload next rewarded video
    prepareRewardedVideo();

    return result as AdMobRewardItem | null;
  } catch (error) {
    console.error('[AdMob] Failed to show rewarded video:', error);
    return null;
  }
}

/**
 * Show banner ad at bottom of screen
 */
export async function showBanner(): Promise<void> {
  try {
    const options: BannerAdOptions = {
      adId: 'ca-app-pub-1664291794679786/4688144765', // Production Banner ID
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };

    await AdMob.showBanner(options);
  } catch (error) {
    console.error('[AdMob] Failed to show banner:', error);
  }
}

/**
 * Hide banner ad
 */
export async function hideBanner(): Promise<void> {
  try {
    await AdMob.hideBanner();
    console.log('[AdMob] Banner ad hidden');
  } catch (error) {
    console.error('[AdMob] Failed to hide banner:', error);
  }
}

/**
 * Remove banner ad
 */
export async function removeBanner(): Promise<void> {
  try {
    await AdMob.removeBanner();
    console.log('[AdMob] Banner ad removed');
  } catch (error) {
    console.error('[AdMob] Failed to remove banner:', error);
  }
}

/**
 * Get current session stats (for debugging/analytics)
 */
export function getSessionStats(): AdSession {
  return { ...getSession() };
}

/**
 * Check if session should be reset (after 24 hours)
 * Call this on app startup
 */
export function checkAndResetSession(): void {
  const session = getSession();
  const now = Date.now();
  const sessionAge = now - session.startedAt;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (sessionAge > ONE_DAY) {
    console.log('[AdMob] Session expired, resetting');
    resetSession();
  }
}
