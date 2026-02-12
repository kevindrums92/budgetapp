import type { AmortizationRow } from "@/types/budget.types";

/**
 * Calcula la tasa mensual a partir de la tasa efectiva anual.
 */
export function getMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
}

/**
 * Calcula el interes mensual sobre un saldo dado.
 * @param balance - Saldo pendiente
 * @param annualRate - Tasa EA en porcentaje (ej: 28.5)
 * @returns Interes del mes
 */
export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  const monthlyRate = getMonthlyRate(annualRate);
  return Math.round(balance * monthlyRate);
}

/**
 * Detecta si un pago mensual es insuficiente para cubrir los intereses.
 * Si el pago es menor o igual al interes mensual, la deuda nunca se paga.
 */
export function isUnpayable(balance: number, annualRate: number, monthlyPayment: number): boolean {
  if (annualRate === 0) return false;
  const interest = calculateMonthlyInterest(balance, annualRate);
  return monthlyPayment <= interest;
}

/**
 * Proyecta la amortizacion de una deuda con interes compuesto (tarjetas de credito).
 * @param balance - Saldo actual
 * @param annualRate - Tasa EA (porcentaje)
 * @param monthlyPayment - Pago mensual fijo
 * @param maxMonths - Limite de meses para evitar loops infinitos (default: 360)
 * @returns Tabla de amortizacion
 */
export function projectCompoundPayoff(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  maxMonths: number = 360
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let remaining = balance;

  // Si tasa es 0, simplemente dividir
  if (annualRate === 0) {
    for (let month = 1; month <= maxMonths && remaining > 0; month++) {
      const payment = Math.min(monthlyPayment, remaining);
      remaining = Math.max(0, remaining - payment);
      rows.push({ month, payment, principal: payment, interest: 0, balance: remaining });
    }
    return rows;
  }

  // Si el pago no cubre intereses, retornar vacío (deuda impagable)
  if (isUnpayable(balance, annualRate, monthlyPayment)) {
    return rows;
  }

  for (let month = 1; month <= maxMonths && remaining > 0; month++) {
    const interest = calculateMonthlyInterest(remaining, annualRate);
    const payment = Math.min(monthlyPayment, remaining + interest);
    const principal = payment - interest;
    remaining = Math.max(0, remaining - principal);
    rows.push({ month, payment, principal, interest, balance: remaining });
  }

  return rows;
}

/**
 * Calcula las cuotas restantes dado un saldo actual, tasa EA y cuota fija.
 * Formula inversa: n = ln(C / (C - B × r)) / ln(1 + r)
 * @param balance - Saldo actual pendiente
 * @param annualRate - Tasa EA (porcentaje)
 * @param monthlyPayment - Cuota mensual fija
 * @returns Numero de cuotas restantes, o null si no se puede calcular
 */
export function calculateRemainingInstallments(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): number | null {
  if (balance <= 0 || monthlyPayment <= 0) return null;

  if (annualRate === 0) {
    return Math.ceil(balance / monthlyPayment);
  }

  const r = getMonthlyRate(annualRate);
  const monthlyInterest = balance * r;

  // Si la cuota no cubre los intereses, es impagable
  if (monthlyPayment <= monthlyInterest) return null;

  const n = Math.log(monthlyPayment / (monthlyPayment - balance * r)) / Math.log(1 + r);
  return Math.ceil(n);
}

/**
 * Calcula la cuota fija mensual de un prestamo con amortizacion francesa.
 * Formula: C = P * [r(1+r)^n] / [(1+r)^n - 1]
 * @param principal - Capital prestado
 * @param annualRate - Tasa EA (porcentaje)
 * @param totalMonths - Numero total de cuotas
 * @returns Cuota fija mensual
 */
export function calculateFixedPayment(
  principal: number,
  annualRate: number,
  totalMonths: number
): number {
  const r = getMonthlyRate(annualRate);
  if (r === 0) return Math.round(principal / totalMonths);
  const factor = Math.pow(1 + r, totalMonths);
  return Math.round(principal * (r * factor) / (factor - 1));
}

/**
 * Proyecta la tabla de amortizacion francesa completa.
 */
export function projectFrenchAmortization(
  principal: number,
  annualRate: number,
  totalMonths: number
): AmortizationRow[] {
  const fixedPayment = calculateFixedPayment(principal, annualRate, totalMonths);
  const r = getMonthlyRate(annualRate);
  const rows: AmortizationRow[] = [];
  let remaining = principal;

  for (let month = 1; month <= totalMonths && remaining > 0; month++) {
    const interest = Math.round(remaining * r);
    const princ = Math.min(fixedPayment - interest, remaining);
    remaining = Math.max(0, remaining - princ);
    rows.push({ month, payment: princ + interest, principal: princ, interest, balance: remaining });
  }

  return rows;
}
