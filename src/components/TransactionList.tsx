import { useMemo, useState } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { formatDateGroupHeader } from "@/services/dates.service";
import TransactionItem from "@/components/TransactionItem";
import type { Transaction, Category } from "@/types/budget.types";
import { Search, X } from "lucide-react";

interface GroupedTransactions {
  date: string;
  dateLabel: string;
  transactions: Transaction[];
}

export default function TransactionList() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to get category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return categoryDefinitions.find((c) => c.id === id);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrent = selectedMonth === currentMonth;

  // Agrupar transacciones por fecha (con búsqueda)
  const groupedList = useMemo<GroupedTransactions[]>(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = transactions
      .filter((t) => t.date.slice(0, 7) === selectedMonth)
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

    // Convertir a array y ordenar por fecha descendente
    return Object.entries(groups)
      .map(([date, txs]) => ({
        date,
        dateLabel: formatDateGroupHeader(date),
        transactions: txs,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, selectedMonth, searchQuery, categoryDefinitions]);

  // Contar transacciones del mes (sin filtro de búsqueda)
  const monthTransactionCount = useMemo(() => {
    return transactions.filter((t) => t.date.slice(0, 7) === selectedMonth)
      .length;
  }, [transactions, selectedMonth]);

  return (
    <div className="mx-auto max-w-xl">
      {!isCurrent && (
        <div className="mb-3 mx-4 border bg-white p-3 text-xs text-gray-600 rounded-lg">
          Estás viendo un mes diferente al actual. Puedes agregar movimientos igual, pero revisa la fecha.
        </div>
      )}

      {/* Barra de búsqueda */}
      {monthTransactionCount > 0 && (
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
            <Search size={20} className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, categoría..."
              className="min-w-0 flex-1 border-0 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="shrink-0 rounded-full p-1 hover:bg-gray-100"
              >
                <X size={18} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {groupedList.length === 0 ? (
        <div className="mx-4 bg-white p-6 text-center text-sm text-gray-600 rounded-xl shadow-sm">
          {searchQuery
            ? `No se encontraron resultados para "${searchQuery}"`
            : "Aún no tienes movimientos este mes."}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedList.map((group) => (
            <div key={group.date}>
              {/* Date Header - fondo gris */}
              <div className="px-4 pb-1.5">
                <h3 className="text-xs font-semibold text-gray-600">
                  {group.dateLabel}
                </h3>
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
          ))}
        </div>
      )}
    </div>
  );
}
