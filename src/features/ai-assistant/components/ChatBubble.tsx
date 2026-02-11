import { useTranslation } from "react-i18next";
import type { Message } from "../types/assistant.types";

type Props = {
  message: Message;
  onRetry?: () => void;
};

export default function ChatBubble({ message, onRetry }: Props) {
  const { t } = useTranslation("assistant");
  const isUser = message.role === "user";
  const isError = message.isError;

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#18B7B0] text-white"
            : isError
              ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              : "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-50"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>

        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-medium underline"
          >
            {t("errors.retry")}
          </button>
        )}
      </div>
    </div>
  );
}
