import { Repeat, X } from "lucide-react";
import type { Transaction } from "@/types/budget.types";

type RecurringBannerProps = {
  pendingTransactions: Transaction[];
  onViewDetails: () => void;
  onReplicateAll: () => void;
  onIgnore: () => void;
};

export default function RecurringBanner({
  pendingTransactions,
  onViewDetails,
  onIgnore,
}: RecurringBannerProps) {
  if (pendingTransactions.length === 0) {
    return null;
  }

  const count = pendingTransactions.length;

  return (
    <div className="mx-4 mb-3">
      {/* Main card - Tappable to open details */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-sm">
        <button
          type="button"
          onClick={onViewDetails}
          className="w-full text-left active:opacity-90 transition-opacity"
        >
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Repeat className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {count} {count === 1 ? "registro recurrente" : "registros recurrentes"}
              </p>
              <p className="mt-0.5 text-xs text-emerald-50">
                Toca para replicar en este mes
              </p>
            </div>
          </div>
        </button>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIgnore();
          }}
          className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
