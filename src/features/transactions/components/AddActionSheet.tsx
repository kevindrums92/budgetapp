import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, ChevronRight, Sparkles } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SHEET_HEIGHT = 290;
const DRAG_THRESHOLD = 0.3;

export default function AddActionSheet({ open, onClose }: Props) {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  function handleOpenAssistant() {
    onClose();
    navigate("/assistant");
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
          {/* AI Assistant Button - Wide Featured Rectangle */}
          <button
            type="button"
            onClick={handleOpenAssistant}
            className="group relative mb-6 flex w-full items-center gap-4 rounded-[24px] p-4 pr-5 transition-all duration-300 active:scale-[0.98]"
          >
            {/* Ambient Background & Border */}
            <div className="absolute inset-0 overflow-hidden rounded-[24px] bg-[#F0FAFA] dark:bg-[#1E2532] shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-[#20B2A6]/15 via-[#20B2A6]/5 to-transparent dark:from-[#20B2A6]/20 opacity-80" />
              <div className="absolute inset-0 rounded-[24px] border border-[#20B2A6]/30 dark:border-[#20B2A6]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" />
            </div>

            {/* Glowy Icon */}
            <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#3CC0B4] shadow-[0_0_24px_rgba(60,192,180,0.5)] transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
              <Sparkles size={24} className="text-white relative z-10" strokeWidth={2} />
            </div>

            {/* Text Content */}
            <div className="flex-1 text-left relative z-10 py-1">
              <span className="block text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">
                {t('addActionSheet.smartAssistant', { defaultValue: 'Asistente IA' })}
              </span>
              <span className="block text-[14px] mt-0.5 text-gray-500 dark:text-gray-400 font-semibold tracking-wide">
                {t('addActionSheet.smartAssistantHint', { defaultValue: 'La forma más rápida' })}
              </span>
            </div>

            {/* Minimalist Arrow */}
            <div className="relative z-10 flex items-center justify-center text-[#20B2A6]/60 dark:text-gray-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#20B2A6] dark:group-hover:text-gray-300">
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </div>
          </button>

          {/* Manual Entry Section - Two Columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Add Expense */}
            <button
              type="button"
              onClick={handleAddExpense}
              data-testid="add-expense-button"
              className="group relative flex flex-col items-center justify-center gap-4 rounded-[28px] p-6 transition-all duration-300 active:scale-[0.98]"
            >
              <div className="absolute inset-0 rounded-[28px] bg-gray-50 dark:bg-[#1C1F26] border border-gray-100 dark:border-white/5 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-[#20242D]" />

              <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-red-100/80 dark:bg-[#2E2024]">
                <TrendingDown className="h-6 w-6 text-red-500 dark:text-[#FF7A7A]" strokeWidth={2.5} />
              </div>

              <div className="relative z-10 text-center">
                <span className="block text-[16px] font-bold text-gray-900 dark:text-white mb-0.5">
                  {t('addActionSheet.expense', { defaultValue: 'Gasto' })}
                </span>
                <span className="block text-[13px] text-gray-500 font-semibold tracking-wide">
                  {t('addActionSheet.manualText', { defaultValue: 'Manual' })}
                </span>
              </div>
            </button>

            {/* Add Income */}
            <button
              type="button"
              onClick={handleAddIncome}
              data-testid="add-income-button"
              className="group relative flex flex-col items-center justify-center gap-4 rounded-[28px] p-6 transition-all duration-300 active:scale-[0.98]"
            >
              <div className="absolute inset-0 rounded-[28px] bg-gray-50 dark:bg-[#1C1F26] border border-gray-100 dark:border-white/5 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-[#20242D]" />

              <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-emerald-100/80 dark:bg-[#182C29]">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-[#20D080]" strokeWidth={2.5} />
              </div>

              <div className="relative z-10 text-center">
                <span className="block text-[16px] font-bold text-gray-900 dark:text-white mb-0.5">
                  {t('addActionSheet.income', { defaultValue: 'Ingreso' })}
                </span>
                <span className="block text-[13px] text-gray-500 font-semibold tracking-wide">
                  {t('addActionSheet.manualText', { defaultValue: 'Manual' })}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
