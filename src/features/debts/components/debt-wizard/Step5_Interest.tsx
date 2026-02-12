import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import SlideAnimation from "@/features/onboarding/components/SlideAnimation";
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

export default function Step5_Interest({ data, updateField }: Props) {
  const { t } = useTranslation("debts");

  // Convert between EA and EM for display
  const convertedRate = useMemo(() => {
    const r = Number(data.rate);
    if (!r || r <= 0) return null;

    if (data.rateMode === "ea") {
      // EA → EM: EM = ((1 + EA/100)^(1/12) - 1) * 100
      const em = (Math.pow(1 + r / 100, 1 / 12) - 1) * 100;
      return { value: em.toFixed(2), label: t("wizard.step5.equivalentEM", { rate: em.toFixed(2) }) };
    } else {
      // EM → EA: EA = ((1 + EM/100)^12 - 1) * 100
      const ea = (Math.pow(1 + r / 100, 12) - 1) * 100;
      return { value: ea.toFixed(2), label: t("wizard.step5.equivalentEA", { rate: ea.toFixed(2) }) };
    }
  }, [data.rate, data.rateMode, t]);

  return (
    <div className="px-6 pt-4">
      <SlideAnimation direction="right" delay={0}>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("wizard.step5.title")}
        </h1>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={50}>
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t("wizard.step5.subtitle")}
        </p>
      </SlideAnimation>

      {/* EA/EM toggle */}
      <SlideAnimation direction="up" delay={100}>
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => updateField("rateMode", "ea")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
              data.rateMode === "ea"
                ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {t("wizard.step5.ea")}
          </button>
          <button
            type="button"
            onClick={() => updateField("rateMode", "em")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
              data.rateMode === "em"
                ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {t("wizard.step5.em")}
          </button>
        </div>
      </SlideAnimation>

      {/* Rate input */}
      <SlideAnimation direction="up" delay={150}>
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={data.rate}
              onChange={(e) => updateField("rate", e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              autoFocus
              className="w-full text-2xl font-semibold text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
            <span className="text-2xl font-semibold text-gray-400 dark:text-gray-500">%</span>
          </div>

          {/* Conversion hint */}
          {convertedRate && (
            <p className="mt-2 text-xs text-[#18B7B0]">
              {convertedRate.label}
            </p>
          )}
        </div>
      </SlideAnimation>

      {/* Help text */}
      <SlideAnimation direction="up" delay={200}>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          {data.rateMode === "ea"
            ? t("wizard.step5.eaHelp")
            : t("wizard.step5.emHelp")}
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {t("wizard.step5.skipHint")}
        </p>
      </SlideAnimation>
    </div>
  );
}
