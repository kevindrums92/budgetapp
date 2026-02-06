/**
 * OAuth utilities for in-app browser authentication
 * Uses Safari View Controller on iOS, Chrome Custom Tabs on Android
 */

import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabaseClient';
import { isNative } from './platform';
import { getOAuthRedirectUrl } from '@/config/env';

/**
 * Sign in with OAuth provider using in-app browser (native) or standard flow (web)
 *
 * @param provider - OAuth provider ('google' | 'apple')
 * @param options - Additional OAuth options
 */
export async function signInWithOAuthInAppBrowser(
  provider: 'google' | 'apple',
  options?: {
    queryParams?: Record<string, string>;
  }
): Promise<{ error: Error | null }> {
  try {
    const redirectTo = isNative() ? getOAuthRedirectUrl() : window.location.origin;
    console.log(`[OAuth] Starting ${provider} OAuth with redirect:`, redirectTo);

    if (isNative()) {
      // Native: Use in-app browser with manual flow
      // 1. Get OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: options?.queryParams,
          skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      console.log(`[OAuth] Opening ${provider} OAuth in in-app browser`);

      // 2. Open OAuth URL in in-app browser (Safari View Controller / Chrome Custom Tabs)
      await Browser.open({
        url: data.url,
        presentationStyle: 'fullscreen',
        // This will open Safari View Controller on iOS or Chrome Custom Tabs on Android
        // User authenticates there, then gets redirected back to app via deep link
      });

      // 3. Auth callback will be handled by App.tsx deep link listener
      // which calls supabase.auth.getSession() to complete the flow

      return { error: null };
    } else {
      // Web: Use standard OAuth flow (opens in new tab/popup)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: options?.queryParams,
        },
      });

      return { error: error || null };
    }
  } catch (err: any) {
    console.error(`[OAuth] ${provider} OAuth error:`, err);
    return { error: err };
  }
}
