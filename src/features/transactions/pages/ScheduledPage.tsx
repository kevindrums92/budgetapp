import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import PageHeader from "@/shared/components/layout/PageHeader";
import ScheduleListItem from "../components/ScheduleListItem";
import { useBudgetStore } from "@/state/budget.store";
import type { Transaction } from "@/types/budget.types";

type TabType = "active" | "inactive";

export default function ScheduledPage() {
  const { t } = useTranslation("scheduled");
  const transactions = useBudgetStore((s) => s.transactions);
  const getCategoryById = useBudgetStore((s) => s.getCategoryById);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);

  const [activeTab, setActiveTab] = useState<TabType>("active");

  // Get all templates (transactions with schedule)
  const templates = useMemo(() => {
    return transactions.filter((tx) => tx.schedule !== undefined);
  }, [transactions]);

  // Classify by schedule.enabled
  const { active, inactive } = useMemo(() => {
    const active: Transaction[] = [];
    const inactive: Transaction[] = [];

    for (const t of templates) {
      if (t.schedule?.enabled) {
        active.push(t);
      } else {
        inactive.push(t);
      }
    }

    return { active, inactive };
  }, [templates]);

  // Handle inactivate (set schedule.enabled = false)
  const handleInactivate = (id: string) => {
    const template = transactions.find((t) => t.id === id);
    if (template?.schedule) {
      updateTransaction(id, {
        schedule: {
          ...template.schedule,
          enabled: false,
        },
      });
    }
  };


  const currentList = activeTab === "active" ? active : inactive;
  const isEmpty = currentList.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader title={t("title")} />

      {/* Tabs */}
      <div className="flex gap-2 bg-white px-4 pt-3 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {t("tabs.active", { count: active.length })}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inactive")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === "inactive"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {t("tabs.inactive", { count: inactive.length })}
        </button>
      </div>

      <div className="flex-1 px-4 pt-4 pb-8">
        {/* Empty State */}
        {isEmpty && (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <Calendar className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-600">
              {activeTab === "active"
                ? t("emptyActive.title")
                : t("emptyInactive.title")}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {activeTab === "active"
                ? t("emptyActive.message")
                : t("emptyInactive.message")}
            </p>
          </div>
        )}

        {/* List */}
        {!isEmpty && (
          <div className="space-y-3">
            {currentList.map((tx) => (
              <ScheduleListItem
                key={tx.id}
                transaction={tx}
                category={getCategoryById(tx.category)}
                isEnded={activeTab === "inactive"}
                onInactivate={handleInactivate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
