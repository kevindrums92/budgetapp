import { useState, useEffect } from "react";
import { icons } from "lucide-react";
import { CATEGORY_ICONS } from "@/constants/category-icons";

type Props = {
  open: boolean;
  onClose: () => void;
  value: string;
  color: string;
  onChange: (icon: string) => void;
};

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function IconPicker({ open, onClose, value, color, onChange }: Props) {
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

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    onClose();
  };

  if (!isVisible) return null;

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
            style={{ backgroundColor: color + "20" }}
          >
            {(() => {
              const IconComponent = icons[kebabToPascal(value) as keyof typeof icons];
              return IconComponent ? (
                <IconComponent className="h-8 w-8" style={{ color }} />
              ) : null;
            })()}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex w-full border-b">
            <button className="flex-1 border-b-2 border-emerald-500 pb-2 text-sm font-medium text-emerald-500">
              Icono
            </button>
            <button
              className="flex-1 pb-2 text-sm font-medium text-gray-400"
              onClick={onClose}
            >
              Color
            </button>
          </div>
        </div>

        {/* Icon Grid */}
        <div className="max-h-[320px] overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-5 gap-2">
            {CATEGORY_ICONS.map((iconName) => {
              const IconComponent = icons[kebabToPascal(iconName) as keyof typeof icons];
              if (!IconComponent) return null;

              const isSelected = iconName === value;

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleSelect(iconName)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    isSelected
                      ? "bg-emerald-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <IconComponent
                    className={`h-6 w-6 ${isSelected ? "text-emerald-600" : "text-gray-700"}`}
                  />
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
