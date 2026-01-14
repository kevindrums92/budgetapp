import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { CATEGORY_GROUPS, getGroupsByType } from "@/constants/category-groups";
import { DEFAULT_CATEGORY_ICON } from "@/constants/category-icons";
import { DEFAULT_CATEGORY_COLOR } from "@/constants/category-colors";
import type { TransactionType, CategoryGroupId } from "@/types/budget.types";
import IconPicker from "@/components/IconPicker";
import ColorPicker from "@/components/ColorPicker";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function AddEditCategoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const updateCategory = useBudgetStore((s) => s.updateCategory);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [type, setType] = useState<TransactionType>(
    (searchParams.get("type") as TransactionType) || "expense"
  );
  const [groupId, setGroupId] = useState<CategoryGroupId>("miscellaneous");

  // Modal state
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

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
    const validGroups = getGroupsByType(type);
    const currentGroupValid = validGroups.some((g) => g.id === groupId);
    if (!currentGroupValid && validGroups.length > 0) {
      setGroupId(validGroups[0].id);
    }
  }, [type, groupId]);

  const availableGroups = getGroupsByType(type);
  const currentGroup = CATEGORY_GROUPS.find((g) => g.id === groupId);

  function handleSave() {
    if (!name.trim()) return;

    if (isEditing && id) {
      updateCategory(id, { name: name.trim(), icon, color, type, groupId });
    } else {
      addCategory({ name: name.trim(), icon, color, type, groupId });
    }

    navigate(-1);
  }

  const IconComponent = icons[kebabToPascal(icon) as keyof typeof icons];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-1 hover:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Editar Categoría" : "Nueva Categoría"}
        </h1>
      </header>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Icon Preview */}
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
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
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg">
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Descripción
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Icon & Color Row */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="flex-1 rounded-2xl bg-white p-4 shadow-sm"
            >
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Icono
              </label>
              <div className="flex items-center gap-2">
                {IconComponent && (
                  <IconComponent className="h-5 w-5" style={{ color }} />
                )}
                <span className="text-sm text-gray-600">Cambiar</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowColorPicker(true)}
              className="flex-1 rounded-2xl bg-white p-4 shadow-sm"
            >
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Color
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600">Cambiar</span>
              </div>
            </button>
          </div>

          {/* Type */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-2 block text-xs font-medium text-gray-500">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  type === "expense"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  type === "income"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>

          {/* Group */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Grupo
            </label>
            <button
              type="button"
              onClick={() => setShowGroupPicker(!showGroupPicker)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-base text-gray-900">
                {currentGroup?.name || "Seleccionar"}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showGroupPicker ? "rotate-180" : ""
                }`}
              />
            </button>

            {showGroupPicker && (
              <div className="mt-3 space-y-1 border-t pt-3">
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
                        ? "bg-emerald-50 font-medium text-emerald-700"
                        : "text-gray-700 hover:bg-gray-50"
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
      <div className="sticky bottom-0 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-600 disabled:bg-gray-300"
        >
          Guardar
        </button>
      </div>

      {/* Icon Picker Modal */}
      <IconPicker
        open={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        value={icon}
        color={color}
        onChange={setIcon}
      />

      {/* Color Picker Modal */}
      <ColorPicker
        open={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        value={color}
        icon={icon}
        onChange={setColor}
      />
    </div>
  );
}
