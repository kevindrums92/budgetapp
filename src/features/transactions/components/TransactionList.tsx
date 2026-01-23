import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { formatDateGroupHeaderI18n, todayISO } from "@/services/dates.service";
import { useLanguage } from "@/hooks/useLanguage";
import TransactionItem from "@/features/transactions/components/TransactionItem";
import type { Transaction, Category } from "@/types/budget.types";
import { formatCOP } from "@/shared/utils/currency.utils";
import { generateVirtualTransactions, isVirtualTransaction, type VirtualTransaction } from "@/shared/services/scheduler.service";

// Extended transaction type that includes virtual transactions
type DisplayTransaction = Transaction | VirtualTransaction;

interface GroupedTransactions {
  date: string;
  dateLabel: string;
  transactions: DisplayTransaction[];
  totalExpenses: number;
  totalIncome: number;
  balance: number;
}

interface TransactionListProps {
  searchQuery?: string;
  filterType?: "all" | "expense" | "income" | "pending" | "recurring";
}

export default function TransactionList({ searchQuery = "", filterType = "all" }: TransactionListProps) {
  const { t } = useTranslation("transactions");
  const { t: tCommon } = useTranslation("common");
  const { getLocale } = useLanguage();
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  // Helper to get category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return categoryDefinitions.find((c) => c.id === id);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrent = selectedMonth === currentMonth;
  const today = todayISO();

  // Generate virtual transactions for future dates (lazy generation - only next occurrence)
  const virtualTransactions = useMemo(() => {
    return generateVirtualTransactions(transactions, today);
  }, [transactions, today]);

  // Combine real + virtual transactions
  const allTransactions = useMemo<DisplayTransaction[]>(() => {
    return [...transactions, ...virtualTransactions];
  }, [transactions, virtualTransactions]);

  // Agrupar transacciones por fecha (con búsqueda)
  const groupedList = useMemo<GroupedTransactions[]>(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = allTransactions
      .filter((t) => t.date.slice(0, 7) === selectedMonth)
      .filter((t) => {
        // Filtrar por tipo o estado
        if (filterType === "expense" && t.type !== "expense") return false;
        if (filterType === "income" && t.type !== "income") return false;
        if (filterType === "pending" && t.status !== "pending" && t.status !== "planned") return false;
        if (filterType === "recurring") {
          // Una transacción es recurrente si:
          // 1. Tiene schedule activo (es un template)
          // 2. O tiene sourceTemplateId (es una instancia generada de un template)
          // 3. O tiene isRecurring === true (legacy)
          const hasSchedule = t.schedule?.enabled === true;
          const isFromTemplate = !!t.sourceTemplateId;
          const isMarkedRecurring = t.isRecurring === true;

          if (!hasSchedule && !isFromTemplate && !isMarkedRecurring) return false;
        }
        return true;
      })
      .filter((t) => {
        if (!query) return true;
        // Buscar en nombre
        if (t.name.toLowerCase().includes(query)) return true;
        // Buscar en categoría
        const cat = categoryDefinitions.find((c) => c.id === t.category);
        if (cat?.name.toLowerCase().includes(query)) return true;
        // Buscar en notas
        if (t.notes?.toLowerCase().includes(query)) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.createdAt - a.createdAt;
      });

    // Agrupar por fecha
    const groups: Record<string, Transaction[]> = {};
    for (const tx of filtered) {
      const dateKey = tx.date.slice(0, 10); // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    }

    // Convertir a array, calcular totales y ordenar por fecha descendente
    // IMPORTANT: Only count REAL transactions in totals, not virtual ones
    return Object.entries(groups)
      .map(([date, txs]) => {
        const realTxs = txs.filter((t) => !isVirtualTransaction(t));
        const totalExpenses = realTxs
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = realTxs
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpenses;

        return {
          date,
          dateLabel: formatDateGroupHeaderI18n(
            date,
            tCommon('date.today'),
            tCommon('date.yesterday'),
            getLocale()
          ),
          transactions: txs,
          totalExpenses,
          totalIncome,
          balance,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [allTransactions, selectedMonth, searchQuery, filterType, categoryDefinitions, tCommon, getLocale]);

  return (
    <div className="mx-auto max-w-xl">
      {!isCurrent && (
        <div className="mb-3 mx-4 border bg-white p-3 text-xs text-gray-600 rounded-lg">
          {t("list.monthWarning")}
        </div>
      )}

      {groupedList.length === 0 ? (
        <div className="mx-4 bg-white p-6 text-center text-sm text-gray-600 rounded-xl shadow-sm">
          {searchQuery
            ? t("list.searchEmpty", { query: searchQuery })
            : t("list.noTransactions")}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedList.map((group) => {
            // Determinar qué mostrar: balance si hay ingresos y gastos, sino solo gastos
            const hasIncome = group.totalIncome > 0;
            const hasExpenses = group.totalExpenses > 0;
            const showBalance = hasIncome && hasExpenses;

            return (
              <div key={group.date}>
                {/* Date Header - fondo gris con total */}
                <div className="px-4 pb-1.5 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-600">
                    {group.dateLabel}
                  </h3>
                  {showBalance ? (
                    <span
                      className={`text-xs font-semibold ${
                        group.balance >= 0
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    >
                      {group.balance >= 0 ? "+" : ""}
                      {formatCOP(group.balance)}
                    </span>
                  ) : hasExpenses ? (
                    <span className="text-xs font-semibold text-gray-500">
                      -{formatCOP(group.totalExpenses)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600">
                      +{formatCOP(group.totalIncome)}
                    </span>
                  )}
                </div>

                {/* Transactions - card blanco con bordes redondeados */}
                <div className="mx-4 bg-white rounded-xl shadow-sm overflow-hidden">
                  {group.transactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      category={getCategoryById(tx.category)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
