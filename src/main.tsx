import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/config"; // IMPORTANT: Import before React
import { initSentry, captureError } from "@/lib/sentry";
import App from "./App";
import "./index.css";

// Initialize Sentry early, before any React rendering
initSentry();

// Global error handlers — catch errors that escape React ErrorBoundary
window.addEventListener('unhandledrejection', (event) => {
  captureError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    { type: 'unhandledRejection' }
  );
});

window.addEventListener('error', (event) => {
  // Skip errors already caught by React ErrorBoundary
  if (event.error) {
    captureError(event.error, { type: 'globalError', message: event.message });
  }
});

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
    // On Android edge-to-edge, env(safe-area-inset-*) may not include system bars
    // (only display cutouts). Set CSS variables as fallback.
    // 24px = standard status bar height (24dp), 48px = 3-button nav bar (48dp).
    document.documentElement.style.setProperty('--sat-android', '40px');
    document.documentElement.style.setProperty('--sab-android', '48px');
  }

  // Handle Android back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp();
    } else {
      window.history.back();
    }
  });

  // ── Deep link handler (shared between appUrlOpen and getLaunchUrl) ──
  async function handleDeepLink(url: string) {
    console.log('[DeepLink] Processing URL:', url);

    // Check if this is a batch entry link (smartspend://batch?text=...)
    if (url.includes('/batch?') || url.includes('/batch')) {
      try {
        const urlObj = new URL(url);
        const text = urlObj.searchParams.get('text');
        if (text) {
          console.log('[DeepLink] Batch entry text:', text);
          // Store in localStorage as fallback (in case React hasn't mounted yet)
          localStorage.setItem('pendingBatchText', text);
          // Also dispatch event for immediate handling
          window.dispatchEvent(new CustomEvent('batch-entry-text', {
            detail: { text },
          }));
        } else {
          console.warn('[DeepLink] Batch link missing text parameter');
        }
      } catch (err) {
        console.error('[DeepLink] Error parsing batch URL:', err);
        captureError(err, { context: 'deepLink.batch', url });
      }
      return;
    }

    // Check if this is an assistant link (smartspend://assistant?mode=voice)
    if (url.includes('/assistant')) {
      try {
        const urlObj = new URL(url);
        const mode = urlObj.searchParams.get('mode') || 'text';
        console.log('[DeepLink] Assistant navigation, mode:', mode);
        localStorage.setItem('pendingAssistant', mode);
        window.dispatchEvent(new CustomEvent('navigate-assistant', {
          detail: { mode },
        }));
      } catch (err) {
        console.error('[DeepLink] Error parsing assistant URL:', err);
        captureError(err, { context: 'deepLink.assistant', url });
      }
      return;
    }

    // Check if this is a quick-add transaction link (smartspend://add?amount=X&name=Y)
    if (url.includes('/add?') || url.match(/\/add$/)) {
      try {
        const urlObj = new URL(url);
        const params = {
          name: urlObj.searchParams.get('name') || '',
          amount: urlObj.searchParams.get('amount') || '',
          type: urlObj.searchParams.get('type') || 'expense',
          date: urlObj.searchParams.get('date') || '',
          category: urlObj.searchParams.get('category') || '',
          notes: urlObj.searchParams.get('notes') || '',
        };
        console.log('[DeepLink] Quick-add transaction:', params);
        // Store in localStorage so QuickAddHandler can pick it up on cold start
        localStorage.setItem('pendingQuickAdd', JSON.stringify(params));
        window.dispatchEvent(new CustomEvent('quick-add-transaction', {
          detail: params,
        }));
      } catch (err) {
        console.error('[DeepLink] Error parsing add URL:', err);
        captureError(err, { context: 'deepLink.quickAdd', url });
      }
      return;
    }

    // Check if this is a promo code redemption link (smartspend://redeem?code=XXXX)
    if (url.includes('/redeem') || url.includes('redeem?')) {
      try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        if (code) {
          console.log('[DeepLink] Promo code redemption:', code);
          localStorage.setItem('pendingPromoCode', code.trim().toUpperCase());
          window.dispatchEvent(new CustomEvent('redeem-promo-code', {
            detail: { code: code.trim().toUpperCase() },
          }));
        } else {
          console.warn('[DeepLink] Redeem link missing code parameter');
        }
      } catch (err) {
        console.error('[DeepLink] Error parsing redeem URL:', err);
        captureError(err, { context: 'deepLink.redeem', url });
      }
      return;
    }

    // Check if this is an OAuth callback
    if (url.includes('auth/callback') || url.includes('code=') || url.includes('access_token')) {
      try {
        // Close in-app browser IMMEDIATELY when deep link arrives.
        const { closeBrowser } = await import('@/shared/utils/browser.utils');
        await closeBrowser();
        console.log('[DeepLink] In-app browser closed');

        // Parse URL parameters
        const urlObj = new URL(url);

        const errorParam = urlObj.searchParams.get('error');
        const errorCode = urlObj.searchParams.get('error_code');
        const errorDescription = urlObj.searchParams.get('error_description');

        if (errorParam) {
          console.warn(`[DeepLink] OAuth error in callback: ${errorCode || errorParam} - ${errorDescription}`);

          if (errorCode === 'identity_already_exists') {
            console.log('[DeepLink] Identity already exists, dispatching retry event');
            window.dispatchEvent(new CustomEvent('oauth-identity-exists'));
          } else {
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

        const { supabase } = await import('@/lib/supabaseClient');

        const code = urlObj.searchParams.get('code');
        const hashParams = new URLSearchParams(url.split('#')[1] || '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          console.log('[DeepLink] Exchanging code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[DeepLink] Error exchanging code:', error);
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: error.message || 'Error al conectar con Google',
                code: error.status || 0,
                isRetryable: error.name === 'AuthRetryableFetchError' || error.status === 0,
              }
            }));
          } else {
            console.log('[DeepLink] Session established successfully');
          }
        } else if (accessToken && refreshToken) {
          console.log('[DeepLink] Setting session from tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[DeepLink] Error setting session:', error);
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: error.message || 'Error al configurar sesión',
                code: error.status || 0,
                isRetryable: true,
              }
            }));
          } else {
            console.log('[DeepLink] Session set successfully');
          }
        } else {
          console.warn('[DeepLink] No code or tokens found in URL');
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
        captureError(err, { context: 'deepLink.oauth', url });
      }
    }
  }

  // Handle deep links when app is already running (background → foreground)
  CapacitorApp.addListener('appUrlOpen', ({ url }) => handleDeepLink(url));

  // Handle deep links on cold start (app was killed, launched via URL)
  CapacitorApp.getLaunchUrl().then((result) => {
    if (result?.url) {
      console.log('[DeepLink] Cold start launch URL:', result.url);
      handleDeepLink(result.url);
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
      setTimeout(() => splash.remove(), 400);
    }
  }, 800);
});
