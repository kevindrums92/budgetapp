import { useTranslation } from "react-i18next";
import { CreditCard, Landmark, ShoppingBag, MoreHorizontal } from "lucide-react";
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

const DEBT_TYPE_OPTIONS: { value: DebtType; icon: React.ElementType; descKey: string }[] = [
  { value: "credit_card", icon: CreditCard, descKey: "credit_card_desc" },
  { value: "personal_loan", icon: Landmark, descKey: "personal_loan_desc" },
  { value: "installment", icon: ShoppingBag, descKey: "installment_desc" },
  { value: "other", icon: MoreHorizontal, descKey: "other_desc" },
];

export default function Step2_DebtType({ data, updateField }: Props) {
  const { t } = useTranslation("debts");

  const handleSelect = (value: DebtType) => {
    updateField("type", value);
    // Smart default for interest type
    if (value === "credit_card") {
      updateField("interestType", "compound");
    } else if (value === "personal_loan" || value === "installment") {
      updateField("interestType", "french_amortization");
    }
  };

  return (
    <div className="px-6 pt-4">
      <SlideAnimation direction="right" delay={0}>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("wizard.step2.title")}
        </h1>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={50}>
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t("wizard.step2.subtitle")}
        </p>
      </SlideAnimation>

      <div className="grid grid-cols-2 gap-3">
        {DEBT_TYPE_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = data.type === option.value;
          return (
            <SlideAnimation key={option.value} direction="up" delay={100 + index * 50}>
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`h-full w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-gray-900 dark:bg-gray-50 shadow-md"
                    : "bg-white dark:bg-gray-900 shadow-sm"
                }`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                    isSelected
                      ? "bg-[#18B7B0]/20"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      isSelected
                        ? "text-[#18B7B0]"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  />
                </div>
                <p
                  className={`text-sm font-semibold mb-1 ${
                    isSelected
                      ? "text-white dark:text-gray-900"
                      : "text-gray-900 dark:text-gray-50"
                  }`}
                >
                  {t(`types.${option.value}`)}
                </p>
                <p
                  className={`text-[11px] leading-snug ${
                    isSelected
                      ? "text-gray-300 dark:text-gray-600"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {t(`wizard.step2.${option.descKey}`)}
                </p>
              </button>
            </SlideAnimation>
          );
        })}
      </div>
    </div>
  );
}
