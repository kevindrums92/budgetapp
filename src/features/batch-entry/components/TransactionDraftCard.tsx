/**
 * Transaction Draft Card Component
 * Flat card design with inline editing for name, category and amount
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as icons from "lucide-react";
import { Trash2, AlertCircle, ChevronDown } from "lucide-react";
import { useCurrency } from "@/features/currency";
import { useBudgetStore } from "@/state/budget.store";
import CategoryPickerDrawer from "@/features/categories/components/CategoryPickerDrawer";
import type { TransactionDraft } from "../types/batch-entry.types";

type Props = {
  draft: TransactionDraft;
  onUpdate: (id: string, updates: Partial<TransactionDraft>) => void;
  onDelete: (id: string) => void;
};

// Convert kebab-case icon name to PascalCase for lucide-react
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function TransactionDraftCard({ draft, onUpdate, onDelete }: Props) {
  const { t, i18n } = useTranslation("batch");
  const { currencyInfo, formatAmount } = useCurrency();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [amountInput, setAmountInput] = useState(draft.amount.toString());
  const [nameInput, setNameInput] = useState(draft.name);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  // Format date localized
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const locale = i18n.language === "es" ? "es-CO" :
                   i18n.language === "pt" ? "pt-BR" :
                   i18n.language === "fr" ? "fr-FR" : "en-US";
    return date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const isIncome = draft.type === "income";
  const hasValidAmount = draft.amount > 0;

  // Look up actual category from store
  const category = categoryDefinitions.find((c) => c.id === draft.category);
  const categoryName = category?.name || t("draft.noCategory");
  const categoryColor = category?.color || "#6B7280";
  const categoryIcon = category?.icon || "circle";
  const hasCategory = !!category;

  // Get icon component
  const IconComponent = icons[kebabToPascal(categoryIcon) as keyof typeof icons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined;

  // Check if this draft has issues
  const hasIssues = !hasCategory || !hasValidAmount;

  // Focus amount input when editing starts
  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
      amountInputRef.current.select();
    }
  }, [isEditingAmount]);

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Format number with thousand separators for display
  const formatWithSeparators = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Handle amount input change - store raw, display formatted
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmountInput(raw);
  };

  // Handle amount save
  const handleAmountSave = () => {
    const parsed = parseInt(amountInput, 10) || 0;
    onUpdate(draft.id, { amount: parsed });
    setIsEditingAmount(false);
  };

  // Handle name save
  const handleNameSave = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdate(draft.id, { name: trimmed });
    } else {
      setNameInput(draft.name); // Revert if empty
    }
    setIsEditingName(false);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Category Icon */}
        <button
          type="button"
          onClick={() => setShowCategoryPicker(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95"
          style={{ backgroundColor: categoryColor + "20" }}
        >
          {IconComponent ? (
            <IconComponent className="h-5 w-5" style={{ color: categoryColor }} />
          ) : (
            <icons.Circle className="h-5 w-5" style={{ color: categoryColor }} />
          )}
        </button>

        {/* Transaction Info */}
        <div className="min-w-0 flex-1">
          {/* Name row - inline editable */}
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave();
                if (e.key === "Escape") {
                  setNameInput(draft.name);
                  setIsEditingName(false);
                }
              }}
              onBlur={handleNameSave}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-gray-50 outline-none border-b border-gray-300 dark:border-gray-600 pb-0.5"
              placeholder={t("draft.namePlaceholder")}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameInput(draft.name);
                setIsEditingName(true);
              }}
              className="flex items-center gap-1.5 text-left group"
            >
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                {draft.name}
              </p>
              {(draft.needsReview || hasIssues) && (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              )}
            </button>
          )}

          {/* Category chip - clickable with chevron */}
          <button
            type="button"
            onClick={() => setShowCategoryPicker(true)}
            className={`mt-1 inline-flex items-center gap-0.5 rounded-full pl-2 pr-1 py-0.5 text-xs font-medium transition-colors active:opacity-70 ${
              hasCategory
                ? ""
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            }`}
            style={
              hasCategory
                ? { backgroundColor: categoryColor + "15", color: categoryColor }
                : undefined
            }
          >
            {categoryName}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {/* Date - not editable */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDate(draft.date)}
          </p>
        </div>

        {/* Amount - inline editable */}
        <div className="shrink-0">
          {isEditingAmount ? (
            <div className="flex items-center">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{currencyInfo.symbol}</span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                value={formatWithSeparators(amountInput)}
                onChange={handleAmountChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAmountSave();
                  if (e.key === "Escape") {
                    setAmountInput(draft.amount.toString());
                    setIsEditingAmount(false);
                  }
                }}
                onBlur={handleAmountSave}
                className="w-24 bg-transparent text-right text-sm font-semibold text-gray-900 dark:text-gray-50 outline-none"
                placeholder="0"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAmountInput(draft.amount.toString());
                setIsEditingAmount(true);
              }}
              className={`rounded-lg px-2 py-1 text-sm font-semibold transition-colors active:scale-95 ${
                !hasValidAmount
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  : isIncome
                    ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    : "text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {isIncome ? "+" : "-"}{hasValidAmount ? formatAmount(draft.amount) : `${currencyInfo.symbol}0`}
            </button>
          )}
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(draft.id)}
          className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Category Picker */}
      <CategoryPickerDrawer
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        transactionType={draft.type}
        value={draft.category}
        onSelect={(categoryId) => {
          onUpdate(draft.id, {
            category: categoryId,
            needsReview: false, // Clear review flag since user selected category
          });
          setShowCategoryPicker(false);
        }}
        showNewCategoryButton={false}
      />
    </div>
  );
}
