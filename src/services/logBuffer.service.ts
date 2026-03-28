/**
 * In-memory circular log buffer.
 *
 * Patches console.log / .warn / .error so every call is also
 * stored in a fixed-size ring buffer.  When the user triggers a
 * diagnostic report the buffer is flushed to Sentry as extra context.
 *
 * Buffer size: 300 entries (keeps ~5-10 min of typical app activity).
 */

import * as Sentry from "@sentry/react";

interface LogEntry {
  ts: string;          // ISO timestamp
  level: "log" | "warn" | "error";
  args: string;        // JSON-stringified arguments (truncated)
}

const MAX_ENTRIES = 300;
const MAX_ARG_LENGTH = 500;

const buffer: LogEntry[] = [];
let installed = false;

function stringify(args: unknown[]): string {
  try {
    const parts = args.map((a) => {
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      if (typeof a === "string") return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    });
    const joined = parts.join(" ");
    return joined.length > MAX_ARG_LENGTH
      ? joined.slice(0, MAX_ARG_LENGTH) + "…"
      : joined;
  } catch {
    return "[unserializable]";
  }
}

function push(level: LogEntry["level"], args: unknown[]) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    args: stringify(args),
  };
  if (buffer.length >= MAX_ENTRIES) {
    buffer.shift();
  }
  buffer.push(entry);
}

/**
 * Monkey-patch console so every log/warn/error is captured.
 * Safe to call multiple times — only installs once.
 */
export function installLogBuffer() {
  if (installed) return;
  installed = true;

  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);

  console.log = (...args: unknown[]) => {
    push("log", args);
    origLog(...args);
  };
  console.warn = (...args: unknown[]) => {
    push("warn", args);
    origWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    push("error", args);
    origError(...args);
  };
}

/**
 * Redact tokens, keys, and secrets so Sentry's @password:filter
 * doesn't scrub the entire recentLogs field.
 */
function sanitize(text: string): string {
  return text
    // JWT tokens (eyJ…)
    .replace(/eyJ[A-Za-z0-9_-]{20,}/g, "[JWT]")
    // Quoted token/key/secret values: "access_token":"value" or "apikey":"value"
    .replace(
      /("(?:access_token|refresh_token|token|apikey|api_key|secret|password|authorization|anon_key)"\s*:\s*")([^"]{8,})"/gi,
      '$1[REDACTED]"',
    )
    // Bearer tokens in headers
    .replace(/Bearer\s+[A-Za-z0-9._-]{20,}/gi, "Bearer [REDACTED]")
    // Supabase key patterns (sb-…)
    .replace(/sb-[a-z0-9]+-auth-token[^\s"]*/gi, "[SB_TOKEN]");
}

/**
 * Send the current log buffer to Sentry as a manual diagnostic report.
 * Returns true if the event was captured, false if nothing to send.
 */
export function sendDiagnosticReport(): boolean {
  if (buffer.length === 0) return false;

  const snapshot = [...buffer];

  // Format as readable text and sanitize secrets so Sentry doesn't scrub the whole field
  const logText = sanitize(
    snapshot
      .map((e) => `[${e.ts}] ${e.level.toUpperCase()} ${e.args}`)
      .join("\n"),
  );

  Sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setTag("diagnostic", "manual_report");
    // Unique fingerprint per report so Sentry's Dedupe integration doesn't drop repeats
    scope.setFingerprint(["diagnostic-report", Date.now().toString()]);
    scope.setContext("logBuffer", {
      entryCount: snapshot.length,
      firstEntry: snapshot[0]?.ts,
      lastEntry: snapshot[snapshot.length - 1]?.ts,
    });
    // Attach the full log as extra (Sentry truncates at ~100KB, our buffer is well within that)
    scope.setExtra("recentLogs", logText);

    Sentry.captureMessage("Manual diagnostic report", "info");
  });

  return true;
}

/** Returns the current buffer length (for UI feedback). */
export function getLogBufferSize(): number {
  return buffer.length;
}
