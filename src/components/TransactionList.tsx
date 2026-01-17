import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgetStore } from "@/state/budget.store";
import { formatDateGroupHeader } from "@/services/dates.service";
import TransactionItem from "@/components/TransactionItem";
import type { Transaction, Category } from "@/types/budget.types";

interface GroupedTransactions {
  date: string;
  dateLabel: string;
  transactions: Transaction[];
}

export default function TransactionList() {
  const navigate = useNavigate();

  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  // Helper to get category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return categoryDefinitions.find((c) => c.id === id);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrent = selectedMonth === currentMonth;

  // Agrupar transacciones por fecha
  const groupedList = useMemo<GroupedTransactions[]>(() => {
    const filtered = transactions
      .filter((t) => t.date.slice(0, 7) === selectedMonth)
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
  }, [transactions, selectedMonth]);

  function onTransactionClick(tx: Transaction) {
    navigate(`/transaction/${tx.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      {!isCurrent && (
        <div className="mb-3 mx-4 border bg-white p-3 text-xs text-gray-600 rounded-lg">
          Estás viendo un mes diferente al actual. Puedes agregar movimientos igual, pero revisa la fecha.
        </div>
      )}

      {groupedList.length === 0 ? (
        <div className="mx-4 bg-white p-6 text-center text-sm text-gray-600 rounded-xl shadow-sm">
          Aún no tienes movimientos este mes.
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
                    onClick={() => onTransactionClick(tx)}
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
