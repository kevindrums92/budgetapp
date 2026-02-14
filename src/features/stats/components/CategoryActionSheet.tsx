import { useState, useEffect } from "react";
import { Target, Receipt, Eye, icons } from "lucide-react";
import { useTranslation } from "react-i18next";
import { kebabToPascal } from "@/shared/utils/string.utils";

type Props = {
  open: boolean;
  onClose: () => void;
  category: { id: string; name: string; icon: string; color: string } | null;
  hasBudget: boolean;
  onCreateBudget: () => void;
  onViewRecords: () => void;
};

const SHEET_HEIGHT = 260;

export default function CategoryActionSheet({
  open,
  onClose,
  category,
  hasBudget,
  onCreateBudget,
  onViewRecords,
}: Props) {
  const { t } = useTranslation("stats");
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isVisible || !category) return null;

  const backdropOpacity = isAnimating ? 0.4 : 0;
  const sheetTranslate = isAnimating ? 0 : SHEET_HEIGHT;

  const IconComponent =
    icons[kebabToPascal(category.icon) as keyof typeof icons];

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label="Close"
        style={{ opacity: backdropOpacity, transition: "opacity 300ms" }}
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          transform: `translateY(${sheetTranslate}px)`,
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pb-4">
          {IconComponent && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: category.color + "20" }}
            >
              <IconComponent
                className="h-5 w-5"
                style={{ color: category.color }}
              />
            </div>
          )}
          <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {category.name}
          </span>
        </div>

        {/* Content */}
        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="space-y-2">
            {/* Create / View Budget */}
            <button
              type="button"
              onClick={hasBudget ? onViewRecords : onCreateBudget}
              className="flex w-full items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 transition-all active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                {hasBudget ? (
                  <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-50">
                {hasBudget
                  ? t("expensesByCategory.actions.viewBudget")
                  : t("expensesByCategory.actions.createBudget")}
              </span>
            </button>

            {/* View Records */}
            <button
              type="button"
              onClick={onViewRecords}
              className="flex w-full items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 transition-all active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Receipt className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-50">
                {t("expensesByCategory.actions.viewRecords")}
              </span>
            </button>
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
          >
            {t("expensesByCategory.actions.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
