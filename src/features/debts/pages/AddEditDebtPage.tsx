import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import ProgressDots from "@/features/onboarding/components/ProgressDots";
import { useBudgetStore } from "@/state/budget.store";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { formatNumberWithThousands, parseFormattedNumber } from "@/shared/utils/number.utils";
import { calculateFixedPayment, calculateRemainingInstallments } from "../services/interest.service";
import type { DebtType, InterestType } from "@/types/budget.types";

import WizardSummaryHeader from "../components/debt-wizard/WizardSummaryHeader";
import Step1_Name from "../components/debt-wizard/Step1_Name";
import Step2_DebtType from "../components/debt-wizard/Step2_DebtType";
import Step3_CalcType from "../components/debt-wizard/Step3_CalcType";
import Step4_Balance from "../components/debt-wizard/Step4_Balance";
import Step5_Interest from "../components/debt-wizard/Step5_Interest";
import Step6_Payment from "../components/debt-wizard/Step6_Payment";
import Step7_Details from "../components/debt-wizard/Step7_Details";

export type WizardFormData = {
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

const TOTAL_STEPS = 7;

const INITIAL_DATA: WizardFormData = {
  name: "",
  type: "credit_card",
  interestType: "compound",
  balance: "",
  rate: "",
  rateMode: "ea",
  isNewCredit: false,
  minimumPayment: "",
  totalInstallments: "",
  dueDay: "",
  notes: "",
};

/** Convert rate to EA for storage/calculations */
function getAnnualRate(rate: string, rateMode: "ea" | "em"): number {
  const r = Number(rate);
  if (!r || r <= 0) return 0;
  if (rateMode === "ea") return r;
  // EM → EA
  return (Math.pow(1 + r / 100, 12) - 1) * 100;
}

export default function AddEditDebtPage() {
  const { t } = useTranslation("debts");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  useKeyboardDismiss();

  const addDebt = useBudgetStore((s) => s.addDebt);
  const updateDebt = useBudgetStore((s) => s.updateDebt);
  const getDebtById = useBudgetStore((s) => s.getDebtById);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardFormData>(INITIAL_DATA);

  // Load existing debt for editing
  useEffect(() => {
    if (id) {
      const debt = getDebtById(id);
      if (debt) {
        setData({
          name: debt.name,
          type: debt.type,
          interestType: debt.interestType,
          balance: formatNumberWithThousands(debt.currentBalance),
          rate: String(debt.annualInterestRate),
          rateMode: "ea",
          isNewCredit: false,
          minimumPayment: formatNumberWithThousands(debt.minimumPayment),
          totalInstallments: debt.totalInstallments ? String(debt.totalInstallments) : "",
          dueDay: debt.dueDay ? String(debt.dueDay) : "",
          notes: debt.notes || "",
        });
      }
    }
  }, [id, getDebtById]);

  const updateField = useCallback(<K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Validation per step
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return data.name.trim().length > 0;
      case 4:
        return parseFormattedNumber(data.balance) > 0;
      case 6: {
        const isFrench = data.interestType === "french_amortization";
        if (isFrench && data.isNewCredit) {
          return Number(data.totalInstallments) > 0;
        }
        return parseFormattedNumber(data.minimumPayment) > 0;
      }
      default:
        return true;
    }
  }, [step, data]);

  // Auto-fill payment for new french amortization
  useEffect(() => {
    if (data.interestType === "french_amortization" && data.isNewCredit) {
      const b = parseFormattedNumber(data.balance);
      const n = Number(data.totalInstallments);
      const annualRate = getAnnualRate(data.rate, data.rateMode);
      if (b > 0 && n > 0) {
        const payment = calculateFixedPayment(b, annualRate, n);
        setData((prev) => ({ ...prev, minimumPayment: formatNumberWithThousands(payment) }));
      }
    }
  }, [data.interestType, data.isNewCredit, data.balance, data.totalInstallments, data.rate, data.rateMode]);

  // Auto-fill installments for existing french amortization
  useEffect(() => {
    if (data.interestType === "french_amortization" && !data.isNewCredit) {
      const b = parseFormattedNumber(data.balance);
      const p = parseFormattedNumber(data.minimumPayment);
      const annualRate = getAnnualRate(data.rate, data.rateMode);
      if (b > 0 && p > 0) {
        const installments = calculateRemainingInstallments(b, annualRate, p);
        if (installments !== null) {
          setData((prev) => ({ ...prev, totalInstallments: String(installments) }));
        }
      }
    }
  }, [data.interestType, data.isNewCredit, data.balance, data.minimumPayment, data.rate, data.rateMode]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      navigate(-1);
    }
  };

  const handleGoToStep = (targetStep: number) => {
    if (targetStep >= 1 && targetStep <= TOTAL_STEPS) {
      setStep(targetStep);
    }
  };

  const handleSave = () => {
    const annualRate = getAnnualRate(data.rate, data.rateMode);

    const balanceNum = parseFormattedNumber(data.balance);
    const paymentNum = parseFormattedNumber(data.minimumPayment);

    if (isEditing && id) {
      updateDebt(id, {
        name: data.name.trim(),
        type: data.type,
        interestType: data.interestType,
        currentBalance: Math.round(balanceNum),
        annualInterestRate: Number(annualRate.toFixed(2)),
        minimumPayment: Math.round(paymentNum),
        dueDay: data.dueDay ? Number(data.dueDay) : undefined,
        totalInstallments: data.totalInstallments ? Number(data.totalInstallments) : undefined,
        notes: data.notes.trim() || undefined,
      });
    } else {
      addDebt({
        name: data.name.trim(),
        type: data.type,
        interestType: data.interestType,
        currentBalance: balanceNum,
        annualInterestRate: Number(annualRate.toFixed(2)),
        minimumPayment: paymentNum,
        dueDay: data.dueDay ? Number(data.dueDay) : undefined,
        totalInstallments: data.totalInstallments ? Number(data.totalInstallments) : undefined,
        notes: data.notes.trim() || undefined,
      });
    }

    navigate(-1);
  };

  const isLastStep = step === TOTAL_STEPS;

  return (
    <div
      className="flex h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 16px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
      }}
    >
      {/* Header */}
      <header className="z-10 flex shrink-0 items-center justify-between px-6 pb-2 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
          aria-label="Back"
        >
          <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>

        <ProgressDots total={TOTAL_STEPS} current={step} />

        {/* Spacer */}
        <div className="h-10 w-10" />
      </header>

      {/* Summary header */}
      <WizardSummaryHeader
        data={data}
        currentStep={step}
        onGoToStep={handleGoToStep}
      />

      {/* Step content */}
      <main className="flex-1 overflow-y-auto">
        {step === 1 && <Step1_Name data={data} updateField={updateField} />}
        {step === 2 && <Step2_DebtType data={data} updateField={updateField} />}
        {step === 3 && <Step3_CalcType data={data} updateField={updateField} />}
        {step === 4 && <Step4_Balance data={data} updateField={updateField} />}
        {step === 5 && <Step5_Interest data={data} updateField={updateField} />}
        {step === 6 && <Step6_Payment data={data} updateField={updateField} />}
        {step === 7 && (
          <Step7_Details
            data={data}
            updateField={updateField}
          />
        )}
      </main>

      {/* CTA Button */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {isLastStep
            ? isEditing
              ? t("wizard.update")
              : t("wizard.save")
            : t("wizard.continue")}
        </button>
      </div>

    </div>
  );
}
