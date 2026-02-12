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

export default function Step1_Name({ data, updateField }: Props) {
  const { t } = useTranslation("debts");

  return (
    <div className="px-6 pt-4">
      <SlideAnimation direction="right" delay={0}>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("wizard.step1.title")}
        </h1>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={50}>
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t("wizard.step1.subtitle")}
        </p>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={100}>
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder={t("wizard.step1.placeholder")}
            autoFocus
            className="w-full text-lg text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
      </SlideAnimation>
    </div>
  );
}
