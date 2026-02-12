import { useTranslation } from "react-i18next";
import { CreditCard, Landmark, ShoppingBag, MoreHorizontal } from "lucide-react";
import { useCurrency } from "@/features/currency";
import { parseFormattedNumber } from "@/shared/utils/number.utils";
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
  currentStep: number;
  onGoToStep: (step: number) => void;
};

const DEBT_TYPE_ICONS: Record<DebtType, React.ElementType> = {
  credit_card: CreditCard,
  personal_loan: Landmark,
  installment: ShoppingBag,
  other: MoreHorizontal,
};

export default function WizardSummaryHeader({ data, currentStep, onGoToStep }: Props) {
  const { t } = useTranslation("debts");
  const { formatAmount } = useCurrency();

  if (currentStep <= 1 || !data.name.trim()) return null;

  const TypeIcon = DEBT_TYPE_ICONS[data.type];
  const balanceNum = parseFormattedNumber(data.balance);
  const paymentNum = parseFormattedNumber(data.minimumPayment);
  const hasBalance = currentStep > 4 && balanceNum > 0;
  const hasRate = currentStep > 5 && Number(data.rate) > 0;
  const hasPayment = currentStep > 6 && paymentNum > 0;

  return (
    <div className="shrink-0 px-6 pb-3">
      <div className="rounded-xl bg-white dark:bg-gray-900 px-4 py-2.5 shadow-sm">
        {/* Row 1: Name + type */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-sm font-semibold text-gray-900 dark:text-gray-50 transition-colors active:text-[#18B7B0]"
          >
            {data.name}
          </button>
          {currentStep > 2 && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <button
                type="button"
                onClick={() => onGoToStep(2)}
                className="flex items-center gap-1 transition-colors active:text-[#18B7B0]"
              >
                <TypeIcon size={12} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t(`types.${data.type}`)}
                </span>
              </button>
            </>
          )}
          {currentStep > 3 && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <button
                type="button"
                onClick={() => onGoToStep(3)}
                className="text-xs text-gray-500 dark:text-gray-400 transition-colors active:text-[#18B7B0]"
              >
                {data.interestType === "compound"
                  ? t("wizard.step3.compound_title")
                  : t("wizard.step3.french_title")}
              </button>
            </>
          )}
        </div>

        {/* Row 2: Balance + rate + payment */}
        {(hasBalance || hasRate || hasPayment) && (
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {hasBalance && (
              <button
                type="button"
                onClick={() => onGoToStep(4)}
                className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors active:text-[#18B7B0]"
              >
                {formatAmount(balanceNum)}
              </button>
            )}
            {hasRate && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <button
                  type="button"
                  onClick={() => onGoToStep(5)}
                  className="text-xs text-gray-500 dark:text-gray-400 transition-colors active:text-[#18B7B0]"
                >
                  {data.rate}% {data.rateMode === "ea" ? "EA" : "EM"}
                </button>
              </>
            )}
            {hasPayment && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <button
                  type="button"
                  onClick={() => onGoToStep(6)}
                  className="text-xs text-gray-500 dark:text-gray-400 transition-colors active:text-[#18B7B0]"
                >
                  {formatAmount(paymentNum)}/mes
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
