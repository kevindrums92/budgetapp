import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { icons, Plus, FolderOpen, ChevronRight } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import PageHeader from "@/components/PageHeader";

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

  const [activeTab, setActiveTab] = useState<Tab>("expense");

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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <PageHeader
        title="Categorías"
        rightActions={
          <>
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
          </>
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
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => navigate(`/category/${category.id}/edit`)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors"
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
                    <span className="flex-1 text-left font-medium text-gray-900">
                      {category.name}
                    </span>

                    {/* Chevron */}
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </button>
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

    </div>
  );
}
