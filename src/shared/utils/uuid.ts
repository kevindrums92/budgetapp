/**
 * Generate a UUID v4 string.
 *
 * Uses `crypto.randomUUID()` when available (Chrome 92+, Safari 15.4+, Firefox 95+).
 * Falls back to `crypto.getRandomValues()` for older WebViews (e.g. Chrome 91 on Android 12).
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback using crypto.getRandomValues (supported since Chrome 11)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version 4 (0100) in byte 6
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant 10 in byte 8
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
