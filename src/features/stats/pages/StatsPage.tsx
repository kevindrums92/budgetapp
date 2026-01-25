import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { icons, PieChart as PieChartIcon, BarChart3, TrendingUp, CheckCircle, AlertCircle, ChevronRight, DollarSign, Calendar, SlidersHorizontal } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { monthLabel } from "@/services/dates.service";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/features/currency";
import { kebabToPascal } from "@/shared/utils/string.utils";
import type { Category } from "@/types/budget.types";

// Get last N months as YYYY-MM strings
function getLastMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }

  return months;
}

// Short month label (e.g., "Ene", "Feb")
function shortMonthLabel(monthKey: string, locale: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const date = new Date(Number(yStr), Number(mStr) - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: "short" })
    .format(date)
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

type CategoryChartItem = {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: string;
};

type MonthlyData = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

type TrendData = {
  month: string;
  label: string;
  expense: number;
};

export default function StatsPage() {
  const { t } = useTranslation('stats');
  const { getLocale } = useLanguage();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);

  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showDailyAverageModal, setShowDailyAverageModal] = useState(false);
  const [showTopDayModal, setShowTopDayModal] = useState(false);

  const excludedFromStats = useBudgetStore((s) => s.excludedFromStats);
  const toggleCategoryFromStats = useBudgetStore((s) => s.toggleCategoryFromStats);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showDailyAverageModal || showComparisonModal || showTopDayModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDailyAverageModal, showComparisonModal, showTopDayModal]);

  // Donut chart data (expenses by category for selected month)
  const categoryChartData = useMemo<CategoryChartItem[]>(() => {
    const expenses = transactions.filter(
      (t) => t.type === "expense" && t.date.slice(0, 7) === selectedMonth
    );

    const byCategory: Record<string, number> = {};
    for (const t of expenses) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }

    return Object.entries(byCategory)
      .map(([categoryId, value]) => {
        const cat = categoryDefinitions.find((c) => c.id === categoryId);
        return {
          id: categoryId,
          name: cat?.name ?? categoryId,
          value,
          color: cat?.color ?? "#9CA3AF",
          icon: cat?.icon ?? "tag",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categoryDefinitions, selectedMonth]);

  const totalExpenses = useMemo(
    () => categoryChartData.reduce((sum, d) => sum + d.value, 0),
    [categoryChartData]
  );

  // Bar chart data (income vs expenses for last 6 months)
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const months = getLastMonths(6);
    const locale = getLocale();

    return months.map((monthKey) => {
      let income = 0;
      let expense = 0;

      for (const t of transactions) {
        if (t.date.slice(0, 7) !== monthKey) continue;
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      }

      return {
        month: monthKey,
        label: shortMonthLabel(monthKey, locale),
        income,
        expense,
      };
    });
  }, [transactions, getLocale]);

  const hasMonthlyData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  // Trend chart data (expenses for last 12 months)
  const trendData = useMemo<TrendData[]>(() => {
    const months = getLastMonths(12);
    const locale = getLocale();

    return months.map((monthKey) => {
      let expense = 0;

      for (const t of transactions) {
        if (t.date.slice(0, 7) !== monthKey) continue;
        if (t.type === "expense") expense += t.amount;
      }

      return {
        month: monthKey,
        label: shortMonthLabel(monthKey, locale),
        expense,
      };
    });
  }, [transactions, getLocale]);

  const hasTrendData = trendData.some((d) => d.expense > 0);

  // Quick stats for selected month
  const quickStats = useMemo(() => {
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === "expense" && t.date.slice(0, 7) === selectedMonth
    );

    // Total expenses this month
    const totalExpensesCurrent = currentMonthExpenses.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Days in current month
    const [year, month] = selectedMonth.split("-");
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

    // Filter expenses for stats (excluding selected categories)
    const expensesForStats = currentMonthExpenses.filter(
      (t) => !(excludedFromStats ?? []).includes(t.category)
    );

    // Daily average
    const expensesForAverage = expensesForStats;
    const totalForAverage = expensesForAverage.reduce((sum, t) => sum + t.amount, 0);
    const dailyAverage = totalForAverage / daysInMonth;

    // Total monthly budget (will be calculated from budgets array in future)
    const totalBudget = 0; // TODO: Calculate from budgets array when Budget feature is implemented

    // Days remaining in month
    const today = new Date();
    const isCurrentMonth = selectedMonth === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
    const daysRemaining = daysInMonth - currentDay;

    // Budget remaining
    const budgetRemaining = totalBudget - totalExpensesCurrent;
    const dailyBudget = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

    // Top category (using filtered stats)
    const byCategory: Record<string, number> = {};
    for (const t of expensesForStats) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }
    const topCategoryId = Object.entries(byCategory).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const topCategory = categoryDefinitions.find((c) => c.id === topCategoryId);

    // Day of week with most expenses (using filtered stats)
    const byDayOfWeek: Record<number, number> = {};
    for (const t of expensesForStats) {
      const date = new Date(t.date + "T12:00:00");
      const dayOfWeek = date.getDay();
      byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] ?? 0) + t.amount;
    }
    const topDayOfWeek = Object.entries(byDayOfWeek).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const dayNames = [
      t('days.sunday'),
      t('days.monday'),
      t('days.tuesday'),
      t('days.wednesday'),
      t('days.thursday'),
      t('days.friday'),
      t('days.saturday'),
    ];
    const topDayName = topDayOfWeek !== undefined ? dayNames[Number(topDayOfWeek)] : null;
    const topDayOfWeekNumber = topDayOfWeek !== undefined ? Number(topDayOfWeek) : null;

    // Get all transactions for the top day of week (using filtered stats)
    const topDayTransactions = topDayOfWeekNumber !== null
      ? expensesForStats.filter((t) => {
          const date = new Date(t.date + "T12:00:00");
          return date.getDay() === topDayOfWeekNumber;
        }).sort((a, b) => {
          // Sort by date descending (most recent first)
          return b.date.localeCompare(a.date);
        })
      : [];

    // Previous month comparison (day-to-day for current month, full month for past months)
    const [yearNum, monthNum] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(yearNum, monthNum - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(
      prevDate.getMonth() + 1
    ).padStart(2, "0")}`;

    // Determine comparison day (if current month, use today's day; otherwise use last day of month)
    const comparisonDay = isCurrentMonth ? currentDay : daysInMonth;

    // Current month expenses (up to comparison day) - using filtered stats
    const currentMonthExpensesFiltered = expensesForStats
      .filter((t) => {
        const day = parseInt(t.date.split("-")[2], 10);
        return day <= comparisonDay;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Previous month expenses (up to same day) - using filtered stats
    const prevMonthExpenses = transactions
      .filter((t) => {
        if (t.type !== "expense" || t.date.slice(0, 7) !== prevMonth) return false;
        if ((excludedFromStats ?? []).includes(t.category)) return false;
        const day = parseInt(t.date.split("-")[2], 10);
        return day <= comparisonDay;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthDiff = currentMonthExpensesFiltered - prevMonthExpenses;
    const monthDiffPercent =
      prevMonthExpenses > 0 ? (monthDiff / prevMonthExpenses) * 100 : 0;

    // Categories with expenses this month (for daily average modal)
    const categoriesWithExpenses = Array.from(
      new Set(currentMonthExpenses.map((t) => t.category))
    )
      .map((categoryId) => {
        const cat = categoryDefinitions.find((c) => c.id === categoryId);
        const total = currentMonthExpenses
          .filter((t) => t.category === categoryId)
          .reduce((sum, t) => sum + t.amount, 0);
        return cat ? { ...cat, total } : null;
      })
      .filter((c): c is Category & { total: number } => c !== null)
      .sort((a, b) => b.total - a.total);

    return {
      dailyAverage,
      topCategory,
      topDayName,
      topDayTransactions,
      monthDiff,
      monthDiffPercent,
      hasData: currentMonthExpenses.length > 0,
      totalBudget,
      budgetRemaining,
      dailyBudget,
      daysRemaining,
      isCurrentMonth,
      comparisonDay,
      currentMonthExpensesFiltered,
      prevMonthExpenses,
      prevMonth,
      categoriesWithExpenses,
    };
  }, [transactions, selectedMonth, categoryDefinitions, t, excludedFromStats]);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <main className="mx-auto max-w-xl px-4 pt-6 pb-28">
        {/* Header */}
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{t('title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{monthLabel(selectedMonth, getLocale())}</p>

      {/* Stats Filter Button */}
      {quickStats.hasData && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDailyAverageModal(true)}
            className="relative flex items-center gap-2 rounded-lg bg-[#18B7B0] px-3 py-2 hover:bg-[#16a39d] transition-colors active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4 text-white" />
            <span className="text-xs font-medium text-white">
              {t('statsFilter.customize')}
            </span>
            {(excludedFromStats ?? []).length > 0 && (
              <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5">
                <span className="text-[10px] font-bold text-[#18B7B0]">
                  {(excludedFromStats ?? []).length}
                </span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {quickStats.hasData && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Daily Average */}
          <button
            type="button"
            onClick={() => setShowDailyAverageModal(true)}
            className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98] relative"
          >
            <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-gray-300 dark:text-gray-600" />
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('quickStats.dailyAverage')}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {formatAmount(quickStats.dailyAverage)}
            </p>
          </button>

          {/* Top Category */}
          {quickStats.topCategory && (
            <button
              type="button"
              onClick={() => {
                if (quickStats.topCategory) {
                  navigate(`/category/${quickStats.topCategory.id}/month/${selectedMonth}`);
                }
              }}
              className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98] relative"
            >
              <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-gray-300 dark:text-gray-600" />
              {(() => {
                const IconComponent =
                  icons[
                    kebabToPascal(quickStats.topCategory.icon) as keyof typeof icons
                  ];
                return (
                  IconComponent && (
                    <div
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: quickStats.topCategory.color + "20" }}
                    >
                      <IconComponent
                        className="h-5 w-5"
                        style={{ color: quickStats.topCategory.color }}
                      />
                    </div>
                  )
                );
              })()}
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('quickStats.topCategory')}</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                {quickStats.topCategory.name}
              </p>
            </button>
          )}

          {/* Top Day of Week */}
          {quickStats.topDayName && (
            <button
              type="button"
              onClick={() => setShowTopDayModal(true)}
              className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98] relative"
            >
              <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-gray-300 dark:text-gray-600" />
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('quickStats.topDay')}</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-50">{quickStats.topDayName}</p>
            </button>
          )}

          {/* Month Comparison */}
          <button
            type="button"
            onClick={() => setShowComparisonModal(true)}
            className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98] relative"
          >
            <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-gray-300 dark:text-gray-600" />
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('quickStats.monthComparison')}</p>
            <div className="mt-1 flex items-center gap-1">
              {quickStats.monthDiff > 0 ? (
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
              ) : quickStats.monthDiff < 0 ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <icons.Minus className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  quickStats.monthDiff > 0
                    ? "text-red-600 dark:text-red-400"
                    : quickStats.monthDiff < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {quickStats.monthDiff > 0 ? "+" : ""}
                {quickStats.monthDiffPercent.toFixed(0)}%
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Donut Chart Section */}
      <div className="mt-6">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('expensesByCategory.title')}
        </h3>

        {categoryChartData.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <PieChartIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('expensesByCategory.noData')}</p>
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {formatAmount(totalExpenses)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('expensesByCategory.spent')}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {categoryChartData.map((item) => {
                const IconComponent =
                  icons[kebabToPascal(item.icon) as keyof typeof icons];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/category/${item.id}/month/${selectedMonth}`)}
                    className="w-full flex items-center justify-between rounded-lg bg-white dark:bg-gray-900 px-3 py-2 shadow-sm active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {IconComponent && (
                        <IconComponent
                          className="h-4 w-4"
                          style={{ color: item.color }}
                        />
                      )}
                      <span className="text-sm text-gray-900 dark:text-gray-50">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {formatAmount(item.value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bar Chart Section */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('incomeVsExpenses.title')}
        </h3>

        {!hasMonthlyData ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('incomeVsExpenses.noData')}</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={2}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatAmount(Number(value))}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    backgroundColor: "var(--tooltip-bg, white)",
                  }}
                />
                <Bar
                  dataKey="income"
                  name={t('incomeVsExpenses.income')}
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="expense"
                  name={t('incomeVsExpenses.expenses')}
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('incomeVsExpenses.income')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('incomeVsExpenses.expenses')}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trend Chart Section */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('expenseTrend.title')}
        </h3>

        {!hasTrendData ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('expenseTrend.noData')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                interval={1}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) => formatAmount(Number(value))}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name={t('incomeVsExpenses.expenses')}
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: "#EF4444", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "#EF4444" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Daily Average Modal */}
      {showDailyAverageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDailyAverageModal(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[80vh] flex flex-col">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('dailyAverageModal.title')}
            </h3>

            {/* Info Banner */}
            <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {t('dailyAverageModal.infoBanner')}
              </p>
            </div>

            {/* Current Average */}
            <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('dailyAverageModal.currentAverage')}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-50">
                {formatAmount(quickStats.dailyAverage)}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {(excludedFromStats ?? []).length > 0
                  ? t('dailyAverageModal.categoriesExcluded', { count: (excludedFromStats ?? []).length })
                  : t('dailyAverageModal.allIncluded')}
              </p>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {quickStats.categoriesWithExpenses.map((category) => {
                const isIncluded = !(excludedFromStats ?? []).includes(category.id);
                const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategoryFromStats(category.id)}
                    className="w-full flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        isIncluded
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isIncluded && (
                        <icons.Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* Category Icon */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      {IconComponent && (
                        <IconComponent
                          className="h-4 w-4"
                          style={{ color: category.color }}
                        />
                      )}
                    </div>

                    {/* Category Name & Total */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatAmount(category.total)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowDailyAverageModal(false)}
              className="mt-4 w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              {t('dailyAverageModal.close')}
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowComparisonModal(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('comparisonModal.title')}
            </h3>

            {/* Info Banner */}
            <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {quickStats.isCurrentMonth
                  ? t('comparisonModal.infoBannerCurrent', { days: quickStats.comparisonDay })
                  : t('comparisonModal.infoBannerComplete')}
              </p>
            </div>

            {/* Previous Month */}
            <div className="mb-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {monthLabel(quickStats.prevMonth, getLocale())}
                {quickStats.isCurrentMonth && ` ${t('comparisonModal.dayRange', { day: quickStats.comparisonDay })}`}
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
                {formatAmount(quickStats.prevMonthExpenses)}
              </p>
            </div>

            {/* Current Month */}
            <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {monthLabel(selectedMonth, getLocale())}
                {quickStats.isCurrentMonth && ` ${t('comparisonModal.dayRange', { day: quickStats.comparisonDay })}`}
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
                {formatAmount(quickStats.currentMonthExpensesFiltered)}
              </p>
            </div>

            {/* Explanation */}
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              {quickStats.monthDiff > 0 ? (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
              ) : quickStats.monthDiff < 0 ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5" />
              ) : (
                <icons.Minus className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    quickStats.monthDiff > 0
                      ? "text-red-600 dark:text-red-400"
                      : quickStats.monthDiff < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {quickStats.monthDiff > 0 ? "+" : ""}
                  {quickStats.monthDiffPercent.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {quickStats.monthDiff > 0
                    ? t('comparisonModal.spentMore', { percent: Math.abs(quickStats.monthDiffPercent).toFixed(0) })
                    : quickStats.monthDiff < 0
                    ? t('comparisonModal.spentLess', { percent: Math.abs(quickStats.monthDiffPercent).toFixed(0) })
                    : t('comparisonModal.spentSame')}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowComparisonModal(false)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              {t('comparisonModal.understood')}
            </button>
          </div>
        </div>
      )}

      {/* Top Day Modal */}
      {showTopDayModal && quickStats.topDayName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTopDayModal(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {quickStats.topDayName}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {quickStats.topDayTransactions.length} {quickStats.topDayTransactions.length === 1 ? 'transacción' : 'transacciones'} en {monthLabel(selectedMonth, getLocale())}
              </p>
            </div>

            {/* Transactions List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 space-y-2 min-h-0">
              {quickStats.topDayTransactions.map((transaction) => {
                const category = categoryDefinitions.find((c) => c.id === transaction.category);
                const IconComponent = category
                  ? icons[kebabToPascal(category.icon) as keyof typeof icons]
                  : null;

                return (
                  <button
                    key={transaction.id}
                    type="button"
                    onClick={() => {
                      setShowTopDayModal(false);
                      navigate(`/transaction/${transaction.id}`);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Category Icon */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: category ? category.color + "20" : "#E5E7EB" }}
                    >
                      {IconComponent && category && (
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: category.color }}
                        />
                      )}
                    </div>

                    {/* Transaction Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                        {transaction.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date + "T12:00:00").toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 whitespace-nowrap">
                      {formatAmount(transaction.amount)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <div className="p-6 pt-4">
              <button
                type="button"
                onClick={() => setShowTopDayModal(false)}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
