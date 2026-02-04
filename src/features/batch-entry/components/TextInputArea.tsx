/**
 * Text Input Area Component
 * Free-form text input for natural language transaction entry
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2 } from "lucide-react";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { useFakeProgress } from "../hooks/useFakeProgress";

type Props = {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
};

const MAX_LENGTH = 500;

export default function TextInputArea({ onSubmit, onCancel, isProcessing }: Props) {
  const { t } = useTranslation("batch");
  const [text, setText] = useState("");

  // Dismiss keyboard on scroll/touch outside
  useKeyboardDismiss();

  // Fake progress for processing state
  const progress = useFakeProgress({ isProcessing });

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  const canSubmit = text.trim().length > 0 && !isProcessing;

  return (
    <div className="flex flex-col">
      {/* Text area */}
      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={t("textInput.placeholder")}
          disabled={isProcessing}
          rows={4}
          className="w-full resize-none rounded-2xl border-0 bg-gray-100 dark:bg-gray-800 p-4 text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          autoFocus
        />
        <div className="mt-1 flex justify-end">
          <span
            className={`text-xs ${
              text.length > MAX_LENGTH * 0.9
                ? "text-amber-500"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* Tip or Processing indicator */}
      {isProcessing ? (
        <div className="mb-4">
          {/* Progress bar container */}
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {t("textInput.processing")} {progress}%
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Tip:</strong> {t("textInput.tip")}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t("textInput.extract")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
