/**
 * Transaction Preview Component
 * Shows extracted transactions for user review before saving
 */

import { useTranslation } from "react-i18next";
import { RotateCcw, Loader2 } from "lucide-react";
import { formatCOP } from "@/shared/utils/currency.utils";
import type { TransactionDraft } from "../types/batch-entry.types";
import TransactionDraftCard from "./TransactionDraftCard";

type Props = {
  drafts: TransactionDraft[];
  onUpdateDraft: (id: string, updates: Partial<TransactionDraft>) => void;
  onDeleteDraft: (id: string) => void;
  onSaveAll: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isFullScreen?: boolean;
};

export default function TransactionPreview({
  drafts,
  onUpdateDraft,
  onDeleteDraft,
  onSaveAll,
  onCancel,
  isSaving,
  isFullScreen = false,
}: Props) {
  const { t } = useTranslation("batch");

  // Calculate totals
  const totalIncome = drafts
    .filter((d) => d.type === "income")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalExpense = drafts
    .filter((d) => d.type === "expense")
    .reduce((sum, d) => sum + d.amount, 0);

  const hasReviewItems = drafts.some((d) => d.needsReview);

  // Check for invalid drafts (missing category or zero amount)
  const draftsWithoutCategory = drafts.filter((d) => !d.category);
  const draftsWithZeroAmount = drafts.filter((d) => d.amount <= 0);
  const hasInvalidDrafts = draftsWithoutCategory.length > 0 || draftsWithZeroAmount.length > 0;
  const canSave = !hasInvalidDrafts && drafts.length > 0;

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center py-8">
        <p className="mb-4 text-center text-gray-500 dark:text-gray-400">
          {t("review.noTransactionsFound")}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <RotateCcw className="h-4 w-4" />
          {t("review.tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Compact header with count and total */}
      <div className="mb-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("review.reviewInstructions", { count: drafts.length })}
          </p>
          <div className="flex items-center gap-3">
            {totalIncome > 0 && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                +{formatCOP(totalIncome)}
              </span>
            )}
            {totalExpense > 0 && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                -{formatCOP(totalExpense)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Invalid drafts warning - blocks saving */}
      {hasInvalidDrafts && (
        <div className="mb-3 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {draftsWithoutCategory.length > 0 && draftsWithZeroAmount.length > 0
              ? t("review.fixCategoryAndAmount", {
                  categoryCount: draftsWithoutCategory.length,
                  amountCount: draftsWithZeroAmount.length,
                })
              : draftsWithoutCategory.length > 0
                ? t("review.fixCategory", { count: draftsWithoutCategory.length })
                : t("review.fixAmount", { count: draftsWithZeroAmount.length })}
          </p>
        </div>
      )}

      {/* Review warning - informational only */}
      {hasReviewItems && !hasInvalidDrafts && (
        <div className="mb-3 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t("review.needsReviewWarning")}
          </p>
        </div>
      )}

      {/* Transaction list */}
      <div className="mb-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {drafts.map((draft) => (
          <TransactionDraftCard
            key={draft.id}
            draft={draft}
            onUpdate={onUpdateDraft}
            onDelete={onDeleteDraft}
          />
        ))}
      </div>

      {/* Actions */}
      {isFullScreen ? (
        <div className="shrink-0 space-y-3">
          <button
            type="button"
            onClick={onSaveAll}
            disabled={isSaving || !canSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("review.saving")}
              </>
            ) : (
              drafts.length > 1 ? t("review.saveAll") : t("review.save")
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="w-full py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors active:text-gray-700 dark:active:text-gray-300 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onSaveAll}
            disabled={isSaving || !canSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("review.saving")}
              </>
            ) : (
              drafts.length > 1 ? t("review.saveAll") : t("review.save")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
