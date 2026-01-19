import type { Transaction } from "@/types/budget.types";

const IGNORED_KEY_PREFIX = "recurring.ignored.";

/**
 * Detecta transacciones recurrentes del mes anterior que no han sido replicadas en el mes actual
 */
export function detectPendingRecurring(
  transactions: Transaction[],
  currentMonth: string // YYYY-MM
): Transaction[] {
  const [currentYear, currentMonthNum] = currentMonth.split("-").map(Number);

  // Calcular mes anterior
  const prevDate = new Date(currentYear, currentMonthNum - 1 - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  // Filtrar transacciones recurrentes del mes anterior
  const prevMonthRecurring = transactions.filter(
    (tx) => tx.isRecurring && tx.date.startsWith(prevMonth)
  );

  if (prevMonthRecurring.length === 0) {
    return [];
  }

  // Verificar cuáles ya existen en el mes actual
  const currentMonthTransactions = transactions.filter((tx) =>
    tx.date.startsWith(currentMonth)
  );

  // Filtrar las que NO tienen una copia en el mes actual
  // Una transacción se considera "replicada" si existe otra con el mismo nombre, categoría y tipo
  // (el monto puede variar, ya que el usuario puede ajustarlo al replicar)
  const pending = prevMonthRecurring.filter((prevTx) => {
    const exists = currentMonthTransactions.some(
      (currTx) =>
        currTx.name === prevTx.name &&
        currTx.category === prevTx.category &&
        currTx.type === prevTx.type
    );
    return !exists;
  });

  return pending;
}

/**
 * Verifica si el usuario ignoró el banner para este mes
 */
export function hasIgnoredThisMonth(month: string): boolean {
  try {
    const key = IGNORED_KEY_PREFIX + month;
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * Marca que el usuario ignoró el banner para este mes
 */
export function markIgnoredForMonth(month: string): void {
  try {
    const key = IGNORED_KEY_PREFIX + month;
    localStorage.setItem(key, "1");
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Replica una transacción al mes objetivo manteniendo el mismo día del mes
 * Si el día no existe en el mes objetivo (ej: 31 en febrero), usa el último día del mes
 * Los gastos se replican con status "pending", los ingresos con "paid"
 */
export function replicateTransaction(
  tx: Transaction,
  targetMonth: string // YYYY-MM
): Omit<Transaction, "id" | "createdAt"> {
  const [, , day] = tx.date.split("-").map(Number);
  const [targetYear, targetMonthNum] = targetMonth.split("-").map(Number);

  // Calcular días en el mes objetivo
  const daysInTargetMonth = new Date(targetYear, targetMonthNum, 0).getDate();
  const targetDay = Math.min(day, daysInTargetMonth);

  const targetDate = `${targetYear}-${String(targetMonthNum).padStart(2, "0")}-${String(
    targetDay
  ).padStart(2, "0")}`;

  return {
    type: tx.type,
    name: tx.name,
    category: tx.category,
    amount: tx.amount,
    date: targetDate,
    notes: tx.notes,
    isRecurring: true, // Mantener como recurrente
    status: tx.type === "expense" ? "pending" : undefined, // Gastos pendientes, ingresos pagados
  };
}

/**
 * Limpia flags de "ignorado" de meses anteriores (opcional, para cleanup)
 */
export function cleanupOldIgnoredFlags(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    keys.forEach((key) => {
      if (key.startsWith(IGNORED_KEY_PREFIX)) {
        const month = key.replace(IGNORED_KEY_PREFIX, "");
        // Si es de un mes anterior, eliminar
        if (month < currentMonth) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch {
    // Silently fail
  }
}
