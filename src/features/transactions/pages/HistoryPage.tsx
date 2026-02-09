import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Filter,
  CheckCircle2,
  Tag,
  Download,
  X,
  Check,
  Search,
  Lock,
  Repeat,
} from "lucide-react";
import PageHeader from "@/shared/components/layout/PageHeader";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import { exportTransactionsToCSV } from "@/shared/services/export.service";
import { todayISO } from "@/services/dates.service";
import DatePicker from "@/shared/components/modals/DatePicker";
import PaywallModal from "@/shared/components/modals/PaywallModal";
import * as icons from "lucide-react";

type FilterType = "all" | "expense" | "income";
type FilterStatus = "all" | "paid" | "pending" | "planned";
type FilterRecurring = "all" | "recurring" | "non-recurring";
type DateRangePreset = "this-month" | "last-month" | "custom";

// Helper para convertir kebab-case a PascalCase
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function HistoryPage() {
  const { t } = useTranslation(["history", "home"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { formatAmount } = useCurrency();
  const { canUseFeature } = useSubscription();

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false);
  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
  });

  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("this-month");
  const [customStartDate, setCustomStartDate] = useState(todayISO());
  const [customEndDate, setCustomEndDate] = useState(todayISO());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterRecurring, setFilterRecurring] = useState<FilterRecurring>("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [tempSelectedCategoryIds, setTempSelectedCategoryIds] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Category modal drag states
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCategoryModalAnimating, setIsCategoryModalAnimating] = useState(false);
  const [categoryDragOffset, setCategoryDragOffset] = useState(0);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const categoryStartYRef = useRef(0);

  // Track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);

  // Constants for category modal drag
  const CATEGORY_SHEET_HEIGHT = 600;
  const CATEGORY_DRAG_THRESHOLD = 0.3;

  // Category modal show/hide animation
  useEffect(() => {
    if (showCategoryModal) {
      setIsCategoryModalVisible(true);
      const timer = setTimeout(() => setIsCategoryModalAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsCategoryModalAnimating(false);
      const timer = setTimeout(() => {
        setIsCategoryModalVisible(false);
        setCategoryDragOffset(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showCategoryModal]);

  // Category modal body scroll lock
  useEffect(() => {
    if (showCategoryModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCategoryModal]);

  // Category modal drag handlers
  const handleCategoryDragStart = useCallback((clientY: number) => {
    setIsCategoryDragging(true);
    categoryStartYRef.current = clientY;
  }, []);

  const handleCategoryDragMove = useCallback(
    (clientY: number) => {
      if (!isCategoryDragging) return;
      const diff = clientY - categoryStartYRef.current;
      if (diff > 0) {
        setCategoryDragOffset(Math.min(diff, CATEGORY_SHEET_HEIGHT));
      } else {
        setCategoryDragOffset(0);
      }
    },
    [isCategoryDragging, CATEGORY_SHEET_HEIGHT]
  );

  const handleCategoryDragEnd = useCallback(() => {
    if (!isCategoryDragging) return;
    setIsCategoryDragging(false);
    if (categoryDragOffset > CATEGORY_SHEET_HEIGHT * CATEGORY_DRAG_THRESHOLD) {
      setShowCategoryModal(false);
    }
    setCategoryDragOffset(0);
  }, [isCategoryDragging, categoryDragOffset, CATEGORY_SHEET_HEIGHT, CATEGORY_DRAG_THRESHOLD]);

  // Category modal touch events
  const handleCategoryTouchStart = useCallback(
    (e: React.TouchEvent) => handleCategoryDragStart(e.touches[0].clientY),
    [handleCategoryDragStart]
  );
  const handleCategoryTouchMove = useCallback(
    (e: React.TouchEvent) => handleCategoryDragMove(e.touches[0].clientY),
    [handleCategoryDragMove]
  );
  const handleCategoryTouchEnd = useCallback(
    () => handleCategoryDragEnd(),
    [handleCategoryDragEnd]
  );

  // Category modal mouse events for handle
  const handleCategoryMouseDown = useCallback(
    (e: React.MouseEvent) => handleCategoryDragStart(e.clientY),
    [handleCategoryDragStart]
  );

  useEffect(() => {
    if (!isCategoryDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleCategoryDragMove(e.clientY);
    const handleMouseUp = () => handleCategoryDragEnd();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isCategoryDragging, handleCategoryDragMove, handleCategoryDragEnd]);

  // Load filters from localStorage on mount (or reset if coming from home)
  useEffect(() => {
    const shouldReset = (location.state as any)?.resetFilters;

    try {
      if (shouldReset) {
        // Coming from home button - clear saved filters and use defaults
        localStorage.removeItem("history-filters");
        // Clear the state so it doesn't persist on back navigation
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        // Coming from back navigation - restore saved filters
        const saved = localStorage.getItem("history-filters");
        if (saved) {
          const filters = JSON.parse(saved);
          if (filters.dateRangePreset) setDateRangePreset(filters.dateRangePreset);
          if (filters.customStartDate) setCustomStartDate(filters.customStartDate);
          if (filters.customEndDate) setCustomEndDate(filters.customEndDate);
          if (filters.searchQuery) setSearchQuery(filters.searchQuery);
          if (filters.filterType) setFilterType(filters.filterType);
          if (filters.filterStatus) setFilterStatus(filters.filterStatus);
          if (filters.filterRecurring) setFilterRecurring(filters.filterRecurring);
          if (filters.selectedCategoryIds) setSelectedCategoryIds(filters.selectedCategoryIds);
          if (filters.minAmount) setMinAmount(filters.minAmount);
          if (filters.maxAmount) setMaxAmount(filters.maxAmount);
        }
      }
    } catch (error) {
      console.error("[HistoryPage] Error loading filters:", error);
    } finally {
      // Mark initialization as complete after attempting to load
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save filters to localStorage whenever they change (but only after initialization)
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initial load

    try {
      const filters = {
        dateRangePreset,
        customStartDate,
        customEndDate,
        searchQuery,
        filterType,
        filterStatus,
        filterRecurring,
        selectedCategoryIds,
        minAmount,
        maxAmount,
      };
      localStorage.setItem("history-filters", JSON.stringify(filters));
    } catch (error) {
      console.error("[HistoryPage] Error saving filters:", error);
    }
  }, [
    isInitialized,
    dateRangePreset,
    customStartDate,
    customEndDate,
    searchQuery,
    filterType,
    filterStatus,
    filterRecurring,
    selectedCategoryIds,
    minAmount,
    maxAmount,
  ]);

  // Get current month for filtering
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Get previous month for filtering
  const previousMonth = useMemo(() => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return `${year}-${String(prevMonth).padStart(2, "0")}`;
  }, []);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Date range filter
    if (dateRangePreset === "this-month") {
      result = result.filter((t) => t.date.slice(0, 7) === currentMonth);
    } else if (dateRangePreset === "last-month") {
      result = result.filter((t) => t.date.slice(0, 7) === previousMonth);
    } else if (dateRangePreset === "custom") {
      result = result.filter((t) => t.date >= customStartDate && t.date <= customEndDate);
    }

    // Search filter (by name/description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(query));
    }

    // Type filter
    if (filterType === "expense") {
      result = result.filter((t) => t.type === "expense");
    } else if (filterType === "income") {
      result = result.filter((t) => t.type === "income");
    }

    // Status filter
    if (filterStatus === "paid") {
      result = result.filter((t) => t.status === "paid" || !t.status);
    } else if (filterStatus === "pending") {
      result = result.filter((t) => t.status === "pending");
    } else if (filterStatus === "planned") {
      result = result.filter((t) => t.status === "planned");
    }

    // Recurring filter
    if (filterRecurring === "recurring") {
      result = result.filter((t) =>
        (t.schedule?.enabled === true) || (t.sourceTemplateId !== undefined)
      );
    } else if (filterRecurring === "non-recurring") {
      result = result.filter((t) =>
        !t.schedule?.enabled && !t.sourceTemplateId
      );
    }

    // Category filter (multiple selection)
    if (selectedCategoryIds.length > 0) {
      result = result.filter((t) => selectedCategoryIds.includes(t.category));
    }

    // Amount range filter
    const min = minAmount ? parseFloat(minAmount) : 0;
    const max = maxAmount ? parseFloat(maxAmount) : Infinity;
    result = result.filter((t) => t.amount >= min && t.amount <= max);

    // Sort by date descending
    result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [
    transactions,
    dateRangePreset,
    customStartDate,
    customEndDate,
    searchQuery,
    filterType,
    filterStatus,
    filterRecurring,
    selectedCategoryIds,
    minAmount,
    maxAmount,
    currentMonth,
    previousMonth,
  ]);

  // Transactions filtered WITHOUT category filter (for category counts)
  const transactionsWithoutCategoryFilter = useMemo(() => {
    let result = [...transactions];

    // Date range filter
    if (dateRangePreset === "this-month") {
      result = result.filter((t) => t.date.slice(0, 7) === currentMonth);
    } else if (dateRangePreset === "last-month") {
      result = result.filter((t) => t.date.slice(0, 7) === previousMonth);
    } else if (dateRangePreset === "custom") {
      result = result.filter((t) => t.date >= customStartDate && t.date <= customEndDate);
    }

    // Search filter (by name/description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(query));
    }

    // Type filter
    if (filterType === "expense") {
      result = result.filter((t) => t.type === "expense");
    } else if (filterType === "income") {
      result = result.filter((t) => t.type === "income");
    }

    // Status filter
    if (filterStatus === "paid") {
      result = result.filter((t) => t.status === "paid" || !t.status);
    } else if (filterStatus === "pending") {
      result = result.filter((t) => t.status === "pending");
    } else if (filterStatus === "planned") {
      result = result.filter((t) => t.status === "planned");
    }

    // Recurring filter
    if (filterRecurring === "recurring") {
      result = result.filter((t) =>
        (t.schedule?.enabled === true) || (t.sourceTemplateId !== undefined)
      );
    } else if (filterRecurring === "non-recurring") {
      result = result.filter((t) =>
        !t.schedule?.enabled && !t.sourceTemplateId
      );
    }

    // Amount range filter
    const min = minAmount ? parseFloat(minAmount) : 0;
    const max = maxAmount ? parseFloat(maxAmount) : Infinity;
    result = result.filter((t) => t.amount >= min && t.amount <= max);

    return result;
  }, [
    transactions,
    dateRangePreset,
    customStartDate,
    customEndDate,
    searchQuery,
    filterType,
    filterStatus,
    filterRecurring,
    minAmount,
    maxAmount,
    currentMonth,
    previousMonth,
  ]);

  // Count transactions per category (based on filters without category filter)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    transactionsWithoutCategoryFilter.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    return counts;
  }, [transactionsWithoutCategoryFilter]);

  // Sort and filter categories by count
  const sortedAndFilteredCategories = useMemo(() => {
    return [...categoryDefinitions]
      .filter((cat) => (categoryCounts[cat.id] || 0) > 0) // Only categories with transactions
      .sort((a, b) => {
        const countDiff = (categoryCounts[b.id] || 0) - (categoryCounts[a.id] || 0);
        if (countDiff !== 0) return countDiff; // Sort by count (descending)
        return a.name.localeCompare(b.name); // Alphabetical if tie
      });
  }, [categoryDefinitions, categoryCounts]);

  // Calculate balance from filtered transactions
  const filteredBalance = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    return income - expense;
  }, [filteredTransactions]);

  const handleExport = async () => {
    // Check if user can export
    if (!canUseFeature('export_data')) {
      setShowPaywall(true);
      return;
    }

    if (filteredTransactions.length === 0) {
      alert(t("export.noTransactions", { ns: "home" }));
      return;
    }

    try {
      const filename = `historial-${dateRangePreset}-${new Date().toISOString().slice(0, 10)}`;
      await exportTransactionsToCSV(filteredTransactions, categoryDefinitions, filename);
    } catch (error) {
      console.error('[HistoryPage] Export failed:', error);
      alert('Error al exportar el archivo. Por favor, inténtalo de nuevo.');
    }
  };

  const handleApplyCustomDates = () => {
    setDateRangePreset("custom");
    setShowCustomDateModal(false);
  };

  const handleOpenCategoryModal = () => {
    setTempSelectedCategoryIds([...selectedCategoryIds]);
    setShowCategoryModal(true);
  };

  const handleToggleCategory = (categoryId: string) => {
    setTempSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApplyCategories = () => {
    setSelectedCategoryIds([...tempSelectedCategoryIds]);
    setShowCategoryModal(false);
  };

  const handleClearCategories = () => {
    setTempSelectedCategoryIds([]);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t("title")} />

      {/* Filters Section */}
      <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-4">
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#18B7B0] focus:ring-2 focus:ring-[#18B7B0]/20 transition"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Date Range */}
            <button
            type="button"
            onClick={() => setExpandedFilter(expandedFilter === "date" ? null : "date")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              expandedFilter === "date" || dateRangePreset !== "this-month"
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Calendar size={14} />
            {dateRangePreset === "this-month" && t("filters.thisMonth")}
            {dateRangePreset === "last-month" && t("filters.lastMonth")}
            {dateRangePreset === "custom" && t("filters.custom")}
          </button>

          {/* Type */}
          <button
            type="button"
            onClick={() => setExpandedFilter(expandedFilter === "type" ? null : "type")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              expandedFilter === "type" || filterType !== "all"
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Filter size={14} />
            {filterType === "all" && t("filters.type")}
            {filterType === "income" && t("filters.income")}
            {filterType === "expense" && t("filters.expenses")}
          </button>

          {/* Status */}
          <button
            type="button"
            onClick={() => {
              if (!canUseFeature('history_filters')) {
                setShowPaywall(true);
              } else {
                setExpandedFilter(expandedFilter === "status" ? null : "status");
              }
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              !canUseFeature('history_filters')
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-60"
                : expandedFilter === "status" || filterStatus !== "all"
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {!canUseFeature('history_filters') ? (
              <Lock size={14} />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {filterStatus === "all" && t("filters.status")}
            {filterStatus === "paid" && t("filters.paid")}
            {filterStatus === "pending" && t("filters.pendingStatus")}
            {filterStatus === "planned" && t("filters.planned")}
          </button>

          {/* Category */}
          <button
            type="button"
            onClick={() => {
              if (!canUseFeature('history_filters')) {
                setShowPaywall(true);
              } else {
                handleOpenCategoryModal();
              }
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              !canUseFeature('history_filters')
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-60"
                : selectedCategoryIds.length > 0
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {!canUseFeature('history_filters') ? (
              <Lock size={14} />
            ) : (
              <Tag size={14} />
            )}
            {selectedCategoryIds.length === 0 && t("filters.category")}
            {selectedCategoryIds.length === 1 && (categoryDefinitions.find((c) => c.id === selectedCategoryIds[0])?.name || t("filters.category"))}
            {selectedCategoryIds.length > 1 && t("filters.categories", { count: selectedCategoryIds.length })}
          </button>

          {/* Monto */}
          <button
            type="button"
            onClick={() => {
              if (!canUseFeature('history_filters')) {
                setShowPaywall(true);
              } else {
                setExpandedFilter(expandedFilter === "amount" ? null : "amount");
              }
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              !canUseFeature('history_filters')
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-60"
                : expandedFilter === "amount" || minAmount || maxAmount
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {!canUseFeature('history_filters') && <Lock size={14} />}
            {t("filters.amount")}
          </button>

          {/* Recurrentes */}
          <button
            type="button"
            onClick={() => {
              if (!canUseFeature('history_filters')) {
                setShowPaywall(true);
              } else {
                setExpandedFilter(expandedFilter === "recurring" ? null : "recurring");
              }
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              !canUseFeature('history_filters')
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-60"
                : expandedFilter === "recurring" || filterRecurring !== "all"
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {!canUseFeature('history_filters') ? (
              <Lock size={14} />
            ) : (
              <Repeat size={14} />
            )}
            {filterRecurring === "all" && t("filters.recurring")}
            {filterRecurring === "recurring" && t("filters.recurringOnly")}
            {filterRecurring === "non-recurring" && t("filters.nonRecurring")}
          </button>
        </div>
      </div>

        {/* Expanded Filter Options */}
        {expandedFilter === "date" && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDateRangePreset("this-month");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  dateRangePreset === "this-month"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.thisMonth")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateRangePreset("last-month");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  dateRangePreset === "last-month"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.lastMonth")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomDateModal(true);
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  dateRangePreset === "custom"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.custom")}
              </button>
            </div>
          </div>
        )}

        {expandedFilter === "type" && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterType("all");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === "all"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.allTypes")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType("income");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === "income"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.income")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType("expense");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === "expense"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.expenses")}
              </button>
            </div>
          </div>
        )}

        {expandedFilter === "status" && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("all");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === "all"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.allStatus")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("paid");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === "paid"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.paid")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("pending");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === "pending"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.pendingStatus")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("planned");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === "planned"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.planned")}
              </button>
            </div>
          </div>
        )}

        {expandedFilter === "amount" && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("filters.minimum")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#18B7B0] focus:ring-2 focus:ring-[#18B7B0]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("filters.maximum")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={t("filters.noLimit")}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#18B7B0] focus:ring-2 focus:ring-[#18B7B0]/20"
                />
              </div>
            </div>
          </div>
        )}

        {expandedFilter === "recurring" && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterRecurring("all");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterRecurring === "all"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.allRecurring")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterRecurring("recurring");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterRecurring === "recurring"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.recurringOnly")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterRecurring("non-recurring");
                  setExpandedFilter(null);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterRecurring === "non-recurring"
                    ? "bg-[#18B7B0] text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {t("filters.nonRecurring")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="mx-auto w-full max-w-xl px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          {/* Left Column */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("results.title", { count: filteredTransactions.length })}
            </h2>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
              className={`flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                !canUseFeature('export_data')
                  ? 'text-gray-500'
                  : 'text-[#18B7B0] hover:text-[#159d97]'
              }`}
            >
              {!canUseFeature('export_data') ? (
                <>
                  <Lock size={16} />
                  {t("results.exportCSV")}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900">
                    PRO
                  </span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  {t("results.exportCSV")}
                </>
              )}
            </button>
          </div>

          {/* Right Column - Balance */}
          <div className="text-right">
            <p className={`text-sm font-bold whitespace-nowrap ${
              filteredBalance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-900 dark:text-gray-50"
            }`}>
              {filteredBalance >= 0 ? "+" : "-"} {formatAmount(Math.abs(filteredBalance))}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 mx-auto w-full max-w-xl bg-white dark:bg-gray-900 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("results.noResults")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredTransactions.map((transaction) => {
              const category = categoryDefinitions.find((c) => c.id === transaction.category);
              const IconComponent = category
                ? (icons[kebabToPascal(category.icon) as keyof typeof icons] as any)
                : null;

              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => navigate(`/edit/${transaction.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: category ? category.color + "20" : "#6B728020",
                    }}
                  >
                    {IconComponent && category && (
                      <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-gray-900 dark:text-gray-50 text-sm">
                        {transaction.name.trim() || category?.name || "Sin categoría"}
                      </p>
                      {/* Status Badges */}
                      {transaction.status === "pending" && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                          {t("filters.pendingStatus")}
                        </span>
                      )}
                      {transaction.status === "planned" && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {t("filters.planned")}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {category ? category.name : "Sin categoría"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(transaction.date + "T12:00:00").toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p
                      className={`whitespace-nowrap font-semibold text-sm ${
                        transaction.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-900 dark:text-gray-50"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"} {formatAmount(transaction.amount)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Date Range Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-[70]">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCustomDateModal(false)}
          />

          {/* Bottom Sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl">
            {/* Drag Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Content */}
            <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              {/* Title */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("filters.custom")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Date Inputs */}
              <div className="space-y-3 mb-6">
                {/* Start Date */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("filters.startDate")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStartDatePicker(true)}
                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-900 dark:text-gray-50">
                        {new Date(customStartDate + "T12:00:00").toLocaleDateString("es-CO", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </button>
                </div>

                {/* End Date */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("filters.endDate")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEndDatePicker(true)}
                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-900 dark:text-gray-50">
                        {new Date(customEndDate + "T12:00:00").toLocaleDateString("es-CO", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("filters.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDates}
                  className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#159d97] transition-colors"
                >
                  {t("filters.apply")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {isCategoryModalVisible && (
        <div className="fixed inset-0 z-[70]">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black"
            onClick={() => setShowCategoryModal(false)}
            style={{
              opacity: isCategoryModalAnimating
                ? Math.max(0, 1 - categoryDragOffset / CATEGORY_SHEET_HEIGHT) * 0.5
                : 0,
              transition: isCategoryDragging ? "none" : "opacity 300ms ease-out",
            }}
            aria-label="Close"
          />

          {/* Bottom Sheet */}
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
            style={{
              maxHeight: `${CATEGORY_SHEET_HEIGHT}px`,
              transform: `translateY(${
                isCategoryModalAnimating ? categoryDragOffset : CATEGORY_SHEET_HEIGHT
              }px)`,
              transition: isCategoryDragging
                ? "none"
                : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {/* Header - drag enabled only here */}
            <div
              className="flex-none"
              onTouchStart={handleCategoryTouchStart}
              onTouchMove={handleCategoryTouchMove}
              onTouchEnd={handleCategoryTouchEnd}
            >
              {/* Drag Handle */}
              <div
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
                onMouseDown={handleCategoryMouseDown}
              >
                <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("filters.category")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Categories List (Scrollable) - No drag events here */}
            <div className="flex-1 overflow-y-auto px-4 min-h-0">
              <div className="space-y-2 pb-4">
                {sortedAndFilteredCategories.map((category) => {
                  const IconComponent = icons[
                    kebabToPascal(category.icon) as keyof typeof icons
                  ] as any;
                  const isSelected = tempSelectedCategoryIds.includes(category.id);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleToggleCategory(category.id)}
                      className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Category Icon */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        {IconComponent && (
                          <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                        )}
                      </div>

                      {/* Category Name + Count */}
                      <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-50">
                        {category.name}{" "}
                        <span className="text-gray-500 dark:text-gray-400">
                          ({categoryCounts[category.id] || 0})
                        </span>
                      </span>

                      {/* Checkbox */}
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all ${
                          isSelected
                            ? "bg-emerald-500 dark:bg-emerald-600"
                            : "border-2 border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={handleClearCategories}
                  disabled={tempSelectedCategoryIds.length === 0}
                  className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t("filters.clear")}
                </button>
                <button
                  type="button"
                  onClick={handleApplyCategories}
                  className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#159d97] transition-colors"
                >
                  {t("filters.apply")} ({tempSelectedCategoryIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DatePicker for Start Date */}
      <DatePicker
        open={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        value={customStartDate}
        onChange={setCustomStartDate}
      />

      {/* DatePicker for End Date */}
      <DatePicker
        open={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        value={customEndDate}
        onChange={setCustomEndDate}
      />

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="history_filters"
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
