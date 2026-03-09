/**
 * ExportPDFSheet
 * Bottom sheet with date range picker for PDF report generation.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Loader2 } from 'lucide-react';
import { useBudgetStore } from '@/state/budget.store';
import { useCurrency } from '@/features/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { todayISO } from '@/services/dates.service';
import DatePicker from '@/shared/components/modals/DatePicker';
import { downloadBlobFile } from '@/shared/utils/download.utils';
import { logger } from '@/shared/utils/logger';
import { prepareFinancialReportData } from '../../services/pdf-data.service';
import { generateFinancialReportPDF } from '../../services/pdf-generation.service';
import type { FinancialReportLabels } from '../../services/pdf-data.service';
import type { Transaction } from '@/types/budget.types';

interface Props {
  open: boolean;
  onClose: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  /** Pre-filtered transactions (e.g., from HistoryPage filters) */
  preFilteredTransactions?: Transaction[];
}

export default function ExportPDFSheet({
  open,
  onClose,
  initialStartDate,
  initialEndDate,
  preFilteredTransactions,
}: Props) {
  const { t } = useTranslation('profile');
  const { currencyInfo } = useCurrency();
  const { getLocale } = useLanguage();
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categoryDefinitions);

  // Default: first day of current month to today
  const today = todayISO();
  const defaultStart = initialStartDate ?? `${today.slice(0, 7)}-01`;
  const defaultEnd = initialEndDate ?? today;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Drag-to-dismiss
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const DRAG_THRESHOLD = 0.3;

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const diff = clientY - startYRef.current;
    setDragOffset(diff > 0 ? diff : 0);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const sheetHeight = sheetRef.current?.offsetHeight ?? 400;
    if (dragOffset > sheetHeight * DRAG_THRESHOLD) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart],
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove],
  );
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleDragStart(e.clientY),
    [handleDragStart],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

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

  // Reset dates when sheet opens with new initial values
  useEffect(() => {
    if (open) {
      setStartDate(initialStartDate ?? `${todayISO().slice(0, 7)}-01`);
      setEndDate(initialEndDate ?? todayISO());
      setError(null);
    }
  }, [open, initialStartDate, initialEndDate]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Count transactions in range
  const txInRange = useMemo(() => {
    const source = preFilteredTransactions ?? transactions;
    return source.filter((tx) => tx.date >= startDate && tx.date <= endDate).length;
  }, [transactions, preFilteredTransactions, startDate, endDate]);

  const buildLabels = (): FinancialReportLabels => ({
    title: t('export.pdf.labels.financialTitle', 'Financial Report'),
    totalIncome: t('export.pdf.labels.totalIncome', 'Total Income'),
    totalExpenses: t('export.pdf.labels.totalExpenses', 'Total Expenses'),
    netBalance: t('export.pdf.labels.netBalance', 'Net Balance'),
    savingsRate: t('export.pdf.labels.savingsRate', 'Savings Rate'),
    transactionsInPeriod: t('export.pdf.labels.transactionsInPeriod', 'transactions in period'),
    expensesByCategory: t('export.pdf.labels.expensesByCategory', 'Expenses by Category'),
    analysis: t('export.pdf.labels.analysis', 'Analysis'),
    dailyAverage: t('export.pdf.labels.dailyAverage', 'Daily spending average'),
    topCategory: t('export.pdf.labels.topCategory', 'Top category'),
    topDay: t('export.pdf.labels.topDay', 'Highest spending day'),
    daysInRange: t('export.pdf.labels.daysInRange', 'Days in period'),
    transactionDetails: t('export.pdf.labels.transactionDetails', 'Transaction Details'),
    generatedWith: t('export.pdf.labels.generatedWith', 'Generated with SmartSpend'),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const source = preFilteredTransactions ?? transactions;
      const data = prepareFinancialReportData(
        source,
        categories,
        startDate,
        endDate,
        currencyInfo,
        getLocale(),
        buildLabels(),
      );

      const blob = await generateFinancialReportPDF(data);

      const reportWord = t('export.pdf.report', 'report');
      const filename = `${reportWord}-${startDate}-${endDate}.pdf`;
      await downloadBlobFile(blob, filename);

      onClose();
    } catch (err) {
      const msg = t('export.pdf.errorGeneric', 'Could not generate PDF. Please try again.');
      logger.error('ExportPDFSheet', 'PDF generation failed:', err);
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  function formatDisplayDate(dateStr: string) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        style={{
          opacity: isAnimating
            ? Math.max(0, 1 - dragOffset / (sheetRef.current?.offsetHeight ?? 400)) * 0.5
            : 0,
          transition: isDragging ? 'none' : 'opacity 300ms ease-out',
        }}
        onClick={onClose}
        aria-label="Cerrar"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900"
        style={{
          transform: isAnimating
            ? `translateY(${dragOffset}px)`
            : 'translateY(100%)',
          transition: isDragging
            ? 'none'
            : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        <div className="px-4 pb-[calc(var(--sab)+16px)]">
          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {t('export.pdf.title', 'Reporte PDF')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('export.pdf.description', 'Genera un reporte visual con resumen y graficos')}
              </p>
            </div>
          </div>

          {/* Date range selector */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setShowStartPicker(true)}
              className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-700"
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('export.pdf.startDate', 'Fecha inicio')}
              </p>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDisplayDate(startDate)}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowEndPicker(true)}
              className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-700"
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('export.pdf.endDate', 'Fecha fin')}
              </p>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDisplayDate(endDate)}
                </span>
              </div>
            </button>
          </div>

          {/* Transaction count preview */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 mb-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{txInRange}</span>
              {' '}{t('export.pdf.transactionsInRange', 'transacciones en el rango')}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || txInRange === 0}
            className="w-full rounded-2xl bg-gray-900 dark:bg-[#18B7B0] py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('export.pdf.generating', 'Generando reporte...')}
              </>
            ) : (
              <>
                <FileText size={18} />
                {t('export.pdf.generate', 'Generar PDF')}
              </>
            )}
          </button>

          {txInRange === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
              {t('export.pdf.noTransactions', 'No hay transacciones en el rango seleccionado')}
            </p>
          )}
        </div>
      </div>

      {/* Date pickers */}
      <DatePicker
        open={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        value={startDate}
        onChange={setStartDate}
      />
      <DatePicker
        open={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        value={endDate}
        onChange={setEndDate}
      />
    </div>
  );
}
