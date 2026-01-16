import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, ChevronRight } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";

type Tab = "expense" | "income";

export default function CategoryGroupsPage() {
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
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Grupos de Categorías</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/category-group/new?type=${activeTab}`)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <Plus className="h-5 w-5 text-gray-700" />
        </button>
      </header>

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
          Gastos
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
          Ingresos
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
              <p className="text-gray-500">No hay grupos de {activeTab === "expense" ? "gastos" : "ingresos"}</p>
              <button
                type="button"
                onClick={() => navigate(`/category-group/new?type=${activeTab}`)}
                className="mt-4 text-emerald-600 font-medium"
              >
                Crear grupo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
