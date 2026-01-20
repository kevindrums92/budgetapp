import { useState, useEffect } from "react";
import { icons, X } from "lucide-react";
import type { Transaction } from "@/types/budget.types";
import type { Category } from "@/types/budget.types";

type RecurringModalProps = {
  open: boolean;
  onClose: () => void;
  pendingTransactions: Transaction[];
  categories: Category[];
  targetMonth: string; // YYYY-MM
  onReplicate: (selectedIds: string[], amounts: Record<string, number>) => void;
};

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

export default function RecurringModal({
  open,
  onClose,
  pendingTransactions,
  categories,
  targetMonth,
  onReplicate,
}: RecurringModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedAmounts, setEditedAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Select all by default
      setSelectedIds(new Set(pendingTransactions.map((tx) => tx.id)));
      setEditedAmounts({});
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open, pendingTransactions]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isVisible) return null;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAmountChange = (id: string, value: string) => {
    setEditedAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleReplicate = () => {
    const amounts: Record<string, number> = {};
    selectedIds.forEach((id) => {
      const tx = pendingTransactions.find((t) => t.id === id);
      if (!tx) return;

      const editedValue = editedAmounts[id];
      if (editedValue) {
        const parsed = parseInt(editedValue.replace(/\D/g, ""), 10);
        amounts[id] = parsed > 0 ? parsed : tx.amount;
      } else {
        amounts[id] = tx.amount;
      }
    });

    onReplicate(Array.from(selectedIds), amounts);
    onClose();
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <div
      className={`fixed inset-0 z-[75] flex items-end justify-center transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-h-[85vh] overflow-hidden rounded-t-3xl bg-gray-50 shadow-xl transition-transform duration-300 ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">
              Replicar Transacciones
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 active:scale-95"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Selecciona las que deseas replicar para {targetMonth}
          </p>
        </div>

        {/* List */}
        <div className="max-h-[calc(85vh-180px)] overflow-y-auto">
          <div className="divide-y divide-gray-100 bg-white">
            {pendingTransactions.map((tx) => {
              const category = getCategoryById(tx.category);
              const IconComponent = category
                ? icons[kebabToPascal(category.icon) as keyof typeof icons]
                : null;
              const isSelected = selectedIds.has(tx.id);
              const editedAmount = editedAmounts[tx.id];

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelection(tx.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Category Icon */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: category ? category.color + "20" : "#f3f4f6",
                    }}
                  >
                    {IconComponent && category ? (
                      <IconComponent
                        className="h-5 w-5"
                        style={{ color: category.color }}
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tx.name}</p>
                    <p className="text-xs text-gray-500">{category?.name || "Sin categoría"}</p>
                  </div>

                  {/* Amount - editable */}
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">$</span>
                      <input
                        type="text"
                        value={editedAmount ?? formatNumber(tx.amount)}
                        onChange={(e) => handleAmountChange(tx.id, e.target.value)}
                        disabled={!isSelected}
                        className={`w-24 text-right rounded-lg border px-2 py-1 text-sm font-semibold ${
                          isSelected
                            ? "border-gray-200 bg-white text-gray-900"
                            : "border-transparent bg-gray-50 text-gray-400"
                        } focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-4 py-3 border-t border-gray-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleReplicate}
              disabled={selectedIds.size === 0}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white active:bg-emerald-600 disabled:opacity-50"
            >
              Replicar {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
