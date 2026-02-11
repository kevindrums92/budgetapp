/**
 * Transaction Preview Component
 * Shows extracted transactions for user review before saving
 */

import { useTranslation } from "react-i18next";
import { Loader2, Info, Receipt, Sparkles, Trash2 } from "lucide-react";
import { useCurrency } from "@/features/currency";
import type { TransactionDraft } from "../types/batch-entry.types";
import TransactionDraftCard from "./TransactionDraftCard";

type Props = {
  drafts: TransactionDraft[];
  onUpdateDraft: (id: string, updates: Partial<TransactionDraft>) => void;
  onDeleteDraft: (id: string) => void;
  onSaveAll: () => void;
  onCancel: () => void;
  onClose: () => void;
  isSaving: boolean;
  isFullScreen?: boolean;
};

export default function TransactionPreview({
  drafts,
  onUpdateDraft,
  onDeleteDraft,
  onSaveAll,
  onCancel,
  onClose,
  isSaving,
  isFullScreen = false,
}: Props) {
  const { t } = useTranslation("batch");
  const { formatAmount } = useCurrency();

  // Calculate totals
  const totalIncome = drafts
    .filter((d) => d.type === "income")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalExpense = drafts
    .filter((d) => d.type === "expense")
    .reduce((sum, d) => sum + d.amount, 0);

  // Net total for display (positive = income, negative = expense)
  const netTotal = totalIncome - totalExpense;

  // Count transactions by type
  const incomeCount = drafts.filter((d) => d.type === "income").length;
  const expenseCount = drafts.filter((d) => d.type === "expense").length;
  const hasBothTypes = incomeCount > 0 && expenseCount > 0;

  const hasReviewItems = drafts.some((d) => d.needsReview);

  // Check for invalid drafts (missing category or zero amount)
  const draftsWithoutCategory = drafts.filter((d) => !d.category);
  const draftsWithZeroAmount = drafts.filter((d) => d.amount <= 0);
  const hasInvalidDrafts = draftsWithoutCategory.length > 0 || draftsWithZeroAmount.length > 0;
  const canSave = !hasInvalidDrafts && drafts.length > 0;

  if (drafts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Icon */}
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Trash2 size={32} className="text-gray-400 dark:text-gray-500" />
        </div>

        {/* Message */}
        <p className="mb-2 text-center text-base font-semibold text-gray-900 dark:text-gray-50">
          {t("review.allDraftsRemoved")}
        </p>
        <p className="mb-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("review.allDraftsRemovedHint")}
        </p>

        {/* Action */}
        <button
          type="button"
          onClick={onClose}
          className="w-full max-w-xs rounded-xl bg-gray-900 dark:bg-white py-3.5 text-sm font-medium text-white dark:text-gray-900 transition-all active:scale-[0.98]"
        >
          {t("common.ok")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* Smart Card Header */}
      <div className="shrink-0 pb-4">
        {/* Title - matching PageHeader height (h-10 icon container) */}
        <div className="flex items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center">
            <Sparkles size={20} className="text-violet-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{t("review.title")}</h1>
        </div>

        {/* Floating Card */}
        <div data-tour="batch-review-header" className="bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm dark:shadow-black/20">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                {t("review.totalBatch")}
              </span>
              <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {formatAmount(Math.abs(netTotal))}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-700">
              <Receipt size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* Breakdown row - show when there are both types */}
          {hasBothTypes && (
            <div className="flex items-center gap-4 mt-2 mb-1">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                +{formatAmount(totalIncome)} <span className="text-xs font-normal text-gray-400">({incomeCount})</span>
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                -{formatAmount(totalExpense)} <span className="text-xs font-normal text-gray-400">({expenseCount})</span>
              </span>
            </div>
          )}

          <div className="h-px w-full bg-gray-200 dark:bg-gray-700/50 my-3" />

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info size={12} className="shrink-0" />
            <span>{t("review.confirmCategories")}</span>
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
      <div data-tour="batch-review-cards" className="mb-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
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
        <div data-tour="batch-review-actions" className="shrink-0 space-y-3">
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
        <div data-tour="batch-review-actions" className="flex shrink-0 gap-3">
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
