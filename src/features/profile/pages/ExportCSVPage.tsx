/**
 * ExportCSVPage
 * Página para exportar datos a CSV
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, FileText, FolderOpen, Target, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBudgetStore } from '@/state/budget.store';
import PageHeader from '@/shared/components/layout/PageHeader';
import {
  exportTransactionsToCSV,
  exportCategoriesToCSV,
  exportBudgetsToCSV,
  exportAll,
} from '../services/export.service';

type ExportOption = {
  id: string;
  icon: typeof FileText;
  titleKey: string;
  descriptionKey: string;
  color: string;
  action: () => void;
};

export default function ExportCSVPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const [exporting, setExporting] = useState(false);

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const budgets = useBudgetStore((s) => s.budgets);

  const handleExport = async (exportFn: () => void) => {
    setExporting(true);
    try {
      exportFn();
      // Pequeño delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('[ExportCSV] Error exporting:', error);
      alert('Error al exportar. Por favor, intenta nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  const exportOptions: ExportOption[] = [
    {
      id: 'transactions',
      icon: FileText,
      titleKey: 'export.transactions.title',
      descriptionKey: 'export.transactions.description',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      action: () => exportTransactionsToCSV(transactions, categoryDefinitions),
    },
    {
      id: 'categories',
      icon: FolderOpen,
      titleKey: 'export.categories.title',
      descriptionKey: 'export.categories.description',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      action: () => exportCategoriesToCSV(categoryDefinitions),
    },
    {
      id: 'budgets',
      icon: Target,
      titleKey: 'export.budgets.title',
      descriptionKey: 'export.budgets.description',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      action: () => exportBudgetsToCSV(budgets, categoryDefinitions),
    },
    {
      id: 'all',
      icon: Download,
      titleKey: 'export.all.title',
      descriptionKey: 'export.all.description',
      color: 'bg-teal-100 dark:bg-teal-900/30 text-[#18B7B0]',
      action: () => exportAll(transactions, categoryDefinitions, budgets),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('menu.exportCSV')} />

      {/* Info banner */}
      <div className="px-4 pt-6">
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <FileDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                {t('export.info.title', 'Exportar a CSV')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                {t('export.info.description', 'Los archivos CSV se pueden abrir en Excel, Google Sheets y otras aplicaciones de hojas de cálculo.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export options */}
      <div className="flex-1 px-4 pt-6 pb-8">
        <div className="space-y-3">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const itemCount =
              option.id === 'transactions' ? transactions.length :
              option.id === 'categories' ? categoryDefinitions.length :
              option.id === 'budgets' ? budgets.length :
              transactions.length + categoryDefinitions.length + budgets.length;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleExport(option.action)}
                disabled={exporting}
                className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${option.color}`}>
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-0.5">
                      {t(option.titleKey)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(option.descriptionKey)} • {itemCount} {t('export.items', 'elementos')}
                    </p>
                  </div>

                  {/* Download icon */}
                  <FileDown className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
