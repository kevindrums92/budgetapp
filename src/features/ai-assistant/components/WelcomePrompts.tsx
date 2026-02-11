import { TrendingUp, PiggyBank, AlertCircle, BarChart2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  onPromptClick: (question: string) => void;
};

export default function WelcomePrompts({ onPromptClick }: Props) {
  const { t } = useTranslation("assistant");

  const prompts = [
    {
      icon: TrendingUp,
      label: t("prompts.topCategory"),
      question: t("prompts.topCategory"),
    },
    {
      icon: BarChart2,
      label: t("prompts.compare"),
      question: t("prompts.compare"),
    },
    {
      icon: AlertCircle,
      label: t("prompts.budgetHealth"),
      question: t("prompts.budgetHealth"),
    },
    {
      icon: PiggyBank,
      label: t("prompts.savingsGoal"),
      question: t("prompts.savingsGoal"),
    },
  ];

  return (
    <div className="py-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#18B7B0]/10">
            <Sparkles size={32} className="text-[#18B7B0]" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-50">
          {t("welcome.title")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("welcome.subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onPromptClick(prompt.question)}
            className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md active:bg-gray-50 dark:bg-gray-800 dark:active:bg-gray-700"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <prompt.icon
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {prompt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
