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

export default function Step7_Details({ data, updateField }: Props) {
  const { t } = useTranslation("debts");

  return (
    <div className="px-6 pt-4">
      <SlideAnimation direction="right" delay={0}>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("wizard.step7.title")}
        </h1>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={50}>
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t("wizard.step7.subtitle")}
        </p>
      </SlideAnimation>

      {/* Due day */}
      <SlideAnimation direction="up" delay={100}>
        <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("wizard.step7.dueDayLabel")}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={data.dueDay}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              if (Number(val) <= 31) updateField("dueDay", val);
            }}
            placeholder="15"
            className="w-full text-lg text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
            {t("wizard.step7.dueDayHelp")}
          </p>
        </div>
      </SlideAnimation>

      {/* Notes */}
      <SlideAnimation direction="up" delay={150}>
        <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("wizard.step7.notesLabel")}
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder={t("wizard.step7.notesPlaceholder")}
            rows={3}
            className="w-full resize-none text-base text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
      </SlideAnimation>

    </div>
  );
}
