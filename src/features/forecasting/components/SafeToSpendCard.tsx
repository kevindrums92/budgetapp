import { useState, useMemo, useEffect } from "react";
import { Wallet, CircleHelp, Calculator, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { usePrivacy } from "@/features/privacy";
import { calculateSafeToSpend } from "../services/safeToSpend.service";
import { todayISO } from "@/services/dates.service";
import SafeToSpendBreakdownSheet from "./SafeToSpendBreakdownSheet";

const STORAGE_KEY = "app_safe_to_spend_expanded";

function getInitialExpandedState(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== "0"; // "1" or null = expanded, "0" = collapsed
  } catch {
    return true;
  }
}

export default function SafeToSpendCard() {
  const { t } = useTranslation("forecasting");
  const { formatAmount, currencyInfo } = useCurrency();
  const { formatWithPrivacy } = usePrivacy();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState);

  const transactions = useBudgetStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);

  // Track today's date to refresh calculations on app resume (e.g. after midnight)
  const [todayDate, setTodayDate] = useState(() => todayISO());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setTodayDate(todayISO());
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Persist expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isExpanded ? "1" : "0");
    } catch (err) {
      console.error("[SafeToSpendCard] Failed to persist expanded state:", err);
    }
  }, [isExpanded]);

  const data = useMemo(
    () => calculateSafeToSpend(transactions, budgets, selectedMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, budgets, selectedMonth, todayDate]
  );

  const dailyBudgetInfo = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    if (selectedMonth !== currentMonthKey) return null;

    const daysRemaining = daysInMonth - today.getDate() + 1; // +1 to include today
    if (daysRemaining <= 0) return null;

    const dailyBudget = data.safeToSpend / daysRemaining;
    if (dailyBudget <= 0) return null;

    return { dailyBudget, daysRemaining };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.safeToSpend, selectedMonth, todayDate]);

  const isPositive = data.safeToSpend >= 0;

  // Format amounts with privacy
  const safeToSpendFormatted = formatWithPrivacy(
    formatAmount(Math.abs(data.safeToSpend)),
    currencyInfo.symbol
  );
  const dailyBudgetFormatted = dailyBudgetInfo
    ? formatWithPrivacy(formatAmount(dailyBudgetInfo.dailyBudget), currencyInfo.symbol)
    : null;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className="mx-auto max-w-xl px-4 mt-4">
        <div
          className={`w-full rounded-2xl p-4 transition-all ${
            isPositive
              ? "bg-white dark:bg-gray-900 shadow-sm"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50"
          }`}
        >
          {isExpanded ? (
            // Expanded view: Full card with breakdown button
            <button
              type="button"
              onClick={() => setShowBreakdown(true)}
              className="w-full text-left"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                {isPositive ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                    <Wallet size={18} className="text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 dark:bg-red-500/20">
                    <AlertTriangle size={18} className="text-red-500" />
                  </div>
                )}
                <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {isPositive ? t("safeToSpend.title") : t("safeToSpend.deficit")}
                </p>
                <CircleHelp size={16} className="text-gray-300 dark:text-gray-600" />
              </div>

              {/* Amount */}
              <p
                className={`text-2xl font-bold tracking-tight ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isPositive ? "" : "- "}{safeToSpendFormatted}
              </p>

              {/* Footer: daily budget info OR deficit hint + Show Less button */}
              <div className={`mt-3 flex items-center pt-3 ${
                isPositive
                  ? "border-t border-gray-100 dark:border-gray-800"
                  : "border-t border-red-200/50 dark:border-red-800/30"
              }`}>
                {isPositive ? (
                  dailyBudgetInfo ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Calculator size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("safeToSpend.dailyBudget", { amount: dailyBudgetFormatted })}
                        {" · "}
                        {t("safeToSpend.daysRemaining", { count: dailyBudgetInfo.daysRemaining })}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )
                ) : (
                  <p className="flex-1 text-xs text-red-600/70 dark:text-red-400/70">
                    {t("safeToSpend.deficitHint")}
                  </p>
                )}

                <span
                  role="button"
                  tabIndex={0}
                  onClick={toggleExpanded}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleExpanded(e as any);
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-3 shrink-0"
                >
                  <ChevronUp size={12} />
                  <span>{t("safeToSpend.showLess")}</span>
                </span>
              </div>
            </button>
          ) : (
            // Collapsed view: Only daily budget line
            <div className="flex items-center justify-between">
              {dailyBudgetInfo ? (
                <div className="flex flex-1 items-center gap-2">
                  <Calculator size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("safeToSpend.dailyBudget", { amount: dailyBudgetFormatted })}
                    {" · "}
                    {t("safeToSpend.daysRemaining", { count: dailyBudgetInfo.daysRemaining })}
                  </p>
                </div>
              ) : (
                <p className="flex-1 text-xs text-gray-500 dark:text-gray-400">
                  {isPositive ? t("safeToSpend.title") : t("safeToSpend.deficit")}
                </p>
              )}

              <span
                role="button"
                tabIndex={0}
                onClick={toggleExpanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    toggleExpanded(e as any);
                  }
                }}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-3 shrink-0"
              >
                <ChevronDown size={12} />
                <span>{t("safeToSpend.showMore")}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <SafeToSpendBreakdownSheet
        open={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        data={data}
      />
    </>
  );
}
