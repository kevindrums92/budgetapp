import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { icons, CalendarCheck } from "lucide-react";
import { useCurrency } from "@/features/currency";
import { useBudgetStore } from "@/state/budget.store";
import { kebabToPascal } from "@/shared/utils/string.utils";
import type { Transaction, Category } from "@/types/budget.types";

interface AutoConfirmedModalProps {
  open: boolean;
  transactions: Transaction[];
  onClose: () => void;
}

export default function AutoConfirmedModal({
  open,
  transactions,
  onClose,
}: AutoConfirmedModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation("scheduled");
  const { formatAmount } = useCurrency();

  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categoryDefinitions.forEach((c) => map.set(c.id, c));
    return map;
  }, [categoryDefinitions]);

  // Animate in
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const displayLimit = 5;
  const displayed = transactions.slice(0, displayLimit);
  const remaining = transactions.length - displayed.length;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal Card */}
      <div
        className={`relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl transform transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <CalendarCheck size={20} className="text-emerald-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t("autoConfirmedModal.title", "Registros automáticos")}
          </h3>
        </div>

        {/* Subtitle */}
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {t("autoConfirmedModal.subtitle", {
            count: transactions.length,
            defaultValue_one: "Se registró 1 movimiento programado",
            defaultValue_other: "Se registraron {{count}} movimientos programados",
          })}
        </p>

        {/* Transaction list */}
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {displayed.map((tx) => {
            const category = categoryMap.get(tx.category);
            const IconComponent = category
              ? (icons[
                  kebabToPascal(category.icon) as keyof typeof icons
                ] as
                  | React.ComponentType<{
                      className?: string;
                      style?: React.CSSProperties;
                    }>
                  | undefined)
              : null;

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-3"
              >
                {/* Category Icon */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
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
                    <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {tx.name.trim() || category?.name || tx.category}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category?.name}
                  </p>
                </div>

                {/* Amount */}
                <p
                  className={`shrink-0 text-sm font-semibold ${
                    tx.type === "income"
                      ? "text-emerald-600"
                      : "text-gray-900 dark:text-gray-50"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatAmount(tx.amount)}
                </p>
              </div>
            );
          })}

          {/* More indicator */}
          {remaining > 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t("upcomingModal.andMore", "y {{count}} más...", {
                count: remaining,
              })}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gray-900 dark:bg-gray-50 py-3 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {t("autoConfirmedModal.dismiss", "Ok")}
        </button>
      </div>
    </div>
  );
}
