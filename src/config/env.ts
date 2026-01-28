/**
 * Environment configuration
 *
 * Access environment variables and detect current environment.
 */

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

// Log environment on startup (development only)
if (ENV.isDev) {
  console.log(
    `%c🏷️ Running in ${ENV.name.toUpperCase()} mode`,
    'background: #0d9488; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log(`📡 Supabase: ${ENV.supabase.url}`);
  console.log(`🔗 OAuth redirect: ${getOAuthRedirectUrl()}`);
}
