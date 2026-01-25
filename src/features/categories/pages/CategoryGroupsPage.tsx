import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, ChevronRight } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import PageHeader from "@/shared/components/layout/PageHeader";

type Tab = "expense" | "income";

export default function CategoryGroupsPage() {
  const { t } = useTranslation("categories");
  const navigate = useNavigate();
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  const [activeTab, setActiveTab] = useState<Tab>("expense");

  const filteredGroups = useMemo(() => {
    return categoryGroups
      .filter((g) => g.type === activeTab)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [categoryGroups, activeTab]);

  // Count categories per group
  const categoriesInGroup = useMemo(() => {
    const count: Record<string, number> = {};
    for (const g of categoryGroups) {
      count[g.id] = categoryDefinitions.filter((c) => c.groupId === g.id).length;
    }
    return count;
  }, [categoryGroups, categoryDefinitions]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <PageHeader
        title={t("groups.title")}
        rightActions={
          <button
            type="button"
            onClick={() => navigate(`/category-group/new?type=${activeTab}`)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <Plus className="h-5 w-5 text-gray-700" />
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 bg-white px-4 pt-3 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === "expense"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {t("tabs.expenses")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("income")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === "income"
              ? "bg-emerald-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {t("tabs.income")}
        </button>
      </div>

      {/* Groups List */}
      <div className="flex-1 px-4 py-2">
        <div className="space-y-2">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => navigate(`/category-group/${group.id}/edit`)}
              className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors"
            >
              {/* Color indicator */}
              <div
                className="h-10 w-10 rounded-xl"
                style={{ backgroundColor: group.color }}
              />

              {/* Content */}
              <div className="flex-1 text-left">
                <span className="font-medium text-gray-900">{group.name}</span>
                <p className="text-xs text-gray-500">
                  {categoriesInGroup[group.id] || 0} categorías
                </p>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
          ))}

          {filteredGroups.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">{activeTab === "expense" ? t("groups.emptyExpenses") : t("groups.emptyIncome")}</p>
              <button
                type="button"
                onClick={() => navigate(`/category-group/new?type=${activeTab}`)}
                className="mt-4 text-emerald-600 font-medium"
              >
                {t("groups.createButton")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
