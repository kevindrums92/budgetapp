/**
 * Voice Recorder Component
 * Records audio for voice-based transaction input
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Square, X, Loader2 } from "lucide-react";
import {
  startRecording,
  stopRecording,
  cancelRecording,
  getMaxDuration,
  formatDuration,
} from "../services/audioCapture.service";
import { useFakeProgress } from "../hooks/useFakeProgress";
import AudioWaveform from "./AudioWaveform";

type Props = {
  onRecordingComplete: (audioBase64: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
};

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  isProcessing,
}: Props) {
  const { t } = useTranslation("batch");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const maxDuration = getMaxDuration();

  // Fake progress for processing state
  const progress = useFakeProgress({ isProcessing });

  // Start recording on mount
  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        await startRecording();
        if (mounted) {
          setIsRecording(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : t("errors.recordingError"));
        }
      }
    }

    start();

    return () => {
      mounted = false;
      cancelRecording();
    };
  }, [t]);

  const handleStop = useCallback(async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);
      const audioBase64 = await stopRecording();
      onRecordingComplete(audioBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.stopRecordingError"));
    }
  }, [isRecording, onRecordingComplete, t]);

  // Timer for duration
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setDuration((d) => {
        const newDuration = d + 1;
        // Auto-stop at max duration
        if (newDuration >= maxDuration) {
          handleStop();
        }
        return newDuration;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, maxDuration, handleStop]);

  const handleCancel = useCallback(async () => {
    await cancelRecording();
    setIsRecording(false);
    onCancel();
  }, [onCancel]);

  // Show processing state
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-gray-50">
          {t("voiceInput.processing")}
        </p>
        <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t("voiceInput.transcribing")} {progress}%
        </p>
        {/* Progress bar */}
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-gray-50">{t("common.error")}</p>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          {error}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 rounded-xl bg-gray-100 dark:bg-gray-800 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  // Recording state
  return (
    <div className="flex flex-col items-center py-8">
      {/* Recording indicator with waveform */}
      <div className="relative mb-4">
        {isRecording ? (
          // Waveform visualization when recording
          <div className="relative">
            <div className="w-48">
              <AudioWaveform isRecording={isRecording} barCount={24} />
            </div>
            {/* Red recording dot */}
            <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 animate-pulse" />
          </div>
        ) : (
          // Static mic icon when starting
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
            <Mic className="h-12 w-12 text-violet-600 dark:text-violet-400" />
          </div>
        )}
      </div>

      {/* Duration */}
      <p className="mb-1 text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
        {formatDuration(duration)}
      </p>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {isRecording ? t("voiceInput.recording") : t("voiceInput.starting")}
      </p>

      {/* Progress bar */}
      <div className="mb-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-1000"
          style={{ width: `${(duration / maxDuration) * 100}%` }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 transition-all active:scale-95"
        >
          <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={!isRecording || duration < 1}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 transition-all active:scale-95 disabled:opacity-50"
        >
          <Square className="h-6 w-6 text-white" fill="white" />
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        {t("voiceInput.maxDuration", { duration: formatDuration(maxDuration) })}
      </p>
    </div>
  );
}
