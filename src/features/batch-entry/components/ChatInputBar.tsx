/**
 * ChatInputBar
 * Unified input bar for the AI Assistant page.
 * Three states: default (camera + textarea + mic), typing (camera + textarea + send), recording (cancel + waveform + send)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Mic, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import AudioWaveform from "./AudioWaveform";
import {
  startRecording,
  stopRecording,
  cancelRecording,
  formatDuration,
  getMaxDuration,
} from "../services/audioCapture.service";

type ChatInputBarProps = {
  onSendText: (text: string) => void;
  onSendAudio: (base64: string, mimeType: string) => void;
  onCaptureImage: () => void;
  disabled?: boolean;
  autoFocusText?: boolean;
  autoStartRecording?: boolean;
};

export default function ChatInputBar({
  onSendText,
  onSendAudio,
  onCaptureImage,
  disabled = false,
  autoFocusText = false,
  autoStartRecording = false,
}: ChatInputBarProps) {
  const { t } = useTranslation("batch");
  const [text, setText] = useState("");
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoStartedRef = useRef(false);
  const hasAutoFocusedRef = useRef(false);
  const maxDuration = getMaxDuration();

  const hasText = text.trim().length > 0;

  // Auto-focus textarea
  useEffect(() => {
    if (autoFocusText && !hasAutoFocusedRef.current && textareaRef.current) {
      hasAutoFocusedRef.current = true;
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [autoFocusText]);

  // Auto-start recording
  useEffect(() => {
    if (autoStartRecording && !hasAutoStartedRef.current && !disabled) {
      hasAutoStartedRef.current = true;
      setTimeout(() => {
        handleStartRecording();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartRecording, disabled]);

  // Recording timer
  useEffect(() => {
    if (isRecordingState) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev + 1 >= maxDuration) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecordingState, maxDuration]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleStartRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      await startRecording();
      setIsRecordingState(true);
    } catch (err) {
      console.error("[ChatInputBar] Error starting recording:", err);
      setRecordingError(err instanceof Error ? err.message : "Error al grabar");
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    try {
      const result = await stopRecording();
      setIsRecordingState(false);
      onSendAudio(result.audioBase64, result.mimeType);
    } catch (err) {
      console.error("[ChatInputBar] Error stopping recording:", err);
      setIsRecordingState(false);
      setRecordingError(err instanceof Error ? err.message : "Error al detener grabación");
    }
  }, [onSendAudio]);

  const handleCancelRecording = useCallback(async () => {
    try {
      await cancelRecording();
    } catch (err) {
      console.error("[ChatInputBar] Error cancelling recording:", err);
    }
    setIsRecordingState(false);
  }, []);

  const handleSendText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, onSendText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText]
  );

  // --- Recording state ---
  if (isRecordingState) {
    return (
      <div className="shrink-0 border-t border-gray-800 bg-gray-950 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <div className="flex items-center gap-3">
          {/* Cancel button */}
          <button
            type="button"
            onClick={handleCancelRecording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 transition-all active:scale-95"
            aria-label={t("common.cancel")}
          >
            <X size={20} className="text-gray-400" />
          </button>

          {/* Waveform + timer */}
          <div className="flex flex-1 items-center gap-3 rounded-2xl bg-gray-900 px-4 py-2">
            {/* Red pulse indicator */}
            <div className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </div>

            {/* Timer */}
            <span className="shrink-0 font-mono text-sm text-gray-300">
              {formatDuration(recordingDuration)}
            </span>

            {/* Waveform */}
            <div className="flex-1">
              <AudioWaveform isRecording barCount={16} />
            </div>
          </div>

          {/* Send audio button */}
          <button
            type="button"
            onClick={handleStopRecording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#18B7B0] transition-all active:scale-95"
            aria-label="Enviar audio"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // --- Default / Typing state ---
  return (
    <div className="shrink-0 border-t border-gray-800 bg-gray-950 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
      {/* Recording error message */}
      {recordingError && (
        <div className="mb-2 rounded-lg bg-red-900/30 px-3 py-1.5 text-xs text-red-400">
          {recordingError}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Camera button */}
        <button
          type="button"
          onClick={onCaptureImage}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
          aria-label={t("inputTypes.image.label")}
        >
          <Camera size={20} className="text-gray-400" />
        </button>

        {/* Textarea */}
        <div className="flex min-h-[40px] flex-1 items-end rounded-2xl bg-gray-900 px-4 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("assistant.inputPlaceholder", { defaultValue: "Escribe tus gastos..." })}
            disabled={disabled}
            rows={1}
            className="max-h-[120px] w-full resize-none bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Mic / Send button */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          {hasText ? (
            <button
              type="button"
              onClick={handleSendText}
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18B7B0] transition-transform duration-200 active:scale-95 disabled:opacity-50"
              style={{ animation: "zoomIn 200ms ease-out" }}
              aria-label="Enviar"
            >
              <Send size={18} className="text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-transform duration-200 active:scale-95 disabled:opacity-50"
              aria-label={t("inputTypes.voice.label")}
            >
              <Mic size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
