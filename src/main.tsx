import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/config"; // IMPORTANT: Import before React
import App from "./App";
import "./index.css";

import { registerSW } from "virtual:pwa-register";
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNative } from '@/shared/utils/platform';

registerSW({
  immediate: true,
});

// Initialize Capacitor plugins (native only)
if (isNative()) {
  // Hide native splash screen after 1.2s minimum
  setTimeout(() => {
    SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});
  }, 1200);

  // Set initial status bar style
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

  // Handle Android back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp();
    } else {
      window.history.back();
    }
  });

  // Handle OAuth deep link callback (smartspend://auth/callback?...)
  CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    console.log('[DeepLink] Received URL:', url);

    // Check if this is an OAuth callback
    if (url.includes('auth/callback') || url.includes('code=') || url.includes('access_token')) {
      try {
        // Use existing supabase client to avoid multiple instances warning
        const { supabase } = await import('@/lib/supabaseClient');

        // Parse URL parameters
        const urlObj = new URL(url);
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
          } else {
            console.log('[DeepLink] Session set successfully');
            // Don't redirect here - LoginScreen's auth listener will handle navigation
          }
        } else {
          console.warn('[DeepLink] No code or tokens found in URL');
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
const startTime = Date.now();
const MIN_SPLASH_TIME = isNative() ? 0 : 1200; // Native: immediate, Web: min 1.2s

requestAnimationFrame(() => {
  const elapsed = Date.now() - startTime;
  const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsed);

  setTimeout(() => {
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 400);
    }
  }, remainingTime);
});
