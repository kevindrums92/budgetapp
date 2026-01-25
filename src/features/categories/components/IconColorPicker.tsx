import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { icons } from "lucide-react";
import { searchIcons } from "@/constants/categories/category-icons-with-keywords";
import { CATEGORY_COLORS } from "@/constants/categories/category-colors";
import { Check, Search, X } from "lucide-react";
import { kebabToPascal } from "@/shared/utils/string.utils";

type Props = {
  open: boolean;
  onClose: () => void;
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
};

export default function IconColorPicker({
  open,
  onClose,
  icon,
  color,
  onIconChange,
  onColorChange,
}: Props) {
  const { t } = useTranslation("categories");
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<"icon" | "color">("icon");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setActiveTab("icon"); // Reset to icon tab when opening
      setSearchQuery(""); // Reset search when opening
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

  if (!isVisible) return null;

  const IconPreview = icons[kebabToPascal(icon) as keyof typeof icons];
  const filteredIcons = searchIcons(searchQuery);

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
        className="relative mx-4 w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300"
        style={{
          transform: isAnimating ? "scale(1)" : "scale(0.95)",
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with preview */}
        <div className="flex flex-col items-center pt-6 pb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: color + "20" }}
          >
            {IconPreview && (
              <IconPreview className="h-8 w-8" style={{ color }} />
            )}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex w-full border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === "icon"
                  ? "border-b-2 border-emerald-500 text-emerald-500 dark:text-emerald-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
              onClick={() => setActiveTab("icon")}
            >
              {t("iconColorPicker.icon")}
            </button>
            <button
              type="button"
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === "color"
                  ? "border-b-2 border-emerald-500 text-emerald-500 dark:text-emerald-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
              onClick={() => setActiveTab("color")}
            >
              {t("iconColorPicker.color")}
            </button>
          </div>
        </div>

        {/* Search Input (only for icon tab) */}
        {activeTab === "icon" && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("iconColorPicker.searchPlaceholder")}
                className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-2 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[320px] overflow-y-auto px-4 pb-4">
          {activeTab === "icon" ? (
            /* Icon Grid */
            filteredIcons.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {filteredIcons.map((iconName) => {
                  const IconComponent = icons[kebabToPascal(iconName) as keyof typeof icons];
                  if (!IconComponent) return null;

                  const isSelected = iconName === icon;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => onIconChange(iconName)}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                        isSelected ? "bg-emerald-100 dark:bg-emerald-900/40" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <IconComponent
                        className={`h-6 w-6 ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              /* No results */
              <div className="flex flex-col items-center justify-center py-8">
                <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("iconColorPicker.noResults")}
                </p>
              </div>
            )
          ) : (
            /* Color Grid */
            <div className="grid grid-cols-5 gap-3 px-2">
              {CATEGORY_COLORS.map((colorValue) => {
                const isSelected = colorValue === color;

                return (
                  <button
                    key={colorValue}
                    type="button"
                    onClick={() => onColorChange(colorValue)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: colorValue }}
                  >
                    {isSelected && (
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          >
            {t("iconColorPicker.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
