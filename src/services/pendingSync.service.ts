import type { BudgetState } from "@/types/budget.types";

const KEY = "budget.pendingSnapshot.v1";

export function setPendingSnapshot(state: BudgetState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function getPendingSnapshot(): BudgetState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BudgetState;
  } catch {
    return null;
  }
}

export function clearPendingSnapshot() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function hasPendingSnapshot(): boolean {
  return !!getPendingSnapshot();
}
