import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { icons, ChevronLeft, Plus, FolderOpen, ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import type { Category } from "@/types/budget.types";

type Tab = "expense" | "income";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const deleteCategory = useBudgetStore((s) => s.deleteCategory);
  const transactions = useBudgetStore((s) => s.transactions);

  const [activeTab, setActiveTab] = useState<Tab>("expense");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  // Group categories by their group
  const categoriesByGroup = useMemo(() => {
    const filtered = categoryDefinitions.filter((c) => c.type === activeTab);
    const groups = categoryGroups.filter((g) => g.type === activeTab);

    const result: { group: typeof categoryGroups[0]; categories: typeof categoryDefinitions }[] = [];

    for (const group of groups) {
      const cats = filtered
        .filter((c) => c.groupId === group.id)
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

      if (cats.length > 0) {
        result.push({ group, categories: cats });
      }
    }

    // Sort groups by name
    result.sort((a, b) => a.group.name.localeCompare(b.group.name, "es"));

    return result;
  }, [categoryDefinitions, categoryGroups, activeTab]);

  // Count transactions per category
  const transactionsPerCategory = useMemo(() => {
    const count: Record<string, number> = {};
    for (const t of transactions) {
      count[t.category] = (count[t.category] || 0) + 1;
    }
    return count;
  }, [transactions]);

  function handleDelete(category: Category) {
    const count = transactionsPerCategory[category.id] || 0;
    if (count > 0) {
      setConfirmDelete(category);
    } else {
      deleteCategory(category.id);
    }
    setMenuOpenId(null);
  }

  function confirmDeleteCategory() {
    if (confirmDelete) {
      deleteCategory(confirmDelete.id);
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
          <h1 className="text-lg font-semibold text-gray-900">Categorías</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate("/category-groups")}
            className="rounded-full p-2 hover:bg-gray-100"
            title="Grupos de categorías"
          >
            <FolderOpen className="h-5 w-5 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/category/new?type=${activeTab}`)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <Plus className="h-5 w-5 text-gray-700" />
          </button>
        </div>
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

      {/* Categories List */}
      <div className="flex-1 px-4 py-2 pb-20">
        {categoriesByGroup.map(({ group, categories }) => (
          <div key={group.id} className="mb-4">
            {/* Group Header */}
            <div className="mb-2 flex items-center gap-2 px-1">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: group.color }}
              />
              <h2 className="text-sm font-semibold text-gray-700">{group.name}</h2>
            </div>

            {/* Categories in Group */}
            <div className="space-y-2">
              {categories.map((category) => {
                const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

                return (
                  <div
                    key={category.id}
                    className="relative flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                  >
                    {/* Icon */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      {IconComponent && (
                        <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                      )}
                    </div>

                    {/* Content */}
                    <button
                      type="button"
                      onClick={() => navigate(`/category/${category.id}/edit`)}
                      className="flex flex-1 items-center justify-between"
                    >
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </button>

                    {/* Menu Button */}
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(menuOpenId === category.id ? null : category.id)}
                      className="rounded-full p-1 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpenId === category.id && (
                      <div className="absolute right-4 top-14 z-20 w-40 rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/category/${category.id}/edit`);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        {!category.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {categoriesByGroup.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              No hay categorías de {activeTab === "expense" ? "gastos" : "ingresos"}
            </p>
            <button
              type="button"
              onClick={() => navigate(`/category/new?type=${activeTab}`)}
              className="mt-4 font-medium text-emerald-600"
            >
              Crear categoría
            </button>
          </div>
        )}
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
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Eliminar categoría
            </h3>
            <p className="mb-4 text-gray-600">
              La categoría "{confirmDelete.name}" tiene{" "}
              <span className="font-medium">
                {transactionsPerCategory[confirmDelete.id]}
              </span>{" "}
              transacción(es) asociadas. Si la eliminas, estas transacciones quedarán sin categoría.
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
                onClick={confirmDeleteCategory}
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
