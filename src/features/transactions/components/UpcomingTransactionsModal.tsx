import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { icons, X, Calendar } from "lucide-react";
import { useCurrency } from "@/features/currency";
import { useBudgetStore } from "@/state/budget.store";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { formatScheduleFrequency } from "@/shared/utils/schedule.utils";
import { calculateNextDates } from "@/shared/services/scheduler.service";
import { todayISO } from "@/services/dates.service";
import type { Transaction, Category } from "@/types/budget.types";

const SESSION_KEY = "pending-upcoming-modal";
const EVENT_NAME = "show-upcoming-transactions";

export default function UpcomingTransactionsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("scheduled");
  const { formatAmount } = useCurrency();

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categoryDefinitions.forEach((c) => map.set(c.id, c));
    return map;
  }, [categoryDefinitions]);

  // Get tomorrow's upcoming transactions
  const upcomingTx = useMemo(() => {
    const today = todayISO();
    const tomorrow = new Date(today + "T12:00:00");
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const results: Transaction[] = [];

    for (const tx of transactions) {
      // Template-based scheduled transactions
      if (tx.schedule?.enabled) {
        const dates = calculateNextDates(tx.schedule, today, tomorrowStr);
        if (dates.includes(tomorrowStr)) {
          results.push(tx);
        }
        continue;
      }

      // Pending/planned transactions with explicit date
      if (
        (tx.status === "pending" || tx.status === "planned") &&
        tx.date === tomorrowStr
      ) {
        results.push(tx);
      }
    }

    return results;
  }, [transactions]);

  // Listen for notification tap events
  useEffect(() => {
    // Cold start: check sessionStorage
    try {
      const pending = sessionStorage.getItem(SESSION_KEY);
      if (pending) {
        sessionStorage.removeItem(SESSION_KEY);
        if (upcomingTx.length > 0) {
          setIsOpen(true);
        } else {
          navigate("/scheduled");
        }
      }
    } catch { /* ignore */ }

    // Warm: listen for custom event
    const handler = () => {
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
      if (upcomingTx.length > 0) {
        setIsOpen(true);
      } else {
        navigate("/scheduled");
      }
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [upcomingTx.length, navigate]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => setIsOpen(false);

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const displayLimit = 5;
  const displayed = upcomingTx.slice(0, displayLimit);
  const remaining = upcomingTx.length - displayed.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-[#18B7B0]" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t("upcomingModal.title", "Movimientos de mañana")}
          </h3>
        </div>

        {/* Transaction list */}
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {displayed.map((tx) => {
            const category = categoryMap.get(tx.category);
            const IconComponent = category
              ? (icons[kebabToPascal(category.icon) as keyof typeof icons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined)
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
                    {tx.schedule?.enabled && (
                      <> &middot; {formatScheduleFrequency(tx.schedule, t)}</>
                    )}
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
          onClick={handleDismiss}
          className="mt-4 w-full rounded-xl bg-gray-900 dark:bg-gray-50 py-3 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {t("upcomingModal.dismiss", "Entendido")}
        </button>
      </div>
    </div>
  );
}
