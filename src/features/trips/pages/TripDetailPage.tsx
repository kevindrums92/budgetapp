import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Plus,
  MapPin,
  Calendar,
  Plane,
  Utensils,
  Hotel,
  ShoppingBag,
  Ticket,
  HelpCircle,
  FileText,
  Loader2,
} from "lucide-react";
import type { TripExpenseCategory } from "@/types/budget.types";
import PageHeader from "@/shared/components/layout/PageHeader";
import { downloadBlobFile } from "@/shared/utils/download.utils";
import { logger } from "@/shared/utils/logger";
import { prepareTripReportData } from "@/features/pdf-export/services/pdf-data.service";
import { generateTripReportPDF } from "@/features/pdf-export/services/pdf-generation.service";
import type { TripReportLabels } from "@/features/pdf-export/services/pdf-data.service";

const CATEGORY_CONFIG: Record<
  TripExpenseCategory,
  { icon: typeof Plane; color: string }
> = {
  transport: { icon: Plane, color: "bg-blue-100 text-blue-600" },
  accommodation: { icon: Hotel, color: "bg-purple-100 text-purple-600" },
  food: { icon: Utensils, color: "bg-orange-100 text-orange-600" },
  activities: { icon: Ticket, color: "bg-pink-100 text-pink-600" },
  shopping: { icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600" },
  other: { icon: HelpCircle, color: "bg-gray-100 text-gray-600" },
};

export default function TripDetailPage() {
  const { t } = useTranslation('trips');
  const { t: tProfile } = useTranslation('profile');
  const navigate = useNavigate();
  const { formatAmount, currencyInfo } = useCurrency();
  const { getLocale } = useLanguage();
  const params = useParams<{ id: string }>();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const trips = useBudgetStore((s) => s.trips);
  const tripExpenses = useBudgetStore((s) => s.tripExpenses);

  const trip = useMemo(() => {
    if (!params.id) return null;
    return trips.find((t) => t.id === params.id) ?? null;
  }, [params.id, trips]);

  const expenses = useMemo(() => {
    if (!trip) return [];
    return tripExpenses
      .filter((e) => e.tripId === trip.id)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.createdAt - a.createdAt;
      });
  }, [trip, tripExpenses]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const spentByCategory = useMemo(() => {
    const map: Partial<Record<TripExpenseCategory, number>> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return map;
  }, [expenses]);

  useEffect(() => {
    if (!trip && params.id) navigate("/trips", { replace: true });
  }, [trip, params.id, navigate]);

  if (!trip) return null;

  const buildTripLabels = (): TripReportLabels => ({
    title: tProfile('export.pdf.labels.tripTitle', 'Trip Report'),
    budget: tProfile('export.pdf.labels.budget', 'Budget'),
    spent: tProfile('export.pdf.labels.spent', 'Spent'),
    available: tProfile('export.pdf.labels.available', 'Available'),
    exceeded: tProfile('export.pdf.labels.exceeded', 'Exceeded'),
    budgetUsed: tProfile('export.pdf.labels.budgetUsed', 'of budget used'),
    expensesByCategory: tProfile('export.pdf.labels.expensesByCategory', 'Expenses by Category'),
    expenseDetails: tProfile('export.pdf.labels.expenseDetails', 'Expense Details'),
    total: tProfile('export.pdf.labels.total', 'Total'),
    generatedWith: tProfile('export.pdf.labels.generatedWith', 'Generated with SmartSpend'),
    since: tProfile('export.pdf.labels.since', 'Since'),
    statusPlanning: tProfile('export.pdf.labels.statusPlanning', 'Planning'),
    statusActive: tProfile('export.pdf.labels.statusActive', 'In progress'),
    statusCompleted: tProfile('export.pdf.labels.statusCompleted', 'Completed'),
    categoryTransport: tProfile('export.pdf.labels.catTransport', 'Transport'),
    categoryAccommodation: tProfile('export.pdf.labels.catAccommodation', 'Accommodation'),
    categoryFood: tProfile('export.pdf.labels.catFood', 'Food'),
    categoryActivities: tProfile('export.pdf.labels.catActivities', 'Activities'),
    categoryShopping: tProfile('export.pdf.labels.catShopping', 'Shopping'),
    categoryOther: tProfile('export.pdf.labels.catOther', 'Other'),
  });

  const handleExportPDF = async () => {
    setGeneratingPDF(true);
    setPdfError(null);
    try {
      const data = prepareTripReportData(trip, tripExpenses, currencyInfo, getLocale(), buildTripLabels());
      const blob = await generateTripReportPDF(data);
      const safeName = trip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const filename = `trip-${safeName || "report"}.pdf`;
      await downloadBlobFile(blob, filename);
    } catch (err) {
      logger.error("TripDetail", "PDF generation failed:", err);
      setPdfError(tProfile('export.pdf.errorGeneric', 'Could not generate PDF. Please try again.'));
    } finally {
      setGeneratingPDF(false);
    }
  };

  const remaining = trip.budget - totalSpent;
  const progress = trip.budget > 0 ? Math.min((totalSpent / trip.budget) * 100, 100) : 0;
  const isOverBudget = totalSpent > trip.budget;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader
        title={
          <div className="flex flex-col -mt-1">
            <span className="font-semibold text-gray-900">{trip.name}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={11} />
              <span>{trip.destination}</span>
            </div>
          </div>
        }
        onBack={() => navigate("/trips")}
        rightActions={
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={generatingPDF}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 disabled:opacity-50"
            aria-label="Exportar PDF"
          >
            {generatingPDF ? (
              <Loader2 size={20} className="animate-spin text-gray-600" />
            ) : (
              <FileText size={20} className="text-gray-600" />
            )}
          </button>
        }
      />

      {pdfError && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{pdfError}</p>
        </div>
      )}

      <div className="flex-1 px-4 pt-6 pb-20">
        {/* Budget summary */}
        <div className="rounded-xl bg-white p-4 shadow-sm mb-6">
          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{t('labels.spent')}</span>
              <span className={isOverBudget ? "text-red-600 font-medium" : "text-gray-900"}>
                {formatAmount(totalSpent)} / {formatAmount(trip.budget)}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverBudget ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Remaining */}
          <div className="text-center">
            <p
              className={`text-2xl font-bold ${
                isOverBudget ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {isOverBudget ? "-" : ""}{formatAmount(Math.abs(remaining))}
            </p>
            <p className="text-xs text-gray-500">
              {isOverBudget ? t('labels.exceeded') : t('labels.available')}
            </p>
          </div>

          {/* Dates */}
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
            <Calendar size={12} />
            <span>
              {formatDate(trip.startDate)}
              {trip.endDate ? ` - ${formatDate(trip.endDate)}` : ` ${t('detail.ongoing')}`}
            </span>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(spentByCategory).length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              {t('detail.byCategory')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(spentByCategory) as [TripExpenseCategory, number][]).map(
                ([cat, amount]) => {
                  const config = CATEGORY_CONFIG[cat];
                  const Icon = config.icon;
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm"
                    >
                      <div className={`rounded-full p-1 ${config.color}`}>
                        <Icon size={10} />
                      </div>
                      <span className="text-xs text-gray-700">{formatAmount(amount)}</span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div>
          {expenses.length > 0 && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              {t('detail.expenses', { count: expenses.length })}
            </p>
          )}

          {expenses.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                {t('detail.emptyExpensesMessage')}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/trips/${trip.id}/expense/new`)}
                className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white active:scale-[0.98] transition-transform"
              >
                {t('detail.addExpenseButton')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => {
                const config = CATEGORY_CONFIG[e.category];
                const Icon = config.icon;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => navigate(`/trips/${trip.id}/expense/${e.id}/edit`)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`shrink-0 rounded-full p-2 ${config.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-500">
                          {t(`expense.categories.${e.category}`)} • {formatDate(e.date)}
                        </p>
                      </div>
                    </div>

                    <span className="whitespace-nowrap font-semibold text-gray-900">
                      {formatAmount(e.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB para agregar (solo cuando ya hay gastos) */}
      {expenses.length > 0 && (
        <button
          type="button"
          onClick={() => navigate(`/trips/${trip.id}/expense/new`)}
          className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
          aria-label={t('detail.addExpenseButtonAria')}
        >
          <Plus size={26} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
