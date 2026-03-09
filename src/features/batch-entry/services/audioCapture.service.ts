/**
 * Audio Capture Service
 * Handles voice recording with a hybrid strategy:
 *
 * - Permissions: Always use native VoiceRecorder plugin on native platforms
 *   (proper Android/iOS system permission dialogs).
 * - Recording: Always use Web MediaRecorder API (produces audio/webm or audio/mp4
 *   with proper container that OpenAI accepts). The native plugin outputs raw AAC
 *   (ADTS) without an MP4 container, which OpenAI rejects.
 * - If Web MediaRecorder fails on native (e.g., WebView denies getUserMedia),
 *   falls back to native recording as last resort.
 */

import { VoiceRecorder } from "capacitor-voice-recorder";
import type { RecordingData } from "capacitor-voice-recorder";

/** Maximum recording duration in seconds */
const MAX_DURATION_SECONDS = 30;

/** Result from stopping a recording */
export type AudioRecordingResult = {
  audioBase64: string;
  mimeType: string;
};

/** Whether native VoiceRecorder plugin is available */
let nativePluginAvailable: boolean | null = null;

/**
 * Which recording method is active for the current recording session.
 * Needed so stop/cancel know which API to call.
 */
let activeRecordingMethod: "web" | "native" | null = null;

/** Web Audio API state */
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioStream: MediaStream | null = null;
let recordedMimeType: string = "audio/webm";

/** Check if the native VoiceRecorder plugin is available */
async function checkPluginAvailability(): Promise<boolean> {
  try {
    await VoiceRecorder.hasAudioRecordingPermission();
    return true;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "UNIMPLEMENTED") {
      return false;
    }
    return true; // Other error means plugin exists
  }
}

/** Ensure plugin availability is resolved */
async function ensureInitialized(): Promise<void> {
  if (nativePluginAvailable === null) {
    nativePluginAvailable = await checkPluginAvailability();
    console.log("[audioCapture] Native plugin available:", nativePluginAvailable);
  }
}

/** Check if we have microphone permission */
export async function checkMicrophonePermission(): Promise<boolean> {
  await ensureInitialized();

  if (nativePluginAvailable) {
    try {
      const result = await VoiceRecorder.hasAudioRecordingPermission();
      return result.value;
    } catch (error) {
      console.error("[audioCapture] Native permission check error:", error);
      return false;
    }
  }

  // Web-only fallback
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      return result.state === "granted";
    }
    return true;
  } catch {
    return true;
  }
}

/** Request microphone permission */
export async function requestMicrophonePermission(): Promise<boolean> {
  await ensureInitialized();

  if (nativePluginAvailable) {
    try {
      const result = await VoiceRecorder.requestAudioRecordingPermission();
      return result.value;
    } catch (error) {
      console.error("[audioCapture] Native permission request error:", error);
      return false;
    }
  }

  // Web-only fallback
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error("[audioCapture] Web permission denied:", error);
    return false;
  }
}

/** Check if recording is currently in progress */
export async function isRecording(): Promise<boolean> {
  if (activeRecordingMethod === "web") {
    return mediaRecorder?.state === "recording";
  }
  if (activeRecordingMethod === "native") {
    try {
      const status = await VoiceRecorder.getCurrentStatus();
      return status.status === "RECORDING";
    } catch {
      return false;
    }
  }
  return false;
}

/** Start recording audio */
export async function startRecording(): Promise<void> {
  await ensureInitialized();

  // Check/request permission (native plugin on native platforms)
  const hasPermission = await checkMicrophonePermission();
  if (!hasPermission) {
    const granted = await requestMicrophonePermission();
    if (!granted) {
      throw new Error("Permiso de micrófono denegado");
    }
  }

  // Always try Web MediaRecorder first (produces proper container format for OpenAI).
  // On native, the system permission is already granted via native plugin above,
  // so getUserMedia should also succeed.
  try {
    await startWebRecording();
    activeRecordingMethod = "web";
    console.log("[audioCapture] Using web recording (proper container format)");
    return;
  } catch (webError) {
    console.warn("[audioCapture] Web recording failed:", webError);
  }

  // Fallback: native recording (raw AAC — server normalizes for OpenAI)
  if (nativePluginAvailable) {
    const recording = activeRecordingMethod === "native" &&
      (await VoiceRecorder.getCurrentStatus().catch(() => ({ status: "NONE" }))).status === "RECORDING";
    if (recording) {
      await VoiceRecorder.stopRecording();
    }

    console.log("[audioCapture] Falling back to native recording");
    await VoiceRecorder.startRecording();
    activeRecordingMethod = "native";
    return;
  }

  throw new Error("No se pudo iniciar la grabación");
}

/** Start recording using Web Audio API */
async function startWebRecording(): Promise<void> {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
  }

  audioStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    }
  });

  audioChunks = [];

  const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
    ? "audio/mp4"
    : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  recordedMimeType = mimeType;
  mediaRecorder = new MediaRecorder(audioStream, { mimeType });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start(100);
  console.log("[audioCapture] Web recording started with mime type:", mimeType);
}

/** Stop recording and return base64 audio data with mime type */
export async function stopRecording(): Promise<AudioRecordingResult> {
  if (activeRecordingMethod === "web") {
    activeRecordingMethod = null;
    return stopWebRecording();
  }

  if (activeRecordingMethod === "native") {
    activeRecordingMethod = null;
    console.log("[audioCapture] Stopping native recording...");

    const result: RecordingData = await VoiceRecorder.stopRecording();

    if (!result.value?.recordDataBase64) {
      throw new Error("No se pudo obtener la grabación");
    }

    const mimeType = result.value.mimeType || "audio/aac";

    console.log(
      "[audioCapture] Native recording stopped, duration:",
      result.value.msDuration,
      "ms, mimeType:",
      mimeType
    );

    return { audioBase64: result.value.recordDataBase64, mimeType };
  }

  throw new Error("No hay grabación activa");
}

/** Stop web recording and return base64 audio data with mime type */
async function stopWebRecording(): Promise<AudioRecordingResult> {
  console.log("[audioCapture] Stopping web recording...");

  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error("No hay grabación activa"));
      return;
    }

    const mimeType = recordedMimeType;

    mediaRecorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunks, { type: mimeType });

        console.log("[audioCapture] Web recording stopped, size:", audioBlob.size, "bytes, mimeType:", mimeType);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1];

          if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
          }
          mediaRecorder = null;
          audioChunks = [];

          resolve({ audioBase64: base64Data, mimeType });
        };
        reader.onerror = () => {
          reject(new Error("Error al convertir audio"));
        };
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        reject(error);
      }
    };

    mediaRecorder.stop();
  });
}

/** Cancel/pause recording without saving */
export async function cancelRecording(): Promise<void> {
  const method = activeRecordingMethod;
  activeRecordingMethod = null;

  if (method === "web") {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }
    mediaRecorder = null;
    audioChunks = [];
    console.log("[audioCapture] Web recording cancelled");
    return;
  }

  if (method === "native") {
    try {
      const status = await VoiceRecorder.getCurrentStatus();
      if (status.status === "RECORDING") {
        console.log("[audioCapture] Cancelling native recording...");
        await VoiceRecorder.stopRecording();
      }
    } catch (error) {
      console.error("[audioCapture] Error cancelling native:", error);
    }
    return;
  }
}

/** Get maximum recording duration in seconds */
export function getMaxDuration(): number {
  return MAX_DURATION_SECONDS;
}

/**
 * Format duration in seconds to mm:ss string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
