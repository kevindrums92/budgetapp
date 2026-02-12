import type { Debt, DebtPayment } from "@/types/budget.types";
import {
  projectCompoundPayoff,
  calculateMonthlyInterest,
} from "./interest.service";

export type DebtProgress = {
  debt: Debt;
  totalPaid: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  percentagePaid: number;
  paymentsCount: number;
};

export type DebtSummary = {
  totalDebt: number;
  totalOriginalDebt: number;
  activeDebts: number;
  paidOffDebts: number;
  totalPaid: number;
  totalInterestPaid: number;
  estimatedDebtFreeDate: string | null;
};

/**
 * Calcula el progreso de una deuda individual.
 */
export function calculateDebtProgress(
  debt: Debt,
  payments: DebtPayment[]
): DebtProgress {
  const debtPayments = payments.filter((p) => p.debtId === debt.id);
  const totalPaid = debtPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalInterestPaid = debtPayments.reduce((sum, p) => sum + p.interestPortion, 0);
  const totalPrincipalPaid = debtPayments.reduce((sum, p) => sum + p.principalPortion, 0);
  const percentagePaid = debt.originalBalance > 0
    ? Math.min(100, ((debt.originalBalance - debt.currentBalance) / debt.originalBalance) * 100)
    : 0;

  return {
    debt,
    totalPaid,
    totalInterestPaid,
    totalPrincipalPaid,
    percentagePaid,
    paymentsCount: debtPayments.length,
  };
}

/**
 * Estima la fecha de pago completo de una deuda.
 * @returns Fecha ISO YYYY-MM-DD estimada, o null si no se puede calcular
 */
export function estimatePayoffDate(debt: Debt): string | null {
  if (debt.currentBalance <= 0) return null;
  if (debt.minimumPayment <= 0) return null;

  let months: number;

  if (debt.interestType === "french_amortization" && debt.remainingInstallments) {
    months = debt.remainingInstallments;
  } else {
    const rows = projectCompoundPayoff(
      debt.currentBalance,
      debt.annualInterestRate,
      debt.minimumPayment
    );
    if (rows.length === 0) return null; // impagable
    months = rows.length;
  }

  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

/**
 * Calcula el resumen general de todas las deudas.
 */
export function getDebtSummary(
  debts: Debt[],
  payments: DebtPayment[]
): DebtSummary {
  const activeDebts = debts.filter((d) => d.status === "active");
  const paidOffDebts = debts.filter((d) => d.status === "paid_off");
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0);
  const totalOriginalDebt = debts.reduce((sum, d) => sum + d.originalBalance, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalInterestPaid = payments.reduce((sum, p) => sum + p.interestPortion, 0);

  // Estimar fecha libre de deudas (la mas lejana de todas las activas)
  let estimatedDebtFreeDate: string | null = null;
  for (const debt of activeDebts) {
    const payoffDate = estimatePayoffDate(debt);
    if (payoffDate && (!estimatedDebtFreeDate || payoffDate > estimatedDebtFreeDate)) {
      estimatedDebtFreeDate = payoffDate;
    }
  }

  return {
    totalDebt,
    totalOriginalDebt,
    activeDebts: activeDebts.length,
    paidOffDebts: paidOffDebts.length,
    totalPaid,
    totalInterestPaid,
    estimatedDebtFreeDate,
  };
}

/**
 * Desglosa un pago en capital e interés para una deuda dada.
 */
export function splitPayment(
  debt: Debt,
  paymentAmount: number
): { principal: number; interest: number } {
  if (debt.annualInterestRate === 0) {
    return { principal: Math.min(paymentAmount, debt.currentBalance), interest: 0 };
  }

  const interest = calculateMonthlyInterest(debt.currentBalance, debt.annualInterestRate);
  const principal = Math.max(0, Math.min(paymentAmount - interest, debt.currentBalance));

  return {
    principal,
    interest: paymentAmount - principal,
  };
}
