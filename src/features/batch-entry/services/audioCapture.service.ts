/**
 * Audio Capture Service
 * Handles voice recording using capacitor-voice-recorder plugin with Web Audio API fallback
 *
 * The native plugin (capacitor-voice-recorder) doesn't support Swift Package Manager,
 * so we use MediaRecorder API as a fallback for iOS/web.
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

/** Track whether to use native plugin or web fallback */
let useWebFallback = false;

/** Web Audio API state */
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioStream: MediaStream | null = null;
/** Track the mime type used by MediaRecorder */
let recordedMimeType: string = "audio/webm";

/**
 * Check if we should use the web fallback
 * Called once on first use to determine plugin availability
 */
async function checkPluginAvailability(): Promise<boolean> {
  try {
    await VoiceRecorder.hasAudioRecordingPermission();
    return false; // Plugin works, don't use fallback
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "UNIMPLEMENTED") {
      console.log("[audioCapture] Native plugin not available, using web fallback");
      return true; // Use web fallback
    }
    return false; // Other error, try native anyway
  }
}

/** Check if we have microphone permission */
export async function checkMicrophonePermission(): Promise<boolean> {
  // Check plugin availability on first call
  if (!useWebFallback) {
    useWebFallback = await checkPluginAvailability();
  }

  if (useWebFallback) {
    // For web, check navigator.permissions if available
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
        return result.state === "granted";
      }
      // If permissions API not available, we'll find out when we try to record
      return true;
    } catch {
      return true; // Assume true, will fail on actual use if not granted
    }
  }

  try {
    const result = await VoiceRecorder.hasAudioRecordingPermission();
    return result.value;
  } catch (error) {
    console.error("[audioCapture] Error checking permission:", error);
    return false;
  }
}

/** Request microphone permission */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (useWebFallback) {
    // For web, requesting permission means trying to get user media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Got permission, stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("[audioCapture] Web permission denied:", error);
      return false;
    }
  }

  try {
    const result = await VoiceRecorder.requestAudioRecordingPermission();
    return result.value;
  } catch (error) {
    console.error("[audioCapture] Error requesting permission:", error);
    return false;
  }
}

/** Check if recording is currently in progress */
export async function isRecording(): Promise<boolean> {
  if (useWebFallback) {
    return mediaRecorder?.state === "recording";
  }

  try {
    const status = await VoiceRecorder.getCurrentStatus();
    return status.status === "RECORDING";
  } catch (error) {
    console.error("[audioCapture] Error checking status:", error);
    return false;
  }
}

/** Start recording audio */
export async function startRecording(): Promise<void> {
  // Check plugin availability on first call
  if (!useWebFallback) {
    useWebFallback = await checkPluginAvailability();
  }

  // Check/request permission first
  const hasPermission = await checkMicrophonePermission();
  if (!hasPermission) {
    const granted = await requestMicrophonePermission();
    if (!granted) {
      throw new Error("Permiso de micrófono denegado");
    }
  }

  if (useWebFallback) {
    await startWebRecording();
    return;
  }

  // Check if already recording
  const recording = await isRecording();
  if (recording) {
    console.log("[audioCapture] Already recording, stopping first...");
    await VoiceRecorder.stopRecording();
  }

  console.log("[audioCapture] Starting native recording...");
  await VoiceRecorder.startRecording();
}

/** Start recording using Web Audio API */
async function startWebRecording(): Promise<void> {
  // Stop any existing recording
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
  }

  console.log("[audioCapture] Starting web recording...");

  // Get audio stream
  audioStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    }
  });

  // Reset chunks
  audioChunks = [];

  // Create MediaRecorder with AAC codec if available, otherwise use default
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

  mediaRecorder.start(100); // Collect data every 100ms
  console.log("[audioCapture] Web recording started with mime type:", mimeType);
}

/** Stop recording and return base64 audio data with mime type */
export async function stopRecording(): Promise<AudioRecordingResult> {
  if (useWebFallback) {
    return stopWebRecording();
  }

  console.log("[audioCapture] Stopping native recording...");

  const result: RecordingData = await VoiceRecorder.stopRecording();

  if (!result.value?.recordDataBase64) {
    throw new Error("No se pudo obtener la grabación");
  }

  // Native plugin on Android records AAC (.m4a), on iOS records AAC (.m4a)
  const mimeType = result.value.mimeType || "audio/aac";

  console.log(
    "[audioCapture] Recording stopped, duration:",
    result.value.msDuration,
    "ms, mimeType:",
    mimeType
  );

  return { audioBase64: result.value.recordDataBase64, mimeType };
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
        // Combine all chunks into a single blob
        const audioBlob = new Blob(audioChunks, { type: mimeType });

        console.log("[audioCapture] Web recording stopped, size:", audioBlob.size, "bytes, mimeType:", mimeType);

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
          const base64Data = base64.split(",")[1];

          // Clean up
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
  if (useWebFallback) {
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

  try {
    const recording = await isRecording();
    if (recording) {
      console.log("[audioCapture] Cancelling native recording...");
      await VoiceRecorder.stopRecording();
    }
  } catch (error) {
    console.error("[audioCapture] Error cancelling:", error);
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
