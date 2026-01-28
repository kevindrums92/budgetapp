import type { Budget, Transaction } from "@/types/budget.types";
import { isDateInPeriod, isPeriodExpired, getNextPeriod, doPeriodsOverlap } from "../utils/period.utils";
import { nanoid } from "nanoid";

/**
 * Resultado del cálculo de progreso de un presupuesto.
 */
export type BudgetProgress = {
  budgetId: string;
  categoryId: string;
  budgeted: number;       // Monto presupuestado
  spent: number;          // Monto gastado
  remaining: number;      // Monto restante (budgeted - spent)
  percentage: number;     // Porcentaje gastado (0-100+)
  isOverBudget: boolean;  // Si se excedió el presupuesto
  transactionCount: number; // Cantidad de transacciones en el período
};

/**
 * Calcula el progreso de un presupuesto basado en las transacciones.
 * Solo cuenta transacciones expense que coincidan con la categoría y estén dentro del período.
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): BudgetProgress {
  // Filtrar transacciones relevantes:
  // - Tipo expense (no income)
  // - Categoría coincide
  // - Fecha dentro del período del presupuesto
  const relevantTransactions = transactions.filter(
    (tx) =>
      tx.type === "expense" &&
      tx.category === budget.categoryId &&
      isDateInPeriod(tx.date, budget.period)
  );

  const spent = relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const remaining = budget.amount - spent;
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    budgeted: budget.amount,
    spent,
    remaining,
    percentage,
    isOverBudget: spent > budget.amount,
    transactionCount: relevantTransactions.length,
  };
}

/**
 * Obtiene todos los presupuestos activos que aplican en un período específico.
 * Un presupuesto aplica si su período se solapa con el período dado.
 */
export function getBudgetsForPeriod(
  budgets: Budget[],
  startDate: string,
  endDate: string
): Budget[] {
  const targetPeriod = { type: "custom" as const, startDate, endDate };

  return budgets.filter((budget) => {
    // Solo presupuestos activos
    if (budget.status !== "active") return false;

    // Verificar si el período del presupuesto se solapa con el período objetivo
    return doPeriodsOverlap(budget.period, targetPeriod);
  });
}

/**
 * Verifica si un presupuesto recurrente debe renovarse.
 * Un presupuesto debe renovarse si:
 * - Es recurrente
 * - Está activo
 * - Su período ya expiró
 */
export function shouldRenewBudget(budget: Budget, today: string): boolean {
  return (
    budget.isRecurring &&
    budget.status === "active" &&
    isPeriodExpired(budget.period, today)
  );
}

/**
 * Crea un nuevo presupuesto renovado a partir de uno existente.
 * El nuevo presupuesto:
 * - Tiene un nuevo ID
 * - Tiene el siguiente período (basado en el tipo)
 * - Mantiene el mismo monto, categoría, accountId, isRecurring
 * - Status = "active"
 * - createdAt = ahora
 */
export function renewRecurringBudget(budget: Budget): Budget {
  const nextPeriod = getNextPeriod(budget.period);

  return {
    id: nanoid(),
    categoryId: budget.categoryId,
    amount: budget.amount,
    type: budget.type,
    period: nextPeriod,
    accountId: budget.accountId,
    isRecurring: budget.isRecurring,
    status: "active",
    createdAt: Date.now(),
  };
}

/**
 * Valida que un nuevo presupuesto no se solape con presupuestos existentes
 * de la misma categoría.
 *
 * Regla: No puede haber dos presupuestos activos para la misma categoría
 * en períodos que se solapan.
 *
 * @returns true si hay overlap (inválido), false si no hay overlap (válido)
 */
export function validateBudgetOverlap(
  newBudget: Omit<Budget, "id" | "createdAt">,
  existingBudgets: Budget[],
  excludeBudgetId?: string // Para edición: excluir el presupuesto que se está editando
): boolean {
  // Filtrar presupuestos de la misma categoría y activos
  const sameCategoryBudgets = existingBudgets.filter(
    (b) =>
      b.categoryId === newBudget.categoryId &&
      b.status === "active" &&
      b.id !== excludeBudgetId // Excluir el presupuesto que se está editando
  );

  // Verificar si alguno se solapa con el nuevo presupuesto
  return sameCategoryBudgets.some((budget) =>
    doPeriodsOverlap(newBudget.period, budget.period)
  );
}

/**
 * Obtiene todos los presupuestos que necesitan renovarse hoy.
 * Útil para ejecutar al inicio de la app o en un scheduler.
 */
export function getBudgetsToRenew(budgets: Budget[], today: string): Budget[] {
  return budgets.filter((budget) => shouldRenewBudget(budget, today));
}

/**
 * Obtiene el presupuesto activo para una categoría en una fecha específica.
 * Si hay múltiples (no debería, pero por si acaso), devuelve el más reciente.
 */
export function getActiveBudgetForCategory(
  budgets: Budget[],
  categoryId: string,
  date: string
): Budget | null {
  const activeBudgets = budgets.filter(
    (b) =>
      b.categoryId === categoryId &&
      b.status === "active" &&
      isDateInPeriod(date, b.period)
  );

  if (activeBudgets.length === 0) return null;

  // Si hay múltiples, devolver el más reciente
  return activeBudgets.sort((a, b) => b.createdAt - a.createdAt)[0];
}

/**
 * Calcula el progreso de todos los presupuestos activos en un período.
 */
export function calculateAllBudgetsProgress(
  budgets: Budget[],
  transactions: Transaction[],
  startDate: string,
  endDate: string
): BudgetProgress[] {
  const relevantBudgets = getBudgetsForPeriod(budgets, startDate, endDate);

  return relevantBudgets.map((budget) =>
    calculateBudgetProgress(budget, transactions)
  );
}
