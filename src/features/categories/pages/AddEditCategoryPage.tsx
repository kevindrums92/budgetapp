import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, Trash2 } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { DEFAULT_CATEGORY_ICON } from "@/constants/categories/category-icons";
import { DEFAULT_CATEGORY_COLOR } from "@/constants/categories/category-colors";
import type { TransactionType } from "@/types/budget.types";
import IconColorPicker from "@/features/categories/components/IconColorPicker";
import PageHeader from "@/shared/components/layout/PageHeader";
import { kebabToPascal } from "@/shared/utils/string.utils";

export default function AddEditCategoryPage() {
  const { t } = useTranslation("categories");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const updateCategory = useBudgetStore((s) => s.updateCategory);
  const deleteCategory = useBudgetStore((s) => s.deleteCategory);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [type, setType] = useState<TransactionType>(
    (searchParams.get("type") as TransactionType) || "expense"
  );
  const [groupId, setGroupId] = useState("miscellaneous");

  // Modal state
  const [showIconColorPicker, setShowIconColorPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load existing category if editing
  useEffect(() => {
    if (isEditing && id) {
      const existing = categoryDefinitions.find((c) => c.id === id);
      if (existing) {
        setName(existing.name);
        setIcon(existing.icon);
        setColor(existing.color);
        setType(existing.type);
        setGroupId(existing.groupId);
      }
    }
  }, [isEditing, id, categoryDefinitions]);

  // Update groupId when type changes
  useEffect(() => {
    const validGroups = categoryGroups.filter((g) => g.type === type);
    const currentGroupValid = validGroups.some((g) => g.id === groupId);
    if (!currentGroupValid && validGroups.length > 0) {
      setGroupId(validGroups[0].id);
    }
  }, [type, groupId, categoryGroups]);

  const availableGroups = useMemo(() => {
    return categoryGroups
      .filter((g) => g.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [categoryGroups, type]);

  const currentGroup = categoryGroups.find((g) => g.id === groupId);
  const currentCategory = categoryDefinitions.find((c) => c.id === id);

  function handleSave() {
    if (!name.trim()) return;

    const returnTo = searchParams.get("returnTo");

    if (isEditing && id) {
      updateCategory(id, { name: name.trim(), icon, color, type, groupId });
      navigate(-1);
    } else {
      const newId = addCategory({ name: name.trim(), icon, color, type, groupId });
      // If coming from transaction form or onboarding, store new category and go back
      if ((returnTo === "transaction" || returnTo === "onboarding") && newId) {
        // Store newCategoryId in session storage for the form to pick up
        sessionStorage.setItem("newCategoryId", newId);
      }
      navigate(-1);
    }
  }

  function handleDelete() {
    setConfirmDelete(true);
  }

  function confirmDeleteCategory() {
    if (id) {
      deleteCategory(id);
      setConfirmDelete(false);
      navigate(-1);
    }
  }

  const IconComponent = icons[kebabToPascal(icon) as keyof typeof icons];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <PageHeader
        title={isEditing ? t("form.editTitle") : t("form.newTitle")}
        rightActions={
          isEditing && currentCategory ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
          ) : undefined
        }
      />

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Icon Preview */}
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowIconColorPicker(true)}
            className="relative"
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ backgroundColor: color + "30" }}
            >
              {IconComponent && (
                <IconComponent className="h-10 w-10" style={{ color }} />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 shadow-lg">
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("form.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
              className="w-full text-base text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Type */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("form.type")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  type === "expense"
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {t("form.typeExpense")}
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  type === "income"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {t("form.typeIncome")}
              </button>
            </div>
          </div>

          {/* Group */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("form.group")}
            </label>
            <button
              type="button"
              onClick={() => setShowGroupPicker(!showGroupPicker)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-base text-gray-900 dark:text-gray-50">
                {currentGroup?.name || t("form.selectGroup")}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform ${
                  showGroupPicker ? "rotate-180" : ""
                }`}
              />
            </button>

            {showGroupPicker && (
              <div className="mt-3 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-3">
                {availableGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGroupId(g.id);
                      setShowGroupPicker(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      g.id === groupId
                        ? "bg-emerald-50 dark:bg-emerald-900/30 font-medium text-emerald-700 dark:text-emerald-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {t("form.save")}
        </button>
      </div>

      {/* Icon & Color Picker Modal */}
      <IconColorPicker
        open={showIconColorPicker}
        onClose={() => setShowIconColorPicker(false)}
        icon={icon}
        color={color}
        onIconChange={setIcon}
        onColorChange={setColor}
      />

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("form.delete.title")}
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {t("form.delete.message")}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {t("form.delete.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600"
              >
                {t("form.delete.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
