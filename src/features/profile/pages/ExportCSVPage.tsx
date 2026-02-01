/**
 * ExportCSVPage
 * Página para exportar datos a CSV
 */

import { useState } from 'react';
import { FileDown, FileText, FolderOpen, Target, Download, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBudgetStore } from '@/state/budget.store';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywallPurchase } from '@/hooks/usePaywallPurchase';
import PageHeader from '@/shared/components/layout/PageHeader';
import PaywallModal from '@/shared/components/modals/PaywallModal';
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
  action: () => Promise<void>;
};

export default function ExportCSVPage() {
  const { t } = useTranslation('profile');
  const [exporting, setExporting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const budgets = useBudgetStore((s) => s.budgets);

  const { canUseFeature } = useSubscription();
  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
  });

  const handleExport = async (exportFn: () => Promise<void>) => {
    // Check if user can export
    if (!canUseFeature('export_data')) {
      setShowPaywall(true);
      return;
    }

    setExporting(true);
    try {
      await exportFn();
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

            const isLocked = !canUseFeature('export_data');

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleExport(option.action)}
                disabled={exporting}
                className={`w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm transition-all disabled:cursor-not-allowed ${
                  isLocked
                    ? 'opacity-60'
                    : 'hover:shadow-md active:scale-[0.98] disabled:opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${option.color} relative`}>
                    <Icon className="h-6 w-6" strokeWidth={2} />
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900/70 dark:bg-gray-950/70">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {t(option.titleKey)}
                      </p>
                      {isLocked && (
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(option.descriptionKey)} • {itemCount} {t('export.items', 'elementos')}
                    </p>
                  </div>

                  {/* Download icon or lock */}
                  {isLocked ? (
                    <Lock className="h-5 w-5 text-amber-500 shrink-0" />
                  ) : (
                    <FileDown className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="export"
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
