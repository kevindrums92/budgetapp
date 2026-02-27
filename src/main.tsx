import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/config"; // IMPORTANT: Import before React
import { initSentry } from "@/lib/sentry";
import App from "./App";
import "./index.css";

// Initialize Sentry early, before any React rendering
initSentry();

import { registerSW } from "virtual:pwa-register";
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { isNative, isAndroid } from '@/shared/utils/platform';

// Load PWA elements for Capacitor web support (camera modal, etc.)
defineCustomElements(window);

registerSW({
  immediate: true,
});

// Initialize Capacitor plugins (native only)
if (isNative()) {
  // Set initial status bar style
  // Edge-to-edge on both platforms: status bar overlays WebView
  // Safe area handled via CSS env(safe-area-inset-top)
  StatusBar.setOverlaysWebView({ overlay: true }).catch((err) => {
    console.error('[StatusBar] setOverlaysWebView error:', err);
  });
  StatusBar.setStyle({ style: Style.Light }).catch((err) => {
    console.error('[StatusBar] setStyle error:', err);
  });
  if (isAndroid()) {
    // Transparent status bar so app header background shows through
    StatusBar.setBackgroundColor({ color: '#00000000' }).catch((err) => {
      console.error('[StatusBar] setBackgroundColor error:', err);
    });
  }

  // Handle Android back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp();
    } else {
      window.history.back();
    }
  });

  // Handle deep links (OAuth callbacks, promo code redemption)
  CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    console.log('[DeepLink] Received URL:', url);

    // Check if this is a promo code redemption link (smartspend://redeem?code=XXXX)
    if (url.includes('/redeem') || url.includes('redeem?')) {
      try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        if (code) {
          console.log('[DeepLink] Promo code redemption:', code);
          window.dispatchEvent(new CustomEvent('redeem-promo-code', {
            detail: { code: code.trim().toUpperCase() },
          }));
        } else {
          console.warn('[DeepLink] Redeem link missing code parameter');
        }
      } catch (err) {
        console.error('[DeepLink] Error parsing redeem URL:', err);
      }
      return;
    }

    // Check if this is an OAuth callback
    if (url.includes('auth/callback') || url.includes('code=') || url.includes('access_token')) {
      try {
        // Close in-app browser IMMEDIATELY when deep link arrives.
        // The deep link means OAuth completed in the browser — close it before
        // processing the code. This prevents the browser staying open if
        // exchangeCodeForSession() deadlocks with navigator.locks (which happens
        // when linkIdentity's SIGNED_IN handler calls getSession() while the
        // code exchange still holds the lock).
        const { closeBrowser } = await import('@/shared/utils/browser.utils');
        await closeBrowser();
        console.log('[DeepLink] In-app browser closed');

        // Parse URL parameters
        const urlObj = new URL(url);

        // Check for OAuth error in callback URL (e.g., identity_already_exists from linkIdentity)
        // Note: Supabase errors have both `error` + `error_code`, but Google/OAuth errors
        // may only have `error` (e.g., interaction_required). We check `errorParam` alone.
        const errorParam = urlObj.searchParams.get('error');
        const errorCode = urlObj.searchParams.get('error_code');
        const errorDescription = urlObj.searchParams.get('error_description');

        if (errorParam) {
          console.warn(`[DeepLink] OAuth error in callback: ${errorCode || errorParam} - ${errorDescription}`);

          if (errorCode === 'identity_already_exists') {
            // The OAuth identity is already linked to another Supabase user.
            // This happens when an anonymous user tries linkIdentity() with a Google/Apple
            // account that was previously linked to a different user.
            // Solution: retry with regular signInWithOAuth (signs in as existing user).
            console.log('[DeepLink] Identity already exists, dispatching retry event');
            window.dispatchEvent(new CustomEvent('oauth-identity-exists'));
          } else {
            // Other OAuth errors — show to user
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: errorDescription?.replace(/\+/g, ' ') || errorParam,
                code: 0,
                isRetryable: true,
              }
            }));
          }
          return;
        }

        // Use existing supabase client to avoid multiple instances warning
        const { supabase } = await import('@/lib/supabaseClient');

        const code = urlObj.searchParams.get('code');
        const hashParams = new URLSearchParams(url.split('#')[1] || '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          // PKCE flow: exchange code for session
          console.log('[DeepLink] Exchanging code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[DeepLink] Error exchanging code:', error);
            // Dispatch custom event to notify UI of OAuth error
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: error.message || 'Error al conectar con Google',
                code: error.status || 0,
                isRetryable: error.name === 'AuthRetryableFetchError' || error.status === 0,
              }
            }));
          } else {
            console.log('[DeepLink] Session established successfully');
            // Don't redirect here - LoginScreen's auth listener will handle navigation
            // This prevents double navigation and allows proper data sync
          }
        } else if (accessToken && refreshToken) {
          // Implicit flow: set session directly
          console.log('[DeepLink] Setting session from tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[DeepLink] Error setting session:', error);
            // Dispatch custom event to notify UI of OAuth error
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: error.message || 'Error al configurar sesión',
                code: error.status || 0,
                isRetryable: true,
              }
            }));
          } else {
            console.log('[DeepLink] Session set successfully');
            // Don't redirect here - LoginScreen's auth listener will handle navigation
          }
        } else {
          console.warn('[DeepLink] No code or tokens found in URL');
          // Dispatch custom event for missing parameters
          window.dispatchEvent(new CustomEvent('oauth-error', {
            detail: {
              error: 'No se recibió código de autenticación',
              code: 0,
              isRetryable: true,
            }
          }));
        }
      } catch (err) {
        console.error('[DeepLink] Error processing OAuth callback:', err);
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove HTML splash screen after app renders
requestAnimationFrame(() => {
  setTimeout(() => {
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.remove();
        document.body.classList.add('app-ready');
      }, 400);
    }
  }, 800);
});
