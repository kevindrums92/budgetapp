import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

/** Strip tokens/keys/secrets from a string to avoid Sentry's @password:filter scrubbing. */
function redactSecrets(text: string): string {
  return text
    .replace(/eyJ[A-Za-z0-9_-]{20,}/g, "[JWT]")
    .replace(/Bearer\s+[A-Za-z0-9._-]{20,}/gi, "Bearer [REDACTED]")
    .replace(/sb-[a-z0-9]+-auth-token[^\s"]*/gi, "[SB_TOKEN]");
}

/**
 * Initialize Sentry for error-only tracking.
 * No performance tracing, no session replay — just errors.
 * This maximizes the free tier quota (5,000 errors/month).
 */
export function initSentry() {
  if (!import.meta.env.PROD) {
    return;
  }

  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Release tracking — matches __APP_VERSION__ from vite.config.ts
    release: `smartspend@${__APP_VERSION__}`,
    environment: import.meta.env.MODE, // "development" | "production"

    // Error-only: disable performance tracing
    tracesSampleRate: 0,

    // Disable session replay (saves quota)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    enabled: import.meta.env.PROD,

    // Filter noisy or irrelevant errors
    beforeSend(event) {
      // Skip ResizeObserver errors (browser noise, not real bugs)
      if (event.exception?.values?.some(
        (e) => e.value?.includes("ResizeObserver loop")
      )) {
        return null;
      }

      // Skip network errors from extensions or third-party scripts
      if (event.exception?.values?.some(
        (e) => e.value?.includes("chrome-extension://") ||
               e.value?.includes("moz-extension://")
      )) {
        return null;
      }

      // Skip generic network errors UNLESS they are chunk/module loading failures
      // Chunk loading errors ("Failed to fetch dynamically imported module") are critical
      const isChunkError = event.exception?.values?.some(
        (e) => e.value?.includes("dynamically imported module") ||
               e.value?.includes("Loading chunk") ||
               e.value?.includes("Loading CSS chunk")
      );
      if (!isChunkError) {
        const isNetworkNoise = event.exception?.values?.some(
          (e) => e.value === "Failed to fetch" ||
                 e.value === "Load failed" ||
                 e.value === "NetworkError"
        );
        if (isNetworkNoise) return null;
      }

      return event;
    },

    // Limit breadcrumbs to reduce payload size
    maxBreadcrumbs: 30,

    // Sanitize breadcrumb data so Sentry's @password:filter
    // doesn't scrub entries containing tokens/keys
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.message) {
        breadcrumb.message = redactSecrets(breadcrumb.message);
      }
      if (breadcrumb.data?.arguments && Array.isArray(breadcrumb.data.arguments)) {
        breadcrumb.data.arguments = breadcrumb.data.arguments.map(
          (arg: unknown) => (typeof arg === "string" ? redactSecrets(arg) : arg),
        );
      }
      return breadcrumb;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser navigation
      "Non-Error promise rejection captured",
      "AbortError",
      // Auth-related (handled by app)
      "AuthRetryableFetchError",
    ],
  });
}

/**
 * Capture an error manually (for try-catch blocks).
 * Use this in production error paths instead of just console.error.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Set user identity for error attribution.
 * Call after auth state changes.
 */
export function setSentryUser(userId: string | null, email?: string | null) {
  if (userId) {
    Sentry.setUser({ id: userId, email: email || undefined });
  } else {
    Sentry.setUser(null);
  }
}
