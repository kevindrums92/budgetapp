/**
 * Widget Bridge Service
 * Sends budget data to the iOS Home Screen Widget via native Capacitor plugin.
 * The widget reads from shared App Group UserDefaults.
 */

import { Capacitor } from "@capacitor/core";
import i18n from "@/i18n/config";
import { todayISO, currentMonthKey } from "@/services/dates.service";
import {
  STORAGE_KEY as CURRENCY_STORAGE_KEY,
  getCurrencyByCode,
  DEFAULT_CURRENCY,
} from "@/features/currency/utils/currency.constants";
import { calculateSafeToSpend } from "@/features/forecasting/services/safeToSpend.service";
import type { Transaction, Budget, Category } from "@/types/budget.types";
import type { CarryOverEntry } from "@/types/budget.types";

interface RecentTransactionPayload {
  name: string;
  amount: number;
  type: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  date: string;
}

interface WidgetLabels {
  today: string;
  month: string;
  remaining: string;
  balance: string;
  recent: string;
  noRecent: string;
  transactionsSuffix: string;
  voice: string;
  add: string;
}

interface WidgetPayload {
  todayExpenses: number;
  todayIncome: number;
  monthExpenses: number;
  monthIncome: number;
  budgetRemaining: number | null;
  budgetTotal: number | null;
  currencySymbol: string;
  currencyCode: string;
  currencyDecimals: number;
  transactionCount: number;
  lastUpdated: string;
  recentTransactions: RecentTransactionPayload[];
  labels: WidgetLabels;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

function getWidgetLabels(): WidgetLabels {
  const t = i18n.getFixedT(i18n.language, "widget");
  return {
    today: t("today"),
    month: t("month"),
    remaining: t("remaining"),
    balance: t("balance"),
    recent: t("recent"),
    noRecent: t("noRecent"),
    transactionsSuffix: t("transactionsSuffix"),
    voice: t("voice"),
    add: t("add"),
  };
}

function computeWidgetData(
  transactions: Transaction[],
  budgets: Budget[],
  carryOverBalances: Record<string, CarryOverEntry>,
  categoryDefinitions: Category[]
): WidgetPayload {
  const today = todayISO();
  const monthKey = currentMonthKey();

  // Today's totals
  const todayTxns = transactions.filter(
    (t) => t.date === today && t.status !== "planned"
  );
  const todayExpenses = todayTxns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const todayIncome = todayTxns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Month totals
  const monthTxns = transactions.filter(
    (t) => t.date.startsWith(monthKey) && t.status !== "planned"
  );
  const monthExpenses = monthTxns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthIncome = monthTxns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Safe to Spend (PocketGuard-style: Balance - Upcoming Bills - Budget Reserves)
  const carryOver = carryOverBalances[monthKey]?.amount ?? 0;
  const safeToSpend = calculateSafeToSpend(
    transactions,
    budgets,
    monthKey,
    carryOver
  );

  // Currency
  const currencyCode =
    localStorage.getItem(CURRENCY_STORAGE_KEY) || DEFAULT_CURRENCY;
  const currencyInfo = getCurrencyByCode(currencyCode);

  // Transaction count today
  const transactionCount = todayTxns.length;

  // Recent transactions (last 5 non-planned, sorted by date desc then createdAt desc)
  const categoryMap = new Map(categoryDefinitions.map((c) => [c.id, c]));
  const recentTransactions: RecentTransactionPayload[] = transactions
    .filter((t) => t.status !== "planned")
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    })
    .slice(0, 5)
    .map((t) => {
      const cat = categoryMap.get(t.category);
      return {
        name: t.name,
        amount: t.amount,
        type: t.type,
        categoryName: cat?.name ?? t.category,
        categoryColor: cat?.color ?? "#888888",
        categoryIcon: cat?.icon ?? "circle",
        date: t.date,
      };
    });

  return {
    todayExpenses,
    todayIncome,
    monthExpenses,
    monthIncome,
    budgetRemaining: safeToSpend.safeToSpend,
    budgetTotal: safeToSpend.currentBalance,
    currencySymbol: currencyInfo?.symbol ?? "$",
    currencyCode: currencyInfo?.code ?? "COP",
    currencyDecimals: currencyInfo?.decimals ?? 0,
    transactionCount,
    lastUpdated: new Date().toISOString(),
    recentTransactions,
    labels: getWidgetLabels(),
  };
}

async function sendToNative(payload: WidgetPayload): Promise<void> {
  try {
    await (Capacitor as any).Plugins.WidgetBridge.updateWidgetData(payload);
  } catch (e) {
    console.log("[WidgetBridge] Error:", e);
  }
}

/**
 * Call this whenever transactions or budgets change.
 * Debounced to avoid excessive native calls.
 */
export function updateWidget(
  transactions: Transaction[],
  budgets: Budget[],
  carryOverBalances: Record<string, CarryOverEntry>,
  categoryDefinitions: Category[]
): void {
  if (!isIOSNative()) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const payload = computeWidgetData(
      transactions,
      budgets,
      carryOverBalances,
      categoryDefinitions
    );
    sendToNative(payload);
  }, 800);
}
