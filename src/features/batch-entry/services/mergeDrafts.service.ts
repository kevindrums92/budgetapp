import type { TransactionDraft } from "../types/batch-entry.types";

/**
 * Merges selected transaction drafts into a single draft.
 * All selected drafts must have the same type (expense or income).
 * Returns the full drafts array with selected items replaced by the merged draft.
 */
export function mergeDrafts(
  selectedIds: string[],
  allDrafts: TransactionDraft[]
): TransactionDraft[] {
  if (selectedIds.length < 2) return allDrafts;

  const selectedSet = new Set(selectedIds);
  const selected = allDrafts.filter((d) => selectedSet.has(d.id));

  if (selected.length < 2) return allDrafts;

  // Validate same type
  const types = new Set(selected.map((d) => d.type));
  if (types.size > 1) return allDrafts;

  // Find position of first selected draft
  const firstIndex = allDrafts.findIndex((d) => selectedSet.has(d.id));

  // Build merged name: first 3 names + "..." if more
  const names = selected.map((d) => d.name).filter(Boolean);
  const mergedName =
    names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")}...`;

  // Most frequent category (mode)
  const categoryCounts = new Map<string, number>();
  for (const d of selected) {
    if (d.category) {
      categoryCounts.set(d.category, (categoryCounts.get(d.category) ?? 0) + 1);
    }
  }
  let mergedCategory = selected[0].category;
  let maxCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > maxCount) {
      maxCount = count;
      mergedCategory = cat;
    }
  }

  // Sum amounts
  const mergedAmount = selected.reduce((sum, d) => sum + d.amount, 0);

  // Earliest date
  const mergedDate = selected
    .map((d) => d.date)
    .filter(Boolean)
    .sort()[0] ?? selected[0].date;

  // Deduplicated notes
  const uniqueNotes = [
    ...new Set(selected.map((d) => d.notes).filter(Boolean)),
  ];
  const mergedNotes = uniqueNotes.join("\n") || undefined;

  // Min confidence
  const mergedConfidence = Math.min(...selected.map((d) => d.confidence));

  const mergedDraft: TransactionDraft = {
    id: crypto.randomUUID(),
    type: selected[0].type,
    name: mergedName,
    category: mergedCategory,
    amount: mergedAmount,
    date: mergedDate,
    notes: mergedNotes,
    needsReview: true,
    confidence: mergedConfidence,
  };

  // Build result: replace selected drafts with merged draft at first position
  const result: TransactionDraft[] = [];
  for (let i = 0; i < allDrafts.length; i++) {
    if (i === firstIndex) {
      result.push(mergedDraft);
    }
    if (!selectedSet.has(allDrafts[i].id)) {
      result.push(allDrafts[i]);
    }
  }

  return result;
}
