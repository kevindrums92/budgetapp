import { useTranslation } from "react-i18next";
import { TrendingUp, CalendarRange } from "lucide-react";
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

export default function Step3_CalcType({ data, updateField }: Props) {
  const { t } = useTranslation("debts");

  const options: { value: InterestType; icon: React.ElementType; titleKey: string; descKey: string }[] = [
    { value: "compound", icon: TrendingUp, titleKey: "compound_title", descKey: "compound_desc" },
    { value: "french_amortization", icon: CalendarRange, titleKey: "french_title", descKey: "french_desc" },
  ];

  return (
    <div className="px-6 pt-4">
      <SlideAnimation direction="right" delay={0}>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("wizard.step3.title")}
        </h1>
      </SlideAnimation>

      <SlideAnimation direction="up" delay={50}>
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t("wizard.step3.subtitle")}
        </p>
      </SlideAnimation>

      <div className="space-y-3">
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = data.interestType === option.value;
          return (
            <SlideAnimation key={option.value} direction="up" delay={100 + index * 50}>
              <button
                type="button"
                onClick={() => updateField("interestType", option.value)}
                className={`w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-gray-900 dark:bg-gray-50 shadow-md"
                    : "bg-white dark:bg-gray-900 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-[#18B7B0]/20"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <Icon
                      size={24}
                      className={
                        isSelected
                          ? "text-[#18B7B0]"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-base font-semibold mb-1 ${
                        isSelected
                          ? "text-white dark:text-gray-900"
                          : "text-gray-900 dark:text-gray-50"
                      }`}
                    >
                      {t(`wizard.step3.${option.titleKey}`)}
                    </p>
                    <p
                      className={`text-sm leading-relaxed ${
                        isSelected
                          ? "text-gray-300 dark:text-gray-600"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {t(`wizard.step3.${option.descKey}`)}
                    </p>
                  </div>
                </div>
              </button>
            </SlideAnimation>
          );
        })}
      </div>
    </div>
  );
}
