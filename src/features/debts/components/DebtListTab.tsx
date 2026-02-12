import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { useSubscription } from "@/hooks/useSubscription";
import { getDebtSummary } from "../services/debt.service";
import DebtCard from "./DebtCard";
import DebtSummaryHeader from "./DebtSummaryHeader";
import type { ProFeature } from "@/constants/pricing";

type Props = {
  onShowPaywall?: (trigger: string) => void;
};

export default function DebtListTab({ onShowPaywall }: Props) {
  const { t } = useTranslation("debts");
  const navigate = useNavigate();
  const debts = useBudgetStore((s) => s.debts);
  const debtPayments = useBudgetStore((s) => s.debtPayments);
  const { canUseFeature } = useSubscription();

  const activeDebts = useMemo(() => debts.filter((d) => d.status === "active"), [debts]);
  const paidOffDebts = useMemo(() => debts.filter((d) => d.status === "paid_off"), [debts]);
  const summary = useMemo(() => getDebtSummary(debts, debtPayments), [debts, debtPayments]);
  const hasDebts = debts.length > 0;

  const handleAddDebt = () => {
    if (!canUseFeature("unlimited_debts" as ProFeature)) {
      onShowPaywall?.("debt_limit");
      return;
    }
    navigate("/debts/new");
  };

  if (!hasDebts) {
    return (
      <button
        type="button"
        onClick={handleAddDebt}
        className="w-full rounded-2xl bg-gray-900 dark:bg-gray-800 p-8 text-center transition-all hover:bg-gray-800 dark:hover:bg-gray-750 active:scale-[0.99]"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#18B7B0]/30 bg-[#18B7B0]/10">
            <Plus size={32} className="text-[#18B7B0]" strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="mb-3 text-xl font-bold text-white">
          {t("page.noDebts")}
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-gray-400">
          {t("page.noDebtsDescription")}
        </p>
        <span className="text-sm font-bold uppercase tracking-wide text-[#18B7B0]">
          {t("page.addFirstDebt")}
        </span>
      </button>
    );
  }

  return (
    <>
      <DebtSummaryHeader summary={summary} />

      {/* Active debts */}
      {activeDebts.length > 0 && (
        <div className="space-y-3">
          {activeDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onClick={() => navigate(`/debts/${debt.id}`)}
            />
          ))}
        </div>
      )}

      {/* Paid off debts */}
      {paidOffDebts.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("page.paidOff")}
          </h3>
          <div className="space-y-3">
            {paidOffDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onClick={() => navigate(`/debts/${debt.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={handleAddDebt}
        className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black dark:bg-emerald-500 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>
    </>
  );
}
