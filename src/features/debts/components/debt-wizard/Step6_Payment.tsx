import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calculator } from "lucide-react";
import SlideAnimation from "@/features/onboarding/components/SlideAnimation";
import { useCurrency } from "@/features/currency";
import { formatNumberWithThousands, parseFormattedNumber } from "@/shared/utils/number.utils";
import { calculateFixedPayment, calculateRemainingInstallments } from "../../services/interest.service";
import type { DebtType, InterestType } from "@/types/budget.types";

type WizardFormData = {
  name: string;
  type: DebtType;
  interestType: InterestType;
  balance: string;
  rate: string;
  rateMode: "ea" | "em";
  isNewCredit: boolean;
  minimumPayment: string;
  totalInstallments: string;
  dueDay: string;
  notes: string;
};

type Props = {
  data: WizardFormData;
  updateField: <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => void;
};

/** Convert rate to EA for calculations */
function getAnnualRate(rate: string, rateMode: "ea" | "em"): number {
  const r = Number(rate);
  if (!r || r <= 0) return 0;
  if (rateMode === "ea") return r;
  // EM → EA: ((1 + EM/100)^12 - 1) * 100
  return (Math.pow(1 + r / 100, 12) - 1) * 100;
}

export default function Step6_Payment({ data, updateField }: Props) {
  const { t } = useTranslation("debts");
  const { currencyInfo, formatAmount } = useCurrency();

  const isFrench = data.interestType === "french_amortization";
  const isNewFrench = isFrench && data.isNewCredit;
  const isExistingFrench = isFrench && !data.isNewCredit;
  const annualRate = getAnnualRate(data.rate, data.rateMode);

  // For new french: calculate payment from installments
  const estimatedPayment = useMemo(() => {
    if (!isNewFrench) return null;
    const b = parseFormattedNumber(data.balance);
    const n = Number(data.totalInstallments);
    if (b <= 0 || n <= 0) return null;
    return calculateFixedPayment(b, annualRate, n);
  }, [isNewFrench, data.balance, data.totalInstallments, annualRate]);

  // For existing french/compound: calculate remaining installments from payment
  const estimatedInstallments = useMemo(() => {
    if (!isExistingFrench) return null;
    const b = parseFormattedNumber(data.balance);
    const p = parseFormattedNumber(data.minimumPayment);
    if (b <= 0 || p <= 0) return null;
    return calculateRemainingInstallments(b, annualRate, p);
  }, [isExistingFrench, data.balance, data.minimumPayment, annualRate]);

  // New french: ask for installments
  if (isNewFrench) {
    return (
      <div className="px-6 pt-4">
        <SlideAnimation direction="right" delay={0}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t("wizard.step6.titleNew")}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t("wizard.step6.subtitleNew")}
          </p>
        </SlideAnimation>

        {/* Installments input */}
        <SlideAnimation direction="up" delay={100}>
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={data.totalInstallments}
                onChange={(e) => updateField("totalInstallments", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="36"
                autoFocus
                className="w-full text-2xl font-semibold text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <span className="text-base font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {t("wizard.step6.months")}
              </span>
            </div>
          </div>
        </SlideAnimation>

        {/* Auto-calculated payment */}
        {estimatedPayment !== null && (
          <SlideAnimation direction="up" delay={150}>
            <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <Calculator size={14} className="text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {t("wizard.step6.calculatedPayment", { amount: formatAmount(estimatedPayment) })}
                </p>
              </div>
            </div>
          </SlideAnimation>
        )}
      </div>
    );
  }

  // Compound or existing french: ask for monthly payment
  return (
    <div className="px-6 pt-4">
      <SlideAnimation direction="right" delay={0}>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("wizard.step6.title")}
        </h1>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={50}>
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t("wizard.step6.subtitle")}
        </p>
      </SlideAnimation>

      {/* Payment input */}
      <SlideAnimation direction="up" delay={100}>
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-gray-400 dark:text-gray-500">
              {currencyInfo.symbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={data.minimumPayment}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, "");
                updateField("minimumPayment", cleaned ? formatNumberWithThousands(cleaned) : "");
              }}
              placeholder="0"
              autoFocus
              className="w-full text-2xl font-semibold text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
          </div>
        </div>
      </SlideAnimation>

      {/* Auto-calculated remaining installments (existing french only) */}
      {isExistingFrench && estimatedInstallments !== null && (
        <SlideAnimation direction="up" delay={150}>
          <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <Calculator size={14} className="text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("wizard.step6.calculatedInstallments", { count: estimatedInstallments })}
              </p>
            </div>
          </div>
        </SlideAnimation>
      )}
    </div>
  );
}
