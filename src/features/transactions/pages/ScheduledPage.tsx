import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Repeat, Info, CirclePlus, ToggleRight, Eye, Clock, XCircle, Plus } from "lucide-react";
import PageHeader from "@/shared/components/layout/PageHeader";
import ScheduleListItem from "../components/ScheduleListItem";
import AddActionSheet from "../components/AddActionSheet";
import PaywallModal from "@/shared/components/modals/PaywallModal";
import { useBudgetStore } from "@/state/budget.store";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import SpotlightTour from "@/features/tour/components/SpotlightTour";
import { scheduledPageTour } from "@/features/tour/tours/scheduledPageTour";
import { useSpotlightTour } from "@/features/tour/hooks/useSpotlightTour";
import type { Transaction } from "@/types/budget.types";

type TabType = "active" | "inactive";

export default function ScheduledPage() {
  const { t } = useTranslation("scheduled");
  const transactions = useBudgetStore((s) => s.transactions);
  const getCategoryById = useBudgetStore((s) => s.getCategoryById);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const { shouldShowPaywall } = useSubscription();

  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
  });

  // Spotlight tour
  const { isActive: isTourActive, startTour, completeTour } = useSpotlightTour("scheduledPage");

  // Get all templates (transactions with schedule)
  const templates = useMemo(() => {
    return transactions.filter((tx) => tx.schedule !== undefined);
  }, [transactions]);

  // Classify by schedule.enabled
  const { active, inactive } = useMemo(() => {
    const active: Transaction[] = [];
    const inactive: Transaction[] = [];

    for (const t of templates) {
      if (t.schedule?.enabled) {
        active.push(t);
      } else {
        inactive.push(t);
      }
    }

    return { active, inactive };
  }, [templates]);

  // Start tour when templates exist (info banner is visible)
  useEffect(() => {
    if (templates.length > 0) {
      startTour();
    }
  }, [templates.length, startTour]);

  // Handle inactivate (set schedule.enabled = false)
  const handleInactivate = (id: string) => {
    const template = transactions.find((t) => t.id === id);
    if (template?.schedule) {
      updateTransaction(id, {
        schedule: {
          ...template.schedule,
          enabled: false,
        },
      });
    }
  };

  // Handle FAB click with limit check
  const handleFabClick = () => {
    if (shouldShowPaywall('unlimited_scheduled')) {
      setShowPaywall(true);
      return;
    }
    setShowActionSheet(true);
  };

  const currentList = activeTab === "active" ? active : inactive;
  const isEmpty = currentList.length === 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title={t("title")} />

      <main className="mx-auto max-w-xl px-4 pt-6 pb-28">
        {/* Tabs - Only show when there are templates */}
        {templates.length > 0 && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                  activeTab === "active"
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <Clock size={14} strokeWidth={2.5} />
                Activas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inactive")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                  activeTab === "inactive"
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <XCircle size={14} strokeWidth={2.5} />
                Inactivas
              </button>
            </div>

            {/* Info Banner - Only show on active tab */}
            {activeTab === "active" && (
              <div className="mb-4 rounded-xl bg-[#18B7B0]/5 dark:bg-[#18B7B0]/10 p-3 flex items-start gap-2" data-tour="scheduled-info-banner">
                <Info className="h-4 w-4 shrink-0 text-[#18B7B0] mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t("infoBanner.message")}
                </p>
              </div>
            )}
          </>
        )}
        {/* Empty State - New Design with Teal Theme */}
        {isEmpty && templates.length === 0 && (
          <div className="space-y-6">
            {/* Icon with Teal Glow */}
            <div className="relative flex justify-center pt-8 pb-4">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-[#18B7B0] opacity-20 blur-3xl" />
              </div>

              {/* Icon container */}
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gray-900 dark:bg-gray-800">
                <Calendar className="absolute h-12 w-12 text-gray-400 dark:text-gray-500" />
                <Repeat className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-[#18B7B0] p-1 text-white" />
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                {t("emptyState.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t("emptyState.subtitle")}
              </p>
            </div>

            {/* How it works banner */}
            <div className="rounded-2xl bg-[#18B7B0]/5 dark:bg-[#18B7B0]/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#18B7B0]/10 dark:bg-[#18B7B0]/20">
                  <Info className="h-4 w-4 text-[#18B7B0]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {t("emptyState.howItWorks.title")}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                    {t("emptyState.howItWorks.description")}
                  </p>
                </div>
              </div>
            </div>

            {/* User Flow Steps */}
            <div className="grid grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center rounded-xl bg-white dark:bg-gray-900 p-4 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <CirclePlus className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-900 dark:text-gray-50">
                  {t("emptyState.steps.step1.title")}
                </p>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  {t("emptyState.steps.step1.description")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center rounded-xl bg-white dark:bg-gray-900 p-4 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18B7B0]/10 dark:bg-[#18B7B0]/20">
                  <ToggleRight className="h-6 w-6 text-[#18B7B0]" />
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-900 dark:text-gray-50">
                  {t("emptyState.steps.step2.title")}
                </p>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  {t("emptyState.steps.step2.description")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center rounded-xl bg-white dark:bg-gray-900 p-4 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Eye className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-900 dark:text-gray-50">
                  {t("emptyState.steps.step3.title")}
                </p>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  {t("emptyState.steps.step3.description")}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleFabClick}
              className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
            >
              {t("emptyState.cta")}
            </button>
          </div>
        )}

        {/* Empty State - When tab is empty but there are templates */}
        {isEmpty && templates.length > 0 && (
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 text-center shadow-sm">
            <Calendar className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">
              {activeTab === "active"
                ? t("emptyActive.title")
                : t("emptyInactive.title")}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {activeTab === "active"
                ? t("emptyActive.message")
                : t("emptyInactive.message")}
            </p>
          </div>
        )}

        {/* List */}
        {!isEmpty && (
          <div className="space-y-3">
            {currentList.map((tx) => (
              <ScheduleListItem
                key={tx.id}
                transaction={tx}
                category={getCategoryById(tx.category)}
                isEnded={activeTab === "inactive"}
                onInactivate={handleInactivate}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB with Gradient Background - Only show on empty state or active tab */}
      {(templates.length === 0 || activeTab === "active") && (
        <div
          className="fixed right-4 z-40"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
          data-tour="scheduled-fab"
        >
          <button
            type="button"
            onClick={handleFabClick}
            className="group relative"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-gray-900/0 via-gray-50/50 to-gray-50 dark:from-gray-950/0 dark:via-gray-950/50 dark:to-gray-950 blur-xl" />

            {/* Button Circle */}
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform active:scale-95">
              <Plus size={26} strokeWidth={2.2} />
            </div>
          </button>
        </div>
      )}

      {/* Add Action Sheet */}
      <AddActionSheet
        open={showActionSheet}
        onClose={() => setShowActionSheet(false)}
      />

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="scheduled_limit"
        onSelectPlan={handleSelectPlan}
      />

      <SpotlightTour config={scheduledPageTour} isActive={isTourActive} onComplete={completeTour} />
    </div>
  );
}
