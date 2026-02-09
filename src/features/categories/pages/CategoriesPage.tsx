import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { icons, Plus, FolderOpen, ChevronRight } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import PageHeader from "@/shared/components/layout/PageHeader";
import { kebabToPascal } from "@/shared/utils/string.utils";
import SpotlightTour from "@/features/tour/components/SpotlightTour";
import { categoriesTour } from "@/features/tour/tours/categoriesTour";
import { useSpotlightTour } from "@/features/tour/hooks/useSpotlightTour";

type Tab = "expense" | "income";

export default function CategoriesPage() {
  const { t } = useTranslation("categories");
  const navigate = useNavigate();
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);

  const [activeTab, setActiveTab] = useState<Tab>("expense");

  // Spotlight tour
  const { isActive: isTourActive, startTour, completeTour } = useSpotlightTour("categories");

  useEffect(() => {
    startTour();
  }, [startTour]);

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
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <PageHeader
        title={t("title")}
        rightActions={
          <>
            <button
              type="button"
              onClick={() => navigate("/category-groups")}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={t("groups.title")}
              data-tour="categories-groups-button"
            >
              <FolderOpen className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/category/new?type=${activeTab}`)}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              data-tour="categories-add-button"
            >
              <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-900 px-4 pt-3 pb-4" data-tour="categories-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === "expense"
              ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
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
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          {t("tabs.income")}
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
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{group.name}</h2>
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
                    className="flex w-full items-center gap-3 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                    <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-50">
                      {category.name}
                    </span>

                    {/* Chevron */}
                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {categoriesByGroup.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === "expense" ? t("emptyExpenses") : t("emptyIncome")}
            </p>
            <button
              type="button"
              onClick={() => navigate(`/category/new?type=${activeTab}`)}
              className="mt-4 font-medium text-emerald-600 dark:text-emerald-400"
            >
              {t("createButton")}
            </button>
          </div>
        )}
      </div>

      <SpotlightTour config={categoriesTour} isActive={isTourActive} onComplete={completeTour} />
    </div>
  );
}
