import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/config"; // IMPORTANT: Import before React
import App from "./App";
import "./index.css";

import { registerSW } from "virtual:pwa-register";
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative } from '@/shared/utils/platform';

registerSW({
  immediate: true,
});

// Initialize Capacitor plugins (native only)
if (isNative()) {
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
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove splash screen after app renders (web only - native auto-hides)
if (!isNative()) {
  const startTime = Date.now();
  const MIN_SPLASH_TIME = 1200; // Minimum 1.2 seconds

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
}
