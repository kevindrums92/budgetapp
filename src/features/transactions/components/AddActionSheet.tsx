import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Mic, Camera, Type, ChevronRight, Sparkles } from "lucide-react";
import BatchEntrySheet from "@/features/batch-entry/components/BatchEntrySheet";
import type { BatchInputType } from "@/features/batch-entry/types/batch-entry.types";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SHEET_HEIGHT = 340;
const DRAG_THRESHOLD = 0.3;

export default function AddActionSheet({ open, onClose }: Props) {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showBatchEntry, setShowBatchEntry] = useState(false);
  const [initialInputType, setInitialInputType] = useState<BatchInputType | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  // Handle open/close animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
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

  function handleAddIncome() {
    onClose();
    navigate("/add?type=income");
  }

  function handleAddExpense() {
    onClose();
    navigate("/add?type=expense");
  }

  function handleBatchEntry(inputType: BatchInputType) {
    setInitialInputType(inputType);
    // Don't close AddActionSheet - just show BatchEntrySheet on top
    // When BatchEntrySheet closes, AddActionSheet will be visible again
    setShowBatchEntry(true);
  }

  function handleCloseBatchEntry() {
    setShowBatchEntry(false);
    setInitialInputType(null);
    // Close AddActionSheet as well
    onClose();
  }

  // Render BatchEntrySheet even when action sheet is closed
  if (showBatchEntry) {
    return (
      <BatchEntrySheet
        open={showBatchEntry}
        onClose={handleCloseBatchEntry}
        initialInputType={initialInputType}
      />
    );
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
        aria-label={t('addActionSheet.close')}
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? "none" : "opacity 300ms ease-out",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          transform: `translateY(${sheetTranslate}px)`,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
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

        {/* Content */}
        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {/* AI Quick Entry Section */}
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('addActionSheet.quickEntry', 'Registro Rápido (IA)')}
              </span>
            </div>

            <div className="flex justify-center gap-6">
              {/* Voice Button */}
              <button
                type="button"
                onClick={() => handleBatchEntry("audio")}
                className="flex flex-col items-center gap-2 transition-all active:scale-95"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                  <Mic className="h-6 w-6 text-violet-500" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t('addActionSheet.dictate', 'Dictar')}
                </span>
              </button>

              {/* Photo Button */}
              <button
                type="button"
                onClick={() => handleBatchEntry("image")}
                className="flex flex-col items-center gap-2 transition-all active:scale-95"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                  <Camera className="h-6 w-6 text-rose-500" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t('addActionSheet.photo', 'Foto')}
                </span>
              </button>

              {/* Text Button */}
              <button
                type="button"
                onClick={() => handleBatchEntry("text")}
                className="flex flex-col items-center gap-2 transition-all active:scale-95"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                  <Type className="h-6 w-6 text-violet-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t('addActionSheet.text', 'Texto')}
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4 border-t border-gray-200 dark:border-gray-700" />

          {/* Manual Entry Section */}
          <div>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('addActionSheet.manual', 'Manual')}
            </span>

            <div className="space-y-2">
              {/* Add Income */}
              <button
                type="button"
                onClick={handleAddIncome}
                className="flex w-full items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 transition-all active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-50">
                  {t('addActionSheet.manualIncome', 'Ingreso Manual')}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              {/* Add Expense */}
              <button
                type="button"
                onClick={handleAddExpense}
                className="flex w-full items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 transition-all active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-50">
                  {t('addActionSheet.manualExpense', 'Gasto Manual')}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
