import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Plus } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { CATEGORY_GROUPS } from "@/constants/category-groups";
import type { TransactionType, Category } from "@/types/budget.types";

type Props = {
  open: boolean;
  onClose: () => void;
  transactionType: TransactionType;
  value: string | null;
  onSelect: (categoryId: string) => void;
  onNavigateToNewCategory?: () => void;
};

const SHEET_HEIGHT = 500;
const DRAG_THRESHOLD = 0.3;

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function CategoryPickerDrawer({
  open,
  onClose,
  transactionType,
  value,
  onSelect,
  onNavigateToNewCategory,
}: Props) {
  const navigate = useNavigate();
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  // Filter categories by type and search
  const filteredCategories = useMemo(() => {
    const byType = categoryDefinitions.filter((c) => c.type === transactionType);
    if (!searchQuery.trim()) return byType;
    const query = searchQuery.toLowerCase();
    return byType.filter((c) => c.name.toLowerCase().includes(query));
  }, [categoryDefinitions, transactionType, searchQuery]);

  // Group categories
  const groupedCategories = useMemo(() => {
    const groups = CATEGORY_GROUPS.filter((g) => g.type === transactionType);
    const result: { group: typeof groups[0]; categories: Category[] }[] = [];

    for (const group of groups) {
      const cats = filteredCategories.filter((c) => c.groupId === group.id);
      if (cats.length > 0) {
        result.push({ group, categories: cats });
      }
    }

    return result;
  }, [filteredCategories, transactionType]);

  // Handle open/close animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setSearchQuery("");
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setDragOffset(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Lock body scroll
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

  // Drag handlers
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
  }, []);

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;
      const diff = clientY - startYRef.current;
      if (diff > 0) {
        setDragOffset(Math.min(diff, SHEET_HEIGHT));
      } else {
        setDragOffset(0);
      }
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > SHEET_HEIGHT * DRAG_THRESHOLD) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart]
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove]
  );
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // Mouse events for handle only
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleDragStart(e.clientY),
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  function handleNewCategory() {
    onNavigateToNewCategory?.();
    onClose();
    navigate(`/category/new?type=${transactionType}&returnTo=transaction`);
  }

  if (!isVisible) return null;

  const sheetTranslate = isAnimating ? dragOffset : SHEET_HEIGHT;
  const backdropOpacity = isAnimating
    ? Math.max(0, 1 - dragOffset / SHEET_HEIGHT) * 0.4
    : 0;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? "none" : "opacity 300ms ease-out",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white shadow-2xl"
        style={{
          height: SHEET_HEIGHT,
          transform: `translateY(${sheetTranslate}px)`,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex-none">
          {/* Drag handle */}
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>

          {/* Title and close */}
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Categoría</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-10 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-4">
          {groupedCategories.map(({ group, categories }) => (
            <div key={group.id} className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {group.name}
              </p>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const IconComponent =
                    icons[kebabToPascal(cat.icon) as keyof typeof icons];
                  const isSelected = cat.id === value;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onSelect(cat.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        isSelected
                          ? "bg-emerald-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ backgroundColor: cat.color + "20" }}
                      >
                        {IconComponent && (
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: cat.color }}
                          />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isSelected
                            ? "font-medium text-emerald-700"
                            : "text-gray-700"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && searchQuery && (
            <p className="py-8 text-center text-sm text-gray-500">
              No se encontraron categorías
            </p>
          )}
        </div>

        {/* New Category button */}
        <div className="flex-none border-t px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <button
            type="button"
            onClick={handleNewCategory}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 py-3 text-emerald-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Nueva Categoría</span>
          </button>
        </div>
      </div>
    </div>
  );
}
