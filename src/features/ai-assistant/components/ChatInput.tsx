import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
};

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: Props) {
  const { t } = useTranslation("assistant");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || t("input.placeholder")}
        className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#18B7B0] transition-transform active:scale-95 disabled:opacity-50"
      >
        <Send size={18} className="text-white" />
      </button>
    </div>
  );
}
