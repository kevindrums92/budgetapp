import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import type { CategoryGroup } from "@/types/budget.types";

type Tab = "expense" | "income";

export default function CategoryGroupsPage() {
  const navigate = useNavigate();
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const deleteCategoryGroup = useBudgetStore((s) => s.deleteCategoryGroup);

  const [activeTab, setActiveTab] = useState<Tab>("expense");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoryGroup | null>(null);

  const filteredGroups = useMemo(() => {
    return categoryGroups
      .filter((g) => g.type === activeTab)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [categoryGroups, activeTab]);

  // Count categories per group for warning
  const categoriesInGroup = useMemo(() => {
    const count: Record<string, number> = {};
    for (const g of categoryGroups) {
      count[g.id] = categoryDefinitions.filter((c) => c.groupId === g.id).length;
    }
    return count;
  }, [categoryGroups, categoryDefinitions]);

  function handleDelete(group: CategoryGroup) {
    const count = categoriesInGroup[group.id] || 0;
    if (count > 0) {
      setConfirmDelete(group);
    } else {
      deleteCategoryGroup(group.id);
    }
    setMenuOpenId(null);
  }

  function confirmDeleteGroup() {
    if (confirmDelete) {
      deleteCategoryGroup(confirmDelete.id);
      setConfirmDelete(null);
    }
  }

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
      <div className="flex gap-2 bg-white px-4 pb-4">
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
            <div
              key={group.id}
              className="relative flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
            >
              {/* Color indicator */}
              <div
                className="h-10 w-10 rounded-xl"
                style={{ backgroundColor: group.color }}
              />

              {/* Content */}
              <button
                type="button"
                onClick={() => navigate(`/category-group/${group.id}/edit`)}
                className="flex flex-1 items-center justify-between"
              >
                <div>
                  <span className="font-medium text-gray-900">{group.name}</span>
                  <p className="text-xs text-gray-500">
                    {categoriesInGroup[group.id] || 0} categorías
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>

              {/* Menu Button */}
              <button
                type="button"
                onClick={() => setMenuOpenId(menuOpenId === group.id ? null : group.id)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {menuOpenId === group.id && (
                <div className="absolute right-4 top-14 z-20 w-40 rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/category-group/${group.id}/edit`);
                      setMenuOpenId(null);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  {!group.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDelete(group)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
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

      {/* Click outside to close menu */}
      {menuOpenId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpenId(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Eliminar grupo
            </h3>
            <p className="text-gray-600 mb-4">
              El grupo "{confirmDelete.name}" tiene{" "}
              <span className="font-medium">{categoriesInGroup[confirmDelete.id]}</span>{" "}
              categoría(s). Al eliminarlo, estas categorías se moverán automáticamente al grupo "Otros".
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteGroup}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
