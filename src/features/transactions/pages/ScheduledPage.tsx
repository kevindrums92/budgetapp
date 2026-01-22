import { useMemo } from "react";
import { Calendar } from "lucide-react";
import PageHeader from "@/shared/components/layout/PageHeader";
import ScheduleListItem from "../components/ScheduleListItem";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import { calculateNextDate } from "@/shared/services/scheduler.service";
import type { Transaction } from "@/types/budget.types";

// Helper to get the day before a date (to ensure no future recurrences)
function getYesterday(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

// Check if a template has future recurrences
function hasNextRecurrence(tx: Transaction, today: string): boolean {
  if (!tx.schedule?.enabled) return false;
  const nextDate = calculateNextDate(tx.schedule, today);
  return nextDate !== null;
}

export default function ScheduledPage() {
  const transactions = useBudgetStore((s) => s.transactions);
  const getCategoryById = useBudgetStore((s) => s.getCategoryById);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);

  const today = todayISO();

  // Get all templates (transactions with schedule)
  const templates = useMemo(() => {
    return transactions.filter((tx) => tx.schedule !== undefined);
  }, [transactions]);

  // Classify by state based on whether there are future recurrences
  const { active, ended } = useMemo(() => {
    const active: Transaction[] = [];
    const ended: Transaction[] = [];

    for (const t of templates) {
      if (hasNextRecurrence(t, today)) {
        active.push(t);
      } else {
        ended.push(t);
      }
    }

    return { active, ended };
  }, [templates, today]);

  // Handle inactivate (set endDate to yesterday to ensure no future recurrences)
  const handleInactivate = (id: string) => {
    const template = transactions.find((t) => t.id === id);
    if (template?.schedule) {
      updateTransaction(id, {
        schedule: {
          ...template.schedule,
          endDate: getYesterday(today),
        },
      });
    }
  };

  const isEmpty = templates.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader title="Programadas" />

      <div className="flex-1 px-4 pt-6 pb-8 space-y-6">
        {/* Empty State */}
        {isEmpty && (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <Calendar className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-600">
              No tienes transacciones programadas
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Activa la programación al crear una transacción
            </p>
          </div>
        )}

        {/* Active Section */}
        {active.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Activas ({active.length})
            </h2>
            <div className="space-y-3">
              {active.map((tx) => (
                <ScheduleListItem
                  key={tx.id}
                  transaction={tx}
                  category={getCategoryById(tx.category)}
                  onInactivate={handleInactivate}
                />
              ))}
            </div>
          </section>
        )}

        {/* Inactive Section */}
        {ended.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Inactivas ({ended.length})
            </h2>
            <div className="space-y-3">
              {ended.map((tx) => (
                <ScheduleListItem
                  key={tx.id}
                  transaction={tx}
                  category={getCategoryById(tx.category)}
                  isEnded
                  onInactivate={handleInactivate}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
