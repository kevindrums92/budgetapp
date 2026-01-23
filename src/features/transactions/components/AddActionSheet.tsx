import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SHEET_HEIGHT = 220;
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
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl"
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
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Content */}
        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">
            {t('addActionSheet.title')}
          </h3>

          <div className="space-y-2">
            {/* Add Income */}
            <button
              type="button"
              onClick={handleAddIncome}
              className="flex w-full items-center gap-4 rounded-2xl bg-emerald-50 px-4 py-4 transition-all active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{t('addActionSheet.addIncome')}</p>
                <p className="text-sm text-gray-500">{t('addActionSheet.incomeHint')}</p>
              </div>
            </button>

            {/* Add Expense */}
            <button
              type="button"
              onClick={handleAddExpense}
              className="flex w-full items-center gap-4 rounded-2xl bg-red-50 px-4 py-4 transition-all active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{t('addActionSheet.addExpense')}</p>
                <p className="text-sm text-gray-500">{t('addActionSheet.expenseHint')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
