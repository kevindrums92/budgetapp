import { useMemo, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
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
import { icons, PieChart as PieChartIcon, BarChart3, TrendingUp, CheckCircle, AlertCircle, ChevronRight, DollarSign, Calendar, SlidersHorizontal, LayoutGrid, Check } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useBudgetStore } from "@/state/budget.store";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/features/currency";
import { useHeaderActions } from "@/shared/contexts/headerActions.context";
import { kebabToPascal } from "@/shared/utils/string.utils";
import FutureBalanceChart from "@/features/forecasting/components/FutureBalanceChart";
import SortableSectionCard from "../components/SortableSectionCard";
import FilterStatisticsSheet from "../components/FilterStatisticsSheet";
import ComparisonSheet from "../components/ComparisonSheet";
import TopDaySheet from "../components/TopDaySheet";
import DailyAverageBreakdownSheet from "../components/DailyAverageBreakdownSheet";
import TopCategorySheet from "../components/TopCategorySheet";
import BudgetSuggestionBanner from "../components/BudgetSuggestionBanner";
import AddEditBudgetModal from "@/features/budget/components/AddEditBudgetModal";
import SpotlightTour from "@/features/tour/components/SpotlightTour";
import { useSpotlightTour } from "@/features/tour/hooks/useSpotlightTour";
import { statsTour } from "@/features/tour/tours/statsTour";

const DEFAULT_STATS_LAYOUT = ['quickStats', 'donutChart', 'barChart', 'trendChart', 'futureBalance'];

