import { useState, useEffect } from "react";
import { icons } from "lucide-react";
import type { Category } from "@/types/budget.types";
import { kebabToPascal } from "@/shared/utils/string.utils";

type Props = {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (limit: number | null) => void;
};

function formatNumber(value: string): string {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("es-CO").format(parseInt(num, 10));
}

function parseNumber(value: string): number {
  return parseInt(value.replace(/\D/g, ""), 10) || 0;
}

export default function SetLimitModal({ open, onClose, category, onSave }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [limitValue, setLimitValue] = useState("");
  const [noLimit, setNoLimit] = useState(true);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Initialize with current limit
      if (category?.monthlyLimit) {
        setLimitValue(formatNumber(String(category.monthlyLimit)));
        setNoLimit(false);
      } else {
        setLimitValue("");
        setNoLimit(true);
      }
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open, category]);

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

  if (!isVisible || !category) return null;

  const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

  const handleSave = () => {
    if (noLimit) {
      onSave(null);
    } else {
      const num = parseNumber(limitValue);
      onSave(num > 0 ? num : null);
    }
    onClose();
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setLimitValue(formatted);
    if (formatted) {
      setNoLimit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: isAnimating ? 0.5 : 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative mx-4 w-full max-w-sm rounded-3xl bg-white shadow-2xl transition-all duration-300"
        style={{
          transform: isAnimating ? "scale(1)" : "scale(0.95)",
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center pt-6 pb-4 border-b">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl mb-3"
            style={{ backgroundColor: category.color + "20" }}
          >
            {IconComponent && (
              <IconComponent className="h-7 w-7" style={{ color: category.color }} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500">Establecer límite mensual</p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Límite mensual
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={limitValue}
                onChange={handleLimitChange}
                placeholder="0"
                disabled={noLimit}
                className={`w-full rounded-xl border border-gray-200 py-3 pl-8 pr-4 text-lg font-medium outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                  noLimit ? "bg-gray-100 text-gray-400" : "bg-white text-gray-900"
                }`}
              />
            </div>
          </div>

          {/* No Limit Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noLimit}
              onChange={(e) => {
                setNoLimit(e.target.checked);
                if (e.target.checked) {
                  setLimitValue("");
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Sin límite</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
