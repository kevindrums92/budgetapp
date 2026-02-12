import { useTranslation } from "react-i18next";
import SlideAnimation from "@/features/onboarding/components/SlideAnimation";
import { useCurrency } from "@/features/currency";
import { formatNumberWithThousands } from "@/shared/utils/number.utils";
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

export default function Step4_Balance({ data, updateField }: Props) {
  const { t } = useTranslation("debts");
  const { currencyInfo } = useCurrency();
  const isFrench = data.interestType === "french_amortization";

  return (
    <div className="px-6 pt-4">
      <SlideAnimation direction="right" delay={0}>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("wizard.step4.title")}
        </h1>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={50}>
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t("wizard.step4.subtitle")}
        </p>
      </SlideAnimation>

      {/* New/Existing toggle (only for french amortization) */}
      {isFrench && (
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.step4.newOrExisting")}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateField("isNewCredit", true)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  data.isNewCredit
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {t("wizard.step4.newCredit")}
              </button>
              <button
                type="button"
                onClick={() => updateField("isNewCredit", false)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  !data.isNewCredit
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {t("wizard.step4.existingCredit")}
              </button>
            </div>
          </div>
        </SlideAnimation>
      )}

      {/* Balance input */}
      <SlideAnimation direction="up" delay={isFrench ? 150 : 100}>
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {isFrench
              ? data.isNewCredit
                ? t("wizard.step4.newCreditLabel")
                : t("wizard.step4.existingCreditLabel")
              : t("wizard.step4.existingCreditLabel")}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-gray-400 dark:text-gray-500">
              {currencyInfo.symbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={data.balance}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, "");
                updateField("balance", cleaned ? formatNumberWithThousands(cleaned) : "");
              }}
              placeholder="0"
              autoFocus
              className="w-full text-2xl font-semibold text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
          </div>
        </div>
      </SlideAnimation>
    </div>
  );
}
