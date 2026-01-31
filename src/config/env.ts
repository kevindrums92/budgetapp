/**
 * Environment configuration
 *
 * Access environment variables and detect current environment.
 */

import { Capacitor } from '@capacitor/core';

export const ENV = {
  // Current environment name
  name: import.meta.env.VITE_ENV || 'development',

  // Environment checks
  isDev: import.meta.env.VITE_ENV === 'development',
  isProd: import.meta.env.VITE_ENV === 'production',

  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // RevenueCat configuration
  revenuecat: {
    ios: {
      dev: import.meta.env.VITE_REVENUECAT_IOS_API_KEY_DEV || '',
      prod: import.meta.env.VITE_REVENUECAT_IOS_API_KEY_PROD || '',
    },
    android: {
      dev: import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY_DEV || '',
      prod: import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY_PROD || '',
    },
  },
};

/**
 * Get OAuth redirect URL for deep linking
 *
 * Returns the correct URL scheme based on environment:
 * - DEV: smartspend-dev://auth/callback
 * - PROD: smartspend://auth/callback
 *
 * This ensures OAuth callbacks open the correct app instance.
 */
export function getOAuthRedirectUrl(): string {
  return ENV.isDev ? 'smartspend-dev://auth/callback' : 'smartspend://auth/callback';
}

/**
 * Get RevenueCat API key based on platform and environment
 *
 * Returns the correct API key for:
 * - iOS Dev: appl_xxxxxxxxxxxxxxxx (dev)
 * - iOS Prod: appl_xxxxxxxxxxxxxxxx (prod)
 * - Android Dev: goog_xxxxxxxxxxxxxxxx (dev)
 * - Android Prod: goog_xxxxxxxxxxxxxxxx (prod)
 *
 * Returns empty string for web (uses mock).
 */
export function getRevenueCatApiKey(): string {
  const platform = Capacitor.getPlatform();

  // Web uses mock, no API key needed
  if (platform === 'web') {
    return '';
  }

  // Get API key based on platform and environment
  if (platform === 'ios') {
    return ENV.isDev ? ENV.revenuecat.ios.dev : ENV.revenuecat.ios.prod;
  }

  if (platform === 'android') {
    return ENV.isDev ? ENV.revenuecat.android.dev : ENV.revenuecat.android.prod;
  }

  // Unknown platform
  console.warn(`[ENV] Unknown platform: ${platform}, using mock RevenueCat`);
  return '';
}

// Log environment on startup (development only)
if (ENV.isDev) {
  console.log(
    `%c🏷️ Running in ${ENV.name.toUpperCase()} mode`,
    'background: #0d9488; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log(`📡 Supabase: ${ENV.supabase.url}`);
  console.log(`🔗 OAuth redirect: ${getOAuthRedirectUrl()}`);

  const rcApiKey = getRevenueCatApiKey();
  if (rcApiKey) {
    console.log(`💰 RevenueCat: Configured (${Capacitor.getPlatform()} ${ENV.isDev ? 'DEV' : 'PROD'})`);
  } else {
    console.log(`💰 RevenueCat: Using mock (web or missing API key)`);
  }
}
