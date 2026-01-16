import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { CATEGORY_COLORS } from "@/constants/category-colors";
import type { TransactionType } from "@/types/budget.types";

const DEFAULT_GROUP_COLOR = "#6B7280"; // Gray

export default function AddEditCategoryGroupPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const addCategoryGroup = useBudgetStore((s) => s.addCategoryGroup);
  const updateCategoryGroup = useBudgetStore((s) => s.updateCategoryGroup);
  const deleteCategoryGroup = useBudgetStore((s) => s.deleteCategoryGroup);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_GROUP_COLOR);
  const [type, setType] = useState<TransactionType>(
    (searchParams.get("type") as TransactionType) || "expense"
  );

  // Modal states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load existing group if editing
  useEffect(() => {
    if (isEditing && id) {
      const existing = categoryGroups.find((g) => g.id === id);
      if (existing) {
        setName(existing.name);
        setColor(existing.color);
        setType(existing.type);
      }
    }
  }, [isEditing, id, categoryGroups]);

  const currentGroup = categoryGroups.find((g) => g.id === id);
  const categoriesInGroup = categoryDefinitions.filter((c) => c.groupId === id).length;

  function handleSave() {
    if (!name.trim()) return;

    if (isEditing && id) {
      updateCategoryGroup(id, { name: name.trim(), color, type });
    } else {
      addCategoryGroup({ name: name.trim(), color, type });
    }

    navigate(-1);
  }

  function handleDelete() {
    if (categoriesInGroup > 0) {
      setConfirmDelete(true);
    } else if (id) {
      deleteCategoryGroup(id);
      navigate(-1);
    }
  }

  function confirmDeleteGroup() {
    if (id) {
      deleteCategoryGroup(id);
      setConfirmDelete(false);
      navigate(-1);
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
          <h1 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar Grupo" : "Nuevo Grupo"}
          </h1>
        </div>
        {isEditing && currentGroup && !currentGroup.isDefault && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full p-2 hover:bg-red-50"
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Color Preview */}
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowColorPicker(true)}
            className="relative"
          >
            <div
              className="h-20 w-20 rounded-2xl shadow-sm"
              style={{ backgroundColor: color }}
            />
            <div className="mt-2 text-center text-xs text-gray-500">
              Toca para cambiar color
            </div>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Alimentación, Entretenimiento"
              className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
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
                disabled={isEditing}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  type === "expense"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600"
                } ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                disabled={isEditing}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  type === "income"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600"
                } ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Ingreso
              </button>
            </div>
            {isEditing && (
              <p className="mt-2 text-xs text-gray-400">
                El tipo no se puede cambiar después de crear el grupo
              </p>
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

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowColorPicker(false)}
          />
          <div className="relative w-full max-w-lg rounded-t-3xl bg-white px-6 py-8 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Seleccionar color
            </h3>
            <div className="grid grid-cols-6 gap-3">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    setShowColorPicker(false);
                  }}
                  className={`h-12 w-12 rounded-xl transition-transform ${
                    c === color ? "ring-2 ring-gray-900 ring-offset-2 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowColorPicker(false)}
              className="mt-6 w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Eliminar grupo
            </h3>
            <p className="text-gray-600 mb-4">
              Este grupo tiene{" "}
              <span className="font-medium">{categoriesInGroup}</span>{" "}
              categoría(s). Al eliminarlo, estas categorías se moverán automáticamente al grupo "Otros".
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
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
