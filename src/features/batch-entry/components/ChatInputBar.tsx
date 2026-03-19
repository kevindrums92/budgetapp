/**
 * ChatInputBar
 * Unified input bar for the AI Assistant page.
 * Two states: default (camera + textarea + mic), typing (camera + textarea + send)
 * Mic button opens fullscreen VoiceRecorder overlay with live transcription.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Image as ImageIcon, Mic, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import VoiceRecorder from "./VoiceRecorder";

type ChatInputBarProps = {
  onSendText: (text: string) => void;
  onCaptureImage: (source: "camera" | "gallery") => void;
  disabled?: boolean;
  autoFocusText?: boolean;
  autoStartRecording?: boolean;
};

export default function ChatInputBar({
  onSendText,
  onCaptureImage,
  disabled = false,
  autoFocusText = false,
  autoStartRecording = false,
}: ChatInputBarProps) {
  const { t } = useTranslation("batch");
  const [text, setText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoStartedRef = useRef(false);
  const hasAutoFocusedRef = useRef(false);

  const hasText = text.trim().length > 0;
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Auto-focus textarea
  useEffect(() => {
    if (autoFocusText && !hasAutoFocusedRef.current && textareaRef.current) {
      hasAutoFocusedRef.current = true;
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [autoFocusText]);

  // Auto-start voice recorder
  useEffect(() => {
    if (autoStartRecording && !hasAutoStartedRef.current && !disabled) {
      hasAutoStartedRef.current = true;
      setTimeout(() => {
        setShowVoiceRecorder(true);
      }, 300);
    }
  }, [autoStartRecording, disabled]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setShowVoiceRecorder(false);
    onSendText(transcript);
  }, [onSendText]);

  const handleVoiceCancel = useCallback(() => {
    setShowVoiceRecorder(false);
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

  return (
    <>
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 pb-[calc(var(--sab)+12px)] pt-3">
        {/* Inline image source picker */}
        {showImagePicker && (
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => { setShowImagePicker(false); onCaptureImage("camera"); }}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 px-4 py-2.5 transition-all active:scale-[0.97]"
            >
              <Camera size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {t("imageInput.takePhoto")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setShowImagePicker(false); onCaptureImage("gallery"); }}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 px-4 py-2.5 transition-all active:scale-[0.97]"
            >
              <ImageIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {t("imageInput.selectGallery")}
              </span>
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Camera button */}
          <button
            type="button"
            onClick={() => setShowImagePicker((prev) => !prev)}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
            aria-label={t("inputTypes.image.label")}
          >
            <Camera size={20} className="text-gray-500 dark:text-gray-400" />
          </button>

          {/* Textarea */}
          <div className="flex min-h-[40px] flex-1 items-end rounded-2xl bg-white dark:bg-gray-900 px-4 py-2 shadow-sm dark:shadow-none">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("assistant.inputPlaceholder", { defaultValue: "Escribe tus gastos..." })}
              disabled={disabled}
              rows={1}
              className="max-h-[120px] w-full resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
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
                onClick={() => setShowVoiceRecorder(true)}
                disabled={disabled}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 transition-transform duration-200 active:scale-95 disabled:opacity-50"
                aria-label={t("inputTypes.voice.label")}
              >
                <Mic size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen voice recorder overlay */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onTranscriptComplete={handleVoiceTranscript}
          onCancel={handleVoiceCancel}
          isProcessing={false}
        />
      )}
    </>
  );
}
