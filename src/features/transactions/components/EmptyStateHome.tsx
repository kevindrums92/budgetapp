import { useState } from "react";
import { Mic, Camera, Type, Sparkles, Plus } from "lucide-react";
import BatchEntrySheet from "@/features/batch-entry/components/BatchEntrySheet";
import type { BatchInputType } from "@/features/batch-entry/types/batch-entry.types";

export default function EmptyStateHome() {
  const [showBatchEntry, setShowBatchEntry] = useState(false);
  const [initialInputType, setInitialInputType] = useState<BatchInputType | null>(null);

  function handleBatchEntry(inputType: BatchInputType) {
    setInitialInputType(inputType);
    setShowBatchEntry(true);
  }

  function handleCloseBatchEntry() {
    setShowBatchEntry(false);
    setInitialInputType(null);
  }

  return (
    <>
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
          Estrena el registro inteligente
        </h2>

        {/* Subtitle */}
        <p className="mb-10 max-w-[280px] text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Olvídate de escribir. Dicta tus gastos, toma una foto a tu recibo o escribe naturalmente.
        </p>

        {/* Action Buttons */}
        <div className="flex w-full max-w-xs justify-center gap-5">
          {/* Voice */}
          <button
            type="button"
            onClick={() => handleBatchEntry("audio")}
            className="flex flex-col items-center gap-2.5 transition-all active:scale-95"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#18B7B0]/10 dark:bg-[#18B7B0]/15 border border-[#18B7B0]/20 dark:border-[#18B7B0]/25 shadow-sm">
              <Mic size={26} className="text-[#18B7B0]" strokeWidth={1.8} />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Voz</span>
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
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Foto</span>
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
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Texto</span>
          </button>
        </div>
      </div>

      {/* BatchEntrySheet */}
      {showBatchEntry && (
        <BatchEntrySheet
          open={showBatchEntry}
          onClose={handleCloseBatchEntry}
          initialInputType={initialInputType}
        />
      )}
    </>
  );
}
