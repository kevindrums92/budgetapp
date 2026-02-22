import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mic, Camera, Type, Sparkles, Plus } from "lucide-react";

export default function EmptyStateHome() {
  const navigate = useNavigate();
  const { t } = useTranslation("home");

  function handleBatchEntry(mode: "audio" | "image" | "text") {
    navigate(`/assistant?mode=${mode}`);
  }

  return (
    <div className="mx-4 flex flex-col items-center pt-16 pb-8">
      {/* Hero Icon */}
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#18B7B0]/10 dark:bg-[#18B7B0]/20">
          <Sparkles size={44} className="text-[#18B7B0]" strokeWidth={1.8} />
        </div>
        {/* Plus badge */}
        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#18B7B0] shadow-lg shadow-[#18B7B0]/30">
          <Plus size={16} className="text-white" strokeWidth={3} />
        </div>
      </div>

      {/* Title */}
      <h2 className="mb-3 text-center text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
        {t("emptyState.title")}
      </h2>

      {/* Subtitle */}
      <p className="mb-10 max-w-[280px] text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {t("emptyState.subtitle")}
      </p>

      {/* Action Buttons */}
      <div data-tour="home-batch-entry" className="flex w-full max-w-xs justify-center gap-5">
        {/* Voice */}
        <button
          type="button"
          onClick={() => handleBatchEntry("audio")}
          className="flex flex-col items-center gap-2.5 transition-all active:scale-95"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#18B7B0]/10 dark:bg-[#18B7B0]/15 border border-[#18B7B0]/20 dark:border-[#18B7B0]/25 shadow-sm">
            <Mic size={26} className="text-[#18B7B0]" strokeWidth={1.8} />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("addActionSheet.dictate")}</span>
        </button>

        {/* Photo */}
        <button
          type="button"
          onClick={() => handleBatchEntry("image")}
          className="flex flex-col items-center gap-2.5 transition-all active:scale-95"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/20 dark:border-violet-500/25 shadow-sm">
            <Camera size={26} className="text-violet-500" strokeWidth={1.8} />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("addActionSheet.photo")}</span>
        </button>

        {/* Text */}
        <button
          type="button"
          onClick={() => handleBatchEntry("text")}
          className="flex flex-col items-center gap-2.5 transition-all active:scale-95"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/25 shadow-sm">
            <Type size={26} className="text-amber-500" strokeWidth={1.8} />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("addActionSheet.text")}</span>
        </button>
      </div>
    </div>
  );
}
