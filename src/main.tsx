import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove splash screen after app renders (with minimum display time)
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
