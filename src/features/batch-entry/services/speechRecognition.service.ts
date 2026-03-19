/**
 * Speech Recognition Service
 * Abstracts custom native Capacitor plugin + Web Speech API fallback
 * Provides real-time transcription for voice input
 *
 * Native: Uses custom SpeechRecognitionPlugin (ios/App/App/Plugins/SpeechRecognitionPlugin.swift)
 *         registered as "SpeechRecognitionNative" via Capacitor bridge
 * Web:    Uses Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 */

import { registerPlugin } from "@capacitor/core";
import { isNative } from "@/shared/utils/platform";

// --- Custom Capacitor plugin interface ---

interface SpeechRecognitionNativePlugin {
  available(): Promise<{ available: boolean }>;
  requestSpeechPermissions(): Promise<{ speechRecognition: string }>;
  startListening(options: { language: string }): Promise<void>;
  stopListening(): Promise<void>;
  addListener(
    eventName: "partialResults",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listenerFunc: (data: { matches: string[] }) => void
  ): Promise<any>;
  removeAllListeners(): Promise<void>;
}

const SpeechRecognitionNative =
  registerPlugin<SpeechRecognitionNativePlugin>("SpeechRecognitionNative");

// --- Module state ---

type PartialResultCallback = (text: string) => void;
type ErrorCallback = (error: string) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webRecognition: any = null;
let currentTranscript = "";
let partialCallback: PartialResultCallback | null = null;

/**
 * Check if speech recognition is available on this platform
 */
export async function checkSpeechAvailability(): Promise<boolean> {
  if (isNative()) {
    try {
      const { available } = await SpeechRecognitionNative.available();
      return available;
    } catch (err) {
      console.warn("[SpeechRecognition] Native availability check failed:", err);
      return false;
    }
  }

  // Web fallback: check for Web Speech API
  return (
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window
  );
}

/**
 * Request speech recognition permissions
 */
export async function requestSpeechPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const status = await SpeechRecognitionNative.requestSpeechPermissions();
      return status.speechRecognition === "granted";
    } catch {
      return false;
    }
  }

  // Web: permissions are requested automatically when starting
  return true;
}

/**
 * Start speech recognition with real-time partial results
 */
export async function startSpeechRecognition(
  language: string,
  onPartialResult: PartialResultCallback,
  onError?: ErrorCallback
): Promise<void> {
  currentTranscript = "";
  partialCallback = onPartialResult;

  if (isNative()) {
    await startNativeRecognition(language, onPartialResult, onError);
  } else {
    startWebRecognition(language, onPartialResult, onError);
  }
}

/**
 * Stop speech recognition and return the final transcript
 */
export async function stopSpeechRecognition(): Promise<string> {
  if (isNative()) {
    try {
      await SpeechRecognitionNative.stopListening();
      await SpeechRecognitionNative.removeAllListeners();
    } catch (err) {
      console.error("[SpeechRecognition] Error stopping native:", err);
    }
  } else {
    if (webRecognition) {
      webRecognition.stop();
      webRecognition = null;
    }
  }

  partialCallback = null;
  return currentTranscript;
}

// --- Native (custom Capacitor plugin) ---

async function startNativeRecognition(
  language: string,
  onPartialResult: PartialResultCallback,
  onError?: ErrorCallback
): Promise<void> {
  // Request permissions if needed
  try {
    const status = await SpeechRecognitionNative.requestSpeechPermissions();
    if (status.speechRecognition !== "granted") {
      onError?.("Permission denied");
      return;
    }
  } catch (err) {
    console.error("[SpeechRecognition] Permission request failed:", err);
    onError?.("Permission denied");
    return;
  }

  // Remove any previous listeners
  await SpeechRecognitionNative.removeAllListeners();

  // Listen for partial results
  await SpeechRecognitionNative.addListener("partialResults", (data) => {
    if (data.matches && data.matches.length > 0) {
      currentTranscript = data.matches[0];
      onPartialResult(currentTranscript);
    }
  });

  // Start listening
  try {
    await SpeechRecognitionNative.startListening({ language });
  } catch (err) {
    console.error("[SpeechRecognition] Native start error:", err);
    onError?.(err instanceof Error ? err.message : "Failed to start");
  }
}

// --- Web Speech API fallback ---

function startWebRecognition(
  language: string,
  onPartialResult: PartialResultCallback,
  onError?: ErrorCallback
): void {
  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    onError?.("Speech recognition not available");
    return;
  }

  const recognition = new SpeechRecognitionAPI();
  recognition.lang = language;
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    currentTranscript = transcript;
    onPartialResult(transcript);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    // "no-speech" is not a real error, just means silence
    if (event.error === "no-speech") return;
    console.error("[SpeechRecognition] Web error:", event.error);
    onError?.(event.error);
  };

  // Auto-restart on end (Web Speech API stops after silence)
  recognition.onend = () => {
    if (partialCallback && webRecognition === recognition) {
      try {
        recognition.start();
      } catch {
        // Already started or stopped
      }
    }
  };

  try {
    recognition.start();
    webRecognition = recognition;
  } catch (err) {
    console.error("[SpeechRecognition] Web start error:", err);
    onError?.(err instanceof Error ? err.message : "Failed to start");
  }
}

// --- Type declarations for Web Speech API ---

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
