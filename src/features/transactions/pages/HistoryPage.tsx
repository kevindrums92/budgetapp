import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Calendar,
  Filter,
  CheckCircle2,
  Tag,
  Download,
  X,
  Check,
  Search,
} from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { exportTransactionsToCSV } from "@/shared/services/export.service";
import { todayISO } from "@/services/dates.service";
import DatePicker from "@/shared/components/modals/DatePicker";
import * as icons from "lucide-react";

type FilterType = "all" | "expense" | "income";
type FilterStatus = "all" | "paid" | "pending" | "planned";
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

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("this-month");
  const [customStartDate, setCustomStartDate] = useState(todayISO());
  const [customEndDate, setCustomEndDate] = useState(todayISO());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [tempSelectedCategoryIds, setTempSelectedCategoryIds] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);

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
    selectedCategoryIds,
    minAmount,
    maxAmount,
    currentMonth,
    previousMonth,
  ]);

  const handleExport = async () => {
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
      {/* Header */}
      <header
        className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-black/30 px-4 pb-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-900 dark:text-gray-50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t("title")}
          </h1>
        </div>
      </header>

      {/* Filters Section */}
      <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-4">
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por descripción..."
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
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
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
            {dateRangePreset === "this-month" && "Este Mes"}
            {dateRangePreset === "last-month" && "Mes Pasado"}
            {dateRangePreset === "custom" && "Personalizado"}
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
            {filterType === "all" && "Tipo"}
            {filterType === "income" && "Ingresos"}
            {filterType === "expense" && "Gastos"}
          </button>

          {/* Status */}
          <button
            type="button"
            onClick={() => setExpandedFilter(expandedFilter === "status" ? null : "status")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              expandedFilter === "status" || filterStatus !== "all"
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            <CheckCircle2 size={14} />
            {filterStatus === "all" && "Estado"}
            {filterStatus === "paid" && "Pagado"}
            {filterStatus === "pending" && "Pendiente"}
            {filterStatus === "planned" && "Planeado"}
          </button>

          {/* Category */}
          <button
            type="button"
            onClick={handleOpenCategoryModal}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              selectedCategoryIds.length > 0
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Tag size={14} />
            {selectedCategoryIds.length === 0 && "Categoría"}
            {selectedCategoryIds.length === 1 && (categoryDefinitions.find((c) => c.id === selectedCategoryIds[0])?.name || "Categoría")}
            {selectedCategoryIds.length > 1 && `${selectedCategoryIds.length} categorías`}
          </button>

          {/* Monto */}
          <button
            type="button"
            onClick={() => setExpandedFilter(expandedFilter === "amount" ? null : "amount")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              expandedFilter === "amount" || minAmount || maxAmount
                ? "bg-[#18B7B0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            Monto
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
                Este Mes
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
                Mes Pasado
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
                Personalizado
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
                Todos
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
                Ingresos
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
                Gastos
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
                Todos
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
                Pagado
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
                Pendiente
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
                Planeado
              </button>
            </div>
          </div>
        )}

        {expandedFilter === "amount" && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Mínimo
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
                  Máximo
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Sin límite"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#18B7B0] focus:ring-2 focus:ring-[#18B7B0]/20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="mx-auto w-full max-w-xl px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("results.title", { count: filteredTransactions.length })}
        </h2>
        <button
          type="button"
          onClick={handleExport}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 text-sm font-medium text-[#18B7B0] hover:text-[#159d97] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Download size={16} />
          {t("results.exportCSV")}
        </button>
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
                    Fecha Inicio
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
                    Fecha Fin
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
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDates}
                  className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#159d97] transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[70]">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCategoryModal(false)}
          />

          {/* Bottom Sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[80vh] flex flex-col">
            {/* Drag Handle */}
            <div className="flex justify-center py-3">
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

            {/* Categories List (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-4">
              <div className="space-y-2 pb-4">
                {categoryDefinitions.map((category) => {
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

                      {/* Category Name */}
                      <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-50">
                        {category.name}
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
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCategories}
                  className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#159d97] transition-colors"
                >
                  Aplicar ({tempSelectedCategoryIds.length})
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
    </div>
  );
}
