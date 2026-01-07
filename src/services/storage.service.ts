import type { BudgetState } from "@/types/budget.types";

const STORAGE_KEY = "budget_app_v1";

export function loadState(): BudgetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as BudgetState;

    // Validación mínima
    if (parsed.schemaVersion !== 1) return null;
    if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories)) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: BudgetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // opcional: manejar quota exceeded con UI luego
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

