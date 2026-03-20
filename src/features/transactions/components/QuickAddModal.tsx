import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { icons, CreditCard, X, ChevronRight } from "lucide-react";
import { useCurrency } from "@/features/currency";
import { useBudgetStore } from "@/state/budget.store";
import { useSubscription } from "@/hooks/useSubscription";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { todayISO } from "@/services/dates.service";
import { trackAction, maybeShowInterstitial } from "@/services/ads.service";
import { hapticSuccess } from "@/shared/utils/haptics";
import {
  getActiveBudgetForCategory,
  calculateBudgetProgress,
} from "@/features/budget/services/budget.service";
import CategoryPickerDrawer from "@/features/categories/components/CategoryPickerDrawer";
import type { Category } from "@/types/budget.types";

export interface QuickAddData {
  name: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  categoryId: string | null;
  notes?: string;
}

interface QuickAddModalProps {
  open: boolean;
  data: QuickAddData | null;
  onClose: () => void;
}

export default function QuickAddModal({
  open,
  data,
  onClose,
}: QuickAddModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [overrideCategoryId, setOverrideCategoryId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const { t } = useTranslation("shortcuts");
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const { isPro } = useSubscription();

  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const budgets = useBudgetStore((s) => s.budgets);
  const transactions = useBudgetStore((s) => s.transactions);

  // Effective categoryId: override wins over data's original
  const effectiveCategoryId = overrideCategoryId ?? data?.categoryId ?? null;

  const category: Category | undefined = useMemo(() => {
    if (!effectiveCategoryId) return undefined;
    return categoryDefinitions.find((c) => c.id === effectiveCategoryId);
  }, [effectiveCategoryId, categoryDefinitions]);

  const IconComponent = useMemo(() => {
    if (!category) return null;
    return icons[kebabToPascal(category.icon) as keyof typeof icons] as
      | React.ComponentType<{ className?: string; style?: React.CSSProperties }>
      | undefined;
  }, [category]);

  // Budget context: find active budget for this category and calculate progress
  const budgetContext = useMemo(() => {
    if (!effectiveCategoryId || !data || data.type !== "expense") return null;

    const today = data.date || todayISO();
    const activeBudget = getActiveBudgetForCategory(budgets, effectiveCategoryId, today);
    if (!activeBudget) return null;

    const progress = calculateBudgetProgress(activeBudget, transactions);
    // Project what remaining will be AFTER adding this transaction
    const projectedRemaining = progress.remaining - data.amount;
    const projectedPercentage = Math.min(
      ((progress.spent + data.amount) / progress.budgeted) * 100,
      100
    );
    const willExceed = projectedRemaining < 0;

    return {
      budgeted: progress.budgeted,
      spent: progress.spent,
      remaining: progress.remaining,
      projectedRemaining,
      projectedPercentage,
      currentPercentage: Math.min(progress.percentage, 100),
      willExceed,
      isAlreadyOver: progress.isOverBudget,
    };
  }, [data, effectiveCategoryId, budgets, transactions]);

  // Animate in + haptic on open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setIsVisible(true));
      hapticSuccess();
    } else {
      setIsVisible(false);
      setOverrideCategoryId(null);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !data) return null;

  const handleSave = async () => {
    addTransaction({
      type: data.type,
      name: data.name,
      category: effectiveCategoryId || "",
      amount: data.amount,
      date: data.date || todayISO(),
      notes: data.notes,
    });

    await hapticSuccess();

    if (!isPro) {
      trackAction();
      await maybeShowInterstitial("after_transaction_create");
    }

    onClose();
  };

  const handleEdit = () => {
    onClose();
    navigate("/add", {
      state: {
        deepLink: {
          name: data.name,
          amount: String(data.amount),
          type: data.type,
          date: data.date,
          categoryId: effectiveCategoryId,
          notes: data.notes || "",
        },
      },
    });
  };

  // Budget status label + color
  const getBudgetStatus = () => {
    if (!budgetContext) return null;
    const { projectedRemaining, budgeted } = budgetContext;
    const ratio = projectedRemaining / budgeted;

    if (projectedRemaining < 0) {
      return { label: t("quickAdd.budgetExceeded", "Excedido"), color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-900/20" };
    }
    if (ratio < 0.15) {
      return { label: t("quickAdd.budgetTight", "Ajustado"), color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20" };
    }
    return { label: t("quickAdd.budgetOk", "Seguro"), color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" };
  };

  const budgetStatus = getBudgetStatus();

  // Progress bar color based on projected percentage
  const getProgressBarColor = () => {
    if (!budgetContext) return "bg-emerald-500";
    if (budgetContext.willExceed || budgetContext.isAlreadyOver) return "bg-red-500";
    if (budgetContext.projectedPercentage > 85) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"
          onClick={onClose}
        />

        {/* Modal Card */}
        <div
          className={`relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl transform transition-all duration-200 ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
            <>
              {/* Header: small icon + title + close button */}
              <div className="flex items-center justify-between px-5 pt-5 pb-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <CreditCard size={14} className="text-[#18B7B0]" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {t("quickAdd.title", "Pago detectado")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Merchant + Category row (tappable to change category) */}
              <button
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className="flex w-full items-center gap-3 px-5 pt-4 text-left transition-colors active:bg-gray-50 dark:active:bg-gray-800"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: category ? category.color + "20" : "#f3f4f6",
                  }}
                >
                  {IconComponent ? (
                    <IconComponent
                      className="h-5 w-5"
                      style={{ color: category?.color }}
                    />
                  ) : (
                    <CreditCard size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-gray-900 dark:text-gray-50">
                    {data.name || t("quickAdd.unknownMerchant", "Comercio")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category?.name || t("quickAdd.noCategory", "Sin categoria")}
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-gray-300 dark:text-gray-600" />
              </button>

              {/* Amount */}
              <div className="px-5 pt-3 pb-1">
                <p
                  className={`text-3xl font-bold ${
                    data.type === "income"
                      ? "text-emerald-600"
                      : "text-gray-900 dark:text-gray-50"
                  }`}
                >
                  {data.type === "income" ? "+" : "-"}
                  {formatAmount(data.amount)}
                </p>
              </div>

              {/* Budget context section */}
              {budgetContext && category && (
                <div className="mx-5 mt-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-3">
                  {/* Label + status badge */}
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t("quickAdd.budgetLabel", "Tu presupuesto")}
                    </p>
                    {budgetStatus && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${budgetStatus.color} ${budgetStatus.bgColor}`}
                      >
                        {budgetStatus.label}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                      style={{ width: `${Math.min(budgetContext.projectedPercentage, 100)}%` }}
                    />
                  </div>

                  {/* Budget remaining text */}
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {budgetContext.willExceed
                      ? t("quickAdd.budgetWillExceed", "Excederás tu presupuesto de {{category}} este mes.", {
                          category: category.name,
                        })
                      : t("quickAdd.budgetRemaining", "Te quedarán <b>{{amount}}</b> en <b>{{category}}</b> este mes.", {
                          amount: formatAmount(budgetContext.projectedRemaining),
                          category: category.name,
                        }).split(/<b>|<\/b>/).map((part, i) =>
                          i % 2 === 1 ? (
                            <span key={i} className="font-semibold text-gray-700 dark:text-gray-200">{part}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 px-5 pt-4 pb-5">
                {/* Primary: Save */}
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] hover:bg-emerald-600"
                >
                  {data.type === "income"
                    ? t("quickAdd.addIncome", "Agregar ingreso")
                    : t("quickAdd.addExpense", "Agregar gasto")}
                </button>

                {/* Secondary: Edit */}
                <button
                  type="button"
                  onClick={handleEdit}
                  className="w-full rounded-2xl bg-gray-900 dark:bg-gray-700 py-3 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-gray-800 dark:hover:bg-gray-600"
                >
                  {t("quickAdd.edit", "Editar")}
                </button>
              </div>
            </>
        </div>
      </div>

      {/* Category Picker Drawer */}
      <CategoryPickerDrawer
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        transactionType={data.type}
        value={effectiveCategoryId}
        onSelect={(id) => {
          setOverrideCategoryId(id);
          setShowCategoryPicker(false);
        }}
        showNewCategoryButton={false}
      />
    </>
  );
}
