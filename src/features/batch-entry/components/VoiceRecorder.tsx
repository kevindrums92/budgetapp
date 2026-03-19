/**
 * Voice Recorder Component — Fullscreen with Live Transcription
 *
 * Immersive voice recording experience inspired by MonAi:
 * - Fullscreen gradient background
 * - Real-time transcription displayed as the user speaks
 * - Pulsing microphone indicator
 * - Simple cancel (X) and send (checkmark) buttons
 *
 * Uses speech recognition (native plugin or Web Speech API) for
 * real-time text display, then sends the transcript as text to the AI.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Mic, X, Send, Loader2 } from "lucide-react";
import {
  checkSpeechAvailability,
  startSpeechRecognition,
  stopSpeechRecognition,
} from "../services/speechRecognition.service";
import { useFakeProgress } from "../hooks/useFakeProgress";

type Props = {
  onTranscriptComplete: (transcript: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
};

const MAX_DURATION = 60; // seconds

const SPEECH_LANGUAGES = [
  { code: "es", locale: "es-ES", label: "ES" },
  { code: "en", locale: "en-US", label: "EN" },
  { code: "fr", locale: "fr-FR", label: "FR" },
  { code: "pt", locale: "pt-BR", label: "PT" },
];

export default function VoiceRecorder({
  onTranscriptComplete,
  onCancel,
  isProcessing,
}: Props) {
  const { t, i18n } = useTranslation("batch");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const mountedRef = useRef(true);

  // Speech language (independent from app UI language, persisted)
  const [selectedLang, setSelectedLang] = useState(() => {
    const saved = localStorage.getItem("speechLang");
    if (saved && SPEECH_LANGUAGES.some((l) => l.code === saved)) return saved;
    const appLang = i18n.language || "es";
    return SPEECH_LANGUAGES.find((l) => l.code === appLang)?.code || "es";
  });

  const speechLocale = useMemo(() => {
    return SPEECH_LANGUAGES.find((l) => l.code === selectedLang)?.locale || "es-ES";
  }, [selectedLang]);

  // Fake progress for processing state
  const progress = useFakeProgress({ isProcessing });

  // Start speech recognition on mount
  useEffect(() => {
    mountedRef.current = true;

    async function start() {
      const available = await checkSpeechAvailability();
      if (!mountedRef.current) return;

      if (!available) {
        setError(t("voiceInput.notAvailable", { defaultValue: "Reconocimiento de voz no disponible en este dispositivo" }));
        setIsStarting(false);
        return;
      }

      try {
        await startSpeechRecognition(
          speechLocale,
          (text) => {
            if (mountedRef.current) {
              setTranscript(text);
            }
          },
          (err) => {
            if (mountedRef.current) {
              console.error("[VoiceRecorder] Speech recognition error:", err);
              // Don't show error for minor issues, only permission denials
              if (err === "Permission denied" || err === "not-allowed") {
                setError(t("voiceInput.permissionDenied", { defaultValue: "Permiso de micrófono denegado" }));
              }
            }
          }
        );
        if (mountedRef.current) {
          setIsListening(true);
          setIsStarting(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : t("errors.recordingError")
          );
          setIsStarting(false);
        }
      }
    }

    start();

    return () => {
      mountedRef.current = false;
      stopSpeechRecognition();
    };
  }, [t, speechLocale]);

  // Auto-stop after MAX_DURATION
  useEffect(() => {
    if (!isListening) return;

    const timeout = setTimeout(() => {
      handleSend();
    }, MAX_DURATION * 1000);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const handleSend = useCallback(async () => {
    if (!isListening) return;
    setIsListening(false);
    const finalTranscript = await stopSpeechRecognition();
    // Use the latest transcript from state if stopSpeechRecognition returns empty
    const textToSend = finalTranscript || transcript;
    if (textToSend.trim()) {
      onTranscriptComplete(textToSend.trim());
    } else {
      setError(t("voiceInput.noSpeechDetected", { defaultValue: "No se detectó ninguna frase. Intenta de nuevo." }));
    }
  }, [isListening, transcript, onTranscriptComplete, t]);

  const handleCancel = useCallback(async () => {
    setIsListening(false);
    await stopSpeechRecognition();
    onCancel();
  }, [onCancel]);

  // --- Processing state ---
  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-violet-950 to-gray-900">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
          <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
        </div>
        <p className="text-lg font-semibold text-white">
          {t("voiceInput.processing")}
        </p>
        <p className="mt-2 text-sm text-violet-300/80">
          {t("voiceInput.transcribing")} {progress}%
        </p>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Show captured transcript */}
        {transcript && (
          <div className="mx-8 mt-8 max-h-32 overflow-y-auto rounded-2xl bg-white/5 px-6 py-4">
            <p className="text-center text-base leading-relaxed text-white/70">
              "{transcript}"
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-violet-950 to-gray-900">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20">
          <X className="h-12 w-12 text-red-400" />
        </div>
        <p className="text-lg font-semibold text-white">{t("common.error")}</p>
        <p className="mt-2 max-w-xs text-center text-sm text-white/60">
          {error}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-6 rounded-2xl bg-white/10 px-8 py-3 text-sm font-medium text-white transition-all active:scale-95"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  // --- Recording / listening state ---
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gradient-to-b from-gray-900 via-violet-950 to-gray-900">
      {/* Header: cancel button + language selector */}
      <div
        className="flex shrink-0 items-center justify-between px-6 pt-4"
        style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
      >
        <button
          type="button"
          onClick={handleCancel}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all active:scale-95"
          aria-label={t("common.cancel")}
        >
          <X size={20} className="text-white/80" />
        </button>

        {/* Language selector */}
        <div className="flex gap-1.5">
          {SPEECH_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                if (lang.code !== selectedLang) {
                  setTranscript("");
                  setIsStarting(true);
                  setSelectedLang(lang.code);
                  localStorage.setItem("speechLang", lang.code);
                }
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                selectedLang === lang.code
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/40"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content — transcript area */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {transcript ? (
            // Show live transcript
            <p className="text-center text-2xl font-semibold leading-relaxed text-white">
              {transcript}
            </p>
          ) : (
            // Placeholder when no speech detected yet
            <p className="text-center text-2xl font-medium text-white/30">
              {isStarting
                ? t("voiceInput.starting")
                : t("voiceInput.placeholder", { defaultValue: "Cuéntame todos los detalles de tu transacción" })}
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="flex shrink-0 items-center justify-center gap-6 pb-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
      >
        {/* Pulsing mic indicator */}
        <div className="relative flex items-center justify-center">
          {/* Pulse rings */}
          {isListening && (
            <>
              <span className="absolute h-20 w-20 animate-ping rounded-full bg-violet-500/20" />
              <span
                className="absolute h-16 w-16 rounded-full bg-violet-500/10"
                style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s" }}
              />
            </>
          )}
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-full ${
            isListening ? "bg-violet-500" : "bg-white/20"
          }`}>
            <Mic size={26} className="text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!isListening || !transcript.trim()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18B7B0] shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-95 disabled:opacity-30 disabled:shadow-none"
          aria-label={t("common.save")}
        >
          <Send size={22} className="text-white" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
