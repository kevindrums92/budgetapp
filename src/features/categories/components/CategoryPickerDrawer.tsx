import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Search, Plus, AlertCircle } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import type { TransactionType, Category } from "@/types/budget.types";
import { kebabToPascal } from "@/shared/utils/string.utils";

type Props = {
  open: boolean;
  onClose: () => void;
  transactionType: TransactionType;
  value: string | null;
  onSelect: (categoryId: string) => void;
  onNavigateToNewCategory?: () => void;
  /** Whether to show the "New Category" button (default: true) */
  showNewCategoryButton?: boolean;
  /** Show categories from the opposite type too (for batch review type correction) */
  showAllTypes?: boolean;
};

const SHEET_HEIGHT = 500;
const DRAG_THRESHOLD = 0.3;

export default function CategoryPickerDrawer({
  open,
  onClose,
  transactionType,
  value,
  onSelect,
  onNavigateToNewCategory,
  showNewCategoryButton = true,
  showAllTypes = false,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation("categories");
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const transactions = useBudgetStore((s) => s.transactions);

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Filter categories by type and search
  const filteredCategories = useMemo(() => {
    const byType = categoryDefinitions.filter((c) => c.type === transactionType);
    if (!searchQuery.trim()) return byType;
    const query = searchQuery.toLowerCase();
    return byType.filter((c) => c.name.toLowerCase().includes(query));
  }, [categoryDefinitions, transactionType, searchQuery]);

  // Group categories
  const groupedCategories = useMemo(() => {
    const groups = categoryGroups.filter((g) => g.type === transactionType);
    const result: { group: typeof groups[0]; categories: Category[] }[] = [];

    for (const group of groups) {
      const cats = filteredCategories.filter((c) => c.groupId === group.id);
      if (cats.length > 0) {
        result.push({ group, categories: cats });
      }
    }

    return result;
  }, [filteredCategories, transactionType, categoryGroups]);

  // Opposite type categories (for showAllTypes mode)
  const oppositeType: TransactionType = transactionType === "expense" ? "income" : "expense";
  const oppositeGroupedCategories = useMemo(() => {
    if (!showAllTypes) return [];
    const oppCategories = categoryDefinitions.filter((c) => c.type === oppositeType);
    const filtered = searchQuery.trim()
      ? oppCategories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : oppCategories;
    const groups = categoryGroups.filter((g) => g.type === oppositeType);
    const result: { group: typeof groups[0]; categories: Category[] }[] = [];
    for (const group of groups) {
      const cats = filtered.filter((c) => c.groupId === group.id);
      if (cats.length > 0) {
        result.push({ group, categories: cats });
      }
    }
    return result;
  }, [showAllTypes, categoryDefinitions, categoryGroups, oppositeType, searchQuery]);

  // Compute frequent categories from transaction history
  const frequentCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === transactionType && tx.category) {
        counts.set(tx.category, (counts.get(tx.category) || 0) + 1);
      }
    }

    const validCatIds = new Set(filteredCategories.map((c) => c.id));

    return Array.from(counts.entries())
      .filter(([catId, count]) => count >= 2 && validCatIds.has(catId))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([catId]) => categoryDefinitions.find((c) => c.id === catId))
      .filter((c): c is Category => c !== undefined);
  }, [transactions, transactionType, filteredCategories, categoryDefinitions]);

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

  // Touch handlers for category selection (fixes iOS keyboard dismiss issue)
  const handleCategoryTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleCategoryTouchEnd = (categoryId: string) => (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Only select if it was a tap (not a scroll gesture)
    // Allow small movement tolerance of 10px
    if (deltaX < 10 && deltaY < 10) {
      e.preventDefault(); // Prevent click from also firing
      e.stopPropagation(); // Prevent event from bubbling to backdrop
      onSelect(categoryId);
    }

    touchStartRef.current = null;
  };

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
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          height: SHEET_HEIGHT,
          transform: `translateY(${sheetTranslate}px)`,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header - drag enabled only here */}
        <div
          className="flex-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Title and close */}
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{t("picker.title")}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder={t("picker.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2.5 pl-4 pr-10 text-sm text-gray-900 dark:text-gray-50 outline-none focus:border-emerald-300 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* Frequent categories */}
          {frequentCategories.length > 0 && !searchQuery && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("picker.frequent")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {frequentCategories.map((cat) => {
                  const IconComponent =
                    icons[kebabToPascal(cat.icon) as keyof typeof icons];
                  const isSelected = cat.id === value;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onSelect(cat.id)}
                      onTouchStart={handleCategoryTouchStart}
                      onTouchEnd={handleCategoryTouchEnd(cat.id)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
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
                        className={`truncate text-sm ${
                          isSelected
                            ? "font-medium text-emerald-700 dark:text-emerald-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* "All" separator when frequent section is visible */}
          {frequentCategories.length > 0 && !searchQuery && groupedCategories.length > 0 && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("picker.all")}
            </p>
          )}

          {groupedCategories.map(({ group, categories }) => (
            <div key={group.id} className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                      onTouchStart={handleCategoryTouchStart}
                      onTouchEnd={handleCategoryTouchEnd(cat.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
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
                            ? "font-medium text-emerald-700 dark:text-emerald-300"
                            : "text-gray-700 dark:text-gray-300"
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

          {/* Opposite type categories (batch review mode) */}
          {showAllTypes && oppositeGroupedCategories.length > 0 && (
            <>
              {/* Divider */}
              <div className="my-3 border-t border-gray-200 dark:border-gray-700" />

              {/* Warning banner */}
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {oppositeType === "income"
                    ? t("picker.switchToIncome")
                    : t("picker.switchToExpense")}
                </p>
              </div>

              {/* Opposite type section label */}
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {oppositeType === "income"
                  ? t("picker.incomeCategories")
                  : t("picker.expenseCategories")}
              </p>

              {oppositeGroupedCategories.map(({ group, categories }) => (
                <div key={group.id} className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {group.name}
                  </p>
                  <div className="space-y-1">
                    {categories.map((cat) => {
                      const IconComponent =
                        icons[kebabToPascal(cat.icon) as keyof typeof icons];

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => onSelect(cat.id)}
                          onTouchStart={handleCategoryTouchStart}
                          onTouchEnd={handleCategoryTouchEnd(cat.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
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
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {filteredCategories.length === 0 && oppositeGroupedCategories.length === 0 && searchQuery && (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("picker.noResults")}
            </p>
          )}
        </div>

        {/* New Category button */}
        {showNewCategoryButton && (
          <div className="flex-none border-t border-gray-200 dark:border-gray-700 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <button
              type="button"
              onClick={handleNewCategory}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-700 py-3 text-emerald-600 dark:text-emerald-400 transition-colors hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">{t("picker.newCategory")}</span>
            </button>
          </div>
        )}

        {/* Safe area padding when no button */}
        {!showNewCategoryButton && (
          <div className="flex-none pb-[calc(env(safe-area-inset-bottom)+12px)]" />
        )}
      </div>
    </div>
  );
}
