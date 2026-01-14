import { useState, useEffect } from "react";
import { icons } from "lucide-react";
import { CATEGORY_COLORS } from "@/constants/category-colors";
import { Check } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  value: string;
  icon: string;
  onChange: (color: string) => void;
};

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function ColorPicker({ open, onClose, value, icon, onChange }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  const handleSelect = (color: string) => {
    onChange(color);
    onClose();
  };

  if (!isVisible) return null;

  const IconComponent = icons[kebabToPascal(icon) as keyof typeof icons];

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
      >
        {/* Header with preview */}
        <div className="flex flex-col items-center pt-6 pb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: value + "20" }}
          >
            {IconComponent && (
              <IconComponent className="h-8 w-8" style={{ color: value }} />
            )}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex w-full border-b">
            <button
              className="flex-1 pb-2 text-sm font-medium text-gray-400"
              onClick={onClose}
            >
              Icono
            </button>
            <button className="flex-1 border-b-2 border-emerald-500 pb-2 text-sm font-medium text-emerald-500">
              Color
            </button>
          </div>
        </div>

        {/* Color Grid */}
        <div className="max-h-[320px] overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-5 gap-3">
            {CATEGORY_COLORS.map((color) => {
              const isSelected = color === value;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelect(color)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {isSelected && (
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