// Get last N months ending at a specific month (YYYY-MM)
function getMonthsEndingAt(count: number, endMonth: string): string[] {
  const [year, month] = endMonth.split("-").map(Number);
  const months: string[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
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
  const budgets = useBudgetStore((s) => s.budgets);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const statsLayout = useBudgetStore((s) => s.statsLayout);
  const setStatsLayout = useBudgetStore((s) => s.setStatsLayout);

  const { setAction } = useHeaderActions();

  // DnD sensors for drag-and-drop reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [editLayout, setEditLayout] = useState<string[]>(DEFAULT_STATS_LAYOUT);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showDailyAverageModal, setShowDailyAverageModal] = useState(false);
  const [showDailyAverageBreakdownModal, setShowDailyAverageBreakdownModal] = useState(false);
  const [showTopDayModal, setShowTopDayModal] = useState(false);
  const [showTopCategoryModal, setShowTopCategoryModal] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(() => {
    try { return localStorage.getItem("budget.showAllCategories") === "true"; } catch { return false; }
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const excludedFromStats = useBudgetStore((s) => s.excludedFromStats);

  // Current layout (from store or default)
  const currentLayout = useMemo(() => {
    const stored = statsLayout ?? DEFAULT_STATS_LAYOUT;
    // Ensure all sections exist (handle new sections added after user saved layout)
    const missing = DEFAULT_STATS_LAYOUT.filter((id) => !stored.includes(id));
    return [...stored.filter((id) => DEFAULT_STATS_LAYOUT.includes(id)), ...missing];
  }, [statsLayout]);

  // Spotlight tour
  const { isActive: isTourActive, startTour, completeTour } = useSpotlightTour("stats");

  useEffect(() => {
    startTour();
  }, [startTour]);

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

  // Budget category IDs that cover the selected month (includes annual/custom period budgets)
  const budgetedCategoryIdsForMonth = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const firstDay = `${selectedMonth}-01`;
    const lastDay = `${selectedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

    return new Set(
      budgets
        .filter((b) => b.status === "active" && b.period.startDate <= lastDay && b.period.endDate >= firstDay)
        .map((b) => b.categoryId)
    );
  }, [budgets, selectedMonth]);

  // Smart budget suggestion: top category without recurring txs and without existing budget
  // Only show for the current month — suggesting a limit for a past month has no value
  const budgetSuggestion = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (categoryChartData.length === 0 || selectedMonth !== currentMonthKey) return null;

    for (const cat of categoryChartData) {
      // Skip if any active budget covers this category for the selected month
      if (budgetedCategoryIdsForMonth.has(cat.id)) continue;

      const catTxs = transactions.filter(
        (t) => t.category === cat.id && t.type === "expense" && t.date.slice(0, 7) === selectedMonth
      );
      const recurringCount = catTxs.filter(
        (t) => t.schedule?.enabled || t.sourceTemplateId
      ).length;
      const recurringRatio = catTxs.length > 0 ? recurringCount / catTxs.length : 0;

      if (recurringRatio <= 0.5) return cat;
    }
    return null;
  }, [categoryChartData, budgetedCategoryIdsForMonth, transactions, selectedMonth]);

  // Bar chart data (income vs expenses for last 6 months ending at selected month)
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const months = getMonthsEndingAt(6, selectedMonth);
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
  }, [transactions, selectedMonth, getLocale]);

  const hasMonthlyData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  // Trend chart data (expenses for last 12 months ending at selected month)
  const trendData = useMemo<TrendData[]>(() => {
    const months = getMonthsEndingAt(12, selectedMonth);
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
  }, [transactions, selectedMonth, getLocale]);

  const hasTrendData = trendData.some((d) => d.expense > 0);

  // Quick stats for selected month
  const quickStats = useMemo(() => {
    // Get today's date for filtering and calculations
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // All expenses in the month (for category list in filter modal)
    const allMonthExpenses = transactions.filter(
      (t) => t.type === "expense" && t.date.slice(0, 7) === selectedMonth
    );

    // Current expenses (only up to today, for stats calculations)
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === "expense" && t.date.slice(0, 7) === selectedMonth && t.date <= todayStr
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

    // Determine current day and if this is the current month
    const isCurrentMonth = selectedMonth === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
    const daysRemaining = daysInMonth - currentDay;

    // Daily average (divide by days elapsed, not total days in month)
    const expensesForAverage = expensesForStats;
    const totalForAverage = expensesForAverage.reduce((sum, t) => sum + t.amount, 0);
    const dailyAverage = totalForAverage / currentDay;

    // Total monthly budget (will be calculated from budgets array in future)
    const totalBudget = 0; // TODO: Calculate from budgets array when Budget feature is implemented

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

    // Get all transactions for the top category (using filtered stats)
    const topCategoryTransactions = topCategoryId
      ? expensesForStats.filter((t) => t.category === topCategoryId).sort((a, b) => {
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
    // Show ALL expense categories, not just those with transactions
    const categoriesWithExpenses = categoryDefinitions
      .filter((cat) => cat.type === "expense")
      .map((cat) => {
        const total = allMonthExpenses
          .filter((t) => t.category === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...cat, total };
      })
      .sort((a, b) => b.total - a.total);

    return {
      dailyAverage,
      topCategory,
      topCategoryTransactions,
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
      totalForAverage,
      daysInMonth,
      currentDay,
    };
  }, [transactions, selectedMonth, categoryDefinitions, t, excludedFromStats]);

  // Keep a ref to editLayout so the save handler always reads the latest value
  const editLayoutRef = useRef(editLayout);
  useEffect(() => {
    editLayoutRef.current = editLayout;
  }, [editLayout]);

  // Edit mode handlers
  const handleEnterEditMode = useCallback(() => {
    setEditLayout([...currentLayout]);
    setIsEditMode(true);
  }, [currentLayout]);

  const handleSaveLayout = useCallback(() => {
    setStatsLayout(editLayoutRef.current);
    setIsEditMode(false);
  }, [setStatsLayout]);

  const handleMoveSection = useCallback((index: number, direction: 'up' | 'down') => {
    setEditLayout((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditLayout((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  // Inject edit layout button into TopHeader
  useEffect(() => {
    if (isEditMode) {
      setAction(
        <button
          type="button"
          onClick={handleSaveLayout}
          className="flex h-9 items-center gap-1.5 rounded-full bg-emerald-500 px-3 text-sm font-medium text-white transition-all active:scale-95"
        >
          <Check size={16} />
          {t('layout.done')}
        </button>
      );
    } else {
      setAction(
        <button
          type="button"
          onClick={handleEnterEditMode}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
          aria-label={t('layout.editLayout')}
        >
          <LayoutGrid size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      );
    }

    return () => setAction(null);
  }, [isEditMode, setAction, handleEnterEditMode, handleSaveLayout, t]);

  // Section renderers
  const sectionRenderers: Record<string, ReactNode> = {
    quickStats: (
      <div key="quickStats">
        {/* Stats Filter Button */}
        {quickStats.hasData && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('quickInsights')}
            </h3>
            <button
              type="button"
              onClick={() => setShowDailyAverageModal(true)}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 transition-colors active:scale-95 bg-[#18B7B0] hover:bg-[#16a39d]"
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

        {/* Quick Stats Grid */}
        {quickStats.hasData && (
          <div data-tour="stats-quick-cards" className="mt-4 grid grid-cols-2 gap-3">
            {/* Daily Average */}
            <button
              type="button"
              onClick={() => setShowDailyAverageBreakdownModal(true)}
              className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left transition-colors active:scale-[0.98] relative hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
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
                onClick={() => setShowTopCategoryModal(true)}
                className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left transition-colors active:scale-[0.98] relative hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
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
                className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left transition-colors active:scale-[0.98] relative hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
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
              className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left transition-colors active:scale-[0.98] relative hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
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
                  className={`text-sm font-medium ${quickStats.monthDiff > 0
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
      </div>
    ),

    donutChart: (
      <div key="donutChart" data-tour="stats-donut-chart">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('expensesByCategory.title')}
        </h3>

        {categoryChartData.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <PieChartIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('expensesByCategory.noData')}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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
            <div className="mt-4 relative">
              <div className="space-y-2">
                {categoryChartData.slice(0, showAllCategories ? undefined : 4).map((item) => {
                  const IconComponent =
                    icons[kebabToPascal(item.icon) as keyof typeof icons];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        // Find active budget for this category in selected month
                        const [yearStr, monthStr] = selectedMonth.split("-");
                        const year = Number(yearStr);
                        const month = Number(monthStr);
                        const firstDay = `${selectedMonth}-01`;
                        const lastDay = `${selectedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

                        const activeBudget = budgets.find(
                          (b) =>
                            b.status === "active" &&
                            b.categoryId === item.id &&
                            b.period.startDate <= lastDay &&
                            b.period.endDate >= firstDay
                        );

                        if (activeBudget) {
                          // Navigate to budget detail
                          navigate(`/plan/${activeBudget.id}`);
                        } else {
                          // Navigate to category month detail
                          navigate(`/category/${item.id}/month/${selectedMonth}`);
                        }
                      }}
                      className="w-full flex items-center justify-between rounded-lg bg-white dark:bg-gray-900 px-3 py-2 shadow-sm transition-colors active:bg-gray-50 dark:active:bg-gray-800 cursor-pointer"
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {formatAmount(item.value)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Smart budget suggestion */}
              {budgetSuggestion && (
                <BudgetSuggestionBanner
                  categoryId={budgetSuggestion.id}
                  categoryName={budgetSuggestion.name}
                  categoryIcon={budgetSuggestion.icon}
                  categoryColor={budgetSuggestion.color}
                  amount={budgetSuggestion.value}
                  selectedMonth={selectedMonth}
                  onCreateBudget={() => {
                    sessionStorage.setItem("newCategoryId", budgetSuggestion.id);
                    setShowBudgetModal(true);
                  }}
                />
              )}

              {/* "View all / View less" toggle */}
              {categoryChartData.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((prev) => {
                    const next = !prev;
                    try { localStorage.setItem("budget.showAllCategories", String(next)); } catch { /* noop */ }
                    return next;
                  })}
                  className="mt-3 w-full text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2 transition-colors hover:text-gray-700 dark:hover:text-gray-300 active:scale-[0.98]"
                >
                  {showAllCategories ? t('expensesByCategory.viewLess') : t('expensesByCategory.viewAll')}
                </button>
              )}

            </div>
          </div>
        )}
      </div>
    ),

    barChart: (
      <div key="barChart" className="relative">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('incomeVsExpenses.title')}
        </h3>

        {!hasMonthlyData ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('incomeVsExpenses.noData')}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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
          </div>
        )}
      </div>
    ),

    trendChart: (
      <div key="trendChart" className="relative">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('expenseTrend.title')}
        </h3>

        {!hasTrendData ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('expenseTrend.noData')}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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
          </div>
        )}
      </div>
    ),

    futureBalance: (
      <div key="futureBalance">
        <FutureBalanceChart days={90} />
      </div>
    ),
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen relative">
      <main className="mx-auto max-w-xl px-4 pb-28">
        {/* Edit Mode: Inline banner + reorderable section cards */}
        {isEditMode ? (
          <div className="mt-4">
            {/* Edit mode banner */}
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#18B7B0]/10 dark:bg-[#18B7B0]/20 px-4 py-3">
              <LayoutGrid className="h-5 w-5 shrink-0 text-[#18B7B0]" />
              <p className="text-sm font-medium text-[#18B7B0]">
                {t('layout.editBanner')}
              </p>
            </div>

            {/* Drag-and-drop reorderable section cards */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={editLayout} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {editLayout.map((sectionId, index) => (
                    <SortableSectionCard
                      key={sectionId}
                      sectionId={sectionId}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === editLayout.length - 1}
                      onMove={handleMoveSection}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Done button (bottom) */}
            <button
              type="button"
              onClick={handleSaveLayout}
              className="mt-4 w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-semibold text-white transition-all active:scale-[0.98]"
            >
              {t('layout.done')}
            </button>
          </div>
        ) : (
          /* Normal mode: Sections rendered by layout order */
          <div className="mt-4 space-y-6">
            {currentLayout.map((sectionId) => sectionRenderers[sectionId])}
          </div>
        )}

        {/* Filter Statistics Sheet */}
        <FilterStatisticsSheet
          open={showDailyAverageModal}
          onClose={() => setShowDailyAverageModal(false)}
          categoriesWithExpenses={quickStats.categoriesWithExpenses}
        />

        {/* Comparison Sheet */}
        <ComparisonSheet
          open={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          isCurrentMonth={quickStats.isCurrentMonth}
          comparisonDay={quickStats.comparisonDay}
          prevMonth={quickStats.prevMonth}
          prevMonthExpenses={quickStats.prevMonthExpenses}
          currentMonthExpensesFiltered={quickStats.currentMonthExpensesFiltered}
          selectedMonth={selectedMonth}
          monthDiff={quickStats.monthDiff}
          monthDiffPercent={quickStats.monthDiffPercent}
          excludedCategoriesCount={(excludedFromStats ?? []).length}
        />

        {/* Top Day Sheet */}
        <TopDaySheet
          open={showTopDayModal}
          onClose={() => setShowTopDayModal(false)}
          topDayName={quickStats.topDayName}
          topDayTransactions={quickStats.topDayTransactions}
          selectedMonth={selectedMonth}
          categoryDefinitions={categoryDefinitions}
          excludedCategoriesCount={(excludedFromStats ?? []).length}
        />

        {/* Daily Average Breakdown Sheet */}
        <DailyAverageBreakdownSheet
          open={showDailyAverageBreakdownModal}
          onClose={() => setShowDailyAverageBreakdownModal(false)}
          totalForAverage={quickStats.totalForAverage}
          currentDay={quickStats.currentDay}
          isCurrentMonth={quickStats.isCurrentMonth}
          dailyAverage={quickStats.dailyAverage}
          daysInMonth={quickStats.daysInMonth}
          excludedCategoriesCount={(excludedFromStats ?? []).length}
        />

        {/* Top Category Sheet */}
        <TopCategorySheet
          open={showTopCategoryModal}
          onClose={() => setShowTopCategoryModal(false)}
          topCategory={quickStats.topCategory}
          topCategoryTransactions={quickStats.topCategoryTransactions}
          selectedMonth={selectedMonth}
          categoryDefinitions={categoryDefinitions}
          excludedCategoriesCount={(excludedFromStats ?? []).length}
        />

        {/* Add/Edit Budget Modal */}
        <AddEditBudgetModal
          open={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
        />
      </main>

      {/* Spotlight Tour */}
      <SpotlightTour
        config={statsTour}
        isActive={isTourActive}
        onComplete={completeTour}
      />
    </div>
  );
}
