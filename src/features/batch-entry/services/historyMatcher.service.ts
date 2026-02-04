/**
 * History Matcher Service
 * Analyzes user's transaction history to improve AI category matching and fill missing data
 */

import type { Transaction } from "@/types/budget.types";

/** Minimum similarity score to consider a match (0-1) */
const MIN_SIMILARITY_THRESHOLD = 0.6;

/** Minimum occurrences to trust a pattern */
const MIN_PATTERN_OCCURRENCES = 2;

/** Maximum number of patterns to send to AI (to avoid huge payloads) */
const MAX_PATTERNS_FOR_AI = 50;

/** Days to look back for recent transactions */
const HISTORY_DAYS = 90;

/**
 * A pattern extracted from transaction history
 * Represents a common transaction name with its typical category and amount
 */
export type TransactionPattern = {
  /** Normalized transaction name (lowercase, trimmed) */
  name: string;
  /** Most common category ID for this name */
  category: string;
  /** Average amount for this transaction */
  avgAmount: number;
  /** Number of times this pattern was seen */
  occurrences: number;
  /** Most recent transaction type (income/expense) */
  type: "income" | "expense";
};

/**
 * Summary of user's transaction history for AI context
 */
export type HistorySummary = {
  /** Transaction patterns for similar name matching */
  patterns: TransactionPattern[];
  /** Total transactions analyzed */
  totalTransactions: number;
  /** Days of history analyzed */
  daysAnalyzed: number;
};

/**
 * Remove accents/diacritics from a string
 * Uses Unicode normalization: "café" → "cafe"
 */
function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Common stop words in Spanish, English, Portuguese, French
 * These words don't help with matching transaction names
 */
const STOP_WORDS = new Set([
  // Spanish articles and prepositions
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "de", "del", "en", "con", "por", "para", "a", "al",
  // English
  "the", "a", "an", "of", "in", "at", "to", "for", "with",
  // Portuguese
  "o", "os", "as", "do", "da", "dos", "das", "no", "na", "nos", "nas", "em", "com",
  // French
  "le", "les", "du", "des", "au", "aux", "dans", "avec", "pour",
]);

/**
 * Normalize a transaction name for comparison
 * - Lowercase
 * - Remove accents (café → cafe)
 * - Remove extra whitespace
 * - Remove common articles and prepositions
 */
function normalizeName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove accents
  normalized = removeAccents(normalized);

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, " ");

  // Remove stop words (only when surrounded by word boundaries or at start/end)
  const words = normalized.split(" ");
  const filteredWords = words.filter(word => !STOP_WORDS.has(word));

  // If all words were stop words, keep the original
  if (filteredWords.length === 0) {
    return normalized;
  }

  return filteredWords.join(" ").trim();
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a score from 0 (completely different) to 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other (common case: "café" vs "café chipre")
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer * 0.9; // Partial match bonus
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

/**
 * Extract transaction patterns from user's history
 */
export function extractPatterns(transactions: Transaction[]): TransactionPattern[] {
  // Filter to recent transactions only
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - HISTORY_DAYS);
  const cutoffISO = cutoffDate.toISOString().split("T")[0];

  const recentTransactions = transactions.filter(
    (tx) => tx.date >= cutoffISO && !tx.sourceTemplateId // Exclude auto-generated from templates
  );

  // Group by normalized name
  const groups = new Map<string, Transaction[]>();

  for (const tx of recentTransactions) {
    const normalized = normalizeName(tx.name);
    if (!normalized) continue;

    const existing = groups.get(normalized) || [];
    existing.push(tx);
    groups.set(normalized, existing);
  }

  // Convert groups to patterns
  const patterns: TransactionPattern[] = [];

  for (const [name, txs] of groups) {
    if (txs.length < MIN_PATTERN_OCCURRENCES) continue;

    // Find most common category
    const categoryCounts = new Map<string, number>();
    for (const tx of txs) {
      categoryCounts.set(tx.category, (categoryCounts.get(tx.category) || 0) + 1);
    }
    let topCategory = "";
    let topCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > topCount) {
        topCategory = cat;
        topCount = count;
      }
    }

    // Calculate average amount
    const totalAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const avgAmount = Math.round(totalAmount / txs.length);

    // Get most recent type
    const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
    const type = sorted[0].type;

    patterns.push({
      name,
      category: topCategory,
      avgAmount,
      occurrences: txs.length,
      type,
    });
  }

  // Sort by occurrences (most frequent first) and limit
  return patterns
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, MAX_PATTERNS_FOR_AI);
}

/**
 * Build a history summary for the AI prompt
 */
export function buildHistorySummary(transactions: Transaction[]): HistorySummary {
  const patterns = extractPatterns(transactions);

  return {
    patterns,
    totalTransactions: transactions.length,
    daysAnalyzed: HISTORY_DAYS,
  };
}

/** Threshold for a "strong" match where we trust history over AI */
const STRONG_MATCH_THRESHOLD = 0.75;

/**
 * Result of a pattern match with similarity score
 */
type MatchResult = {
  pattern: TransactionPattern;
  score: number;
} | null;

/**
 * Find the best matching pattern for a given transaction name
 * Returns null if no good match is found, or the pattern with similarity score
 */
export function findBestMatch(
  name: string,
  patterns: TransactionPattern[]
): TransactionPattern | null {
  const result = findBestMatchWithScore(name, patterns);
  return result?.pattern ?? null;
}

/**
 * Find the best matching pattern with similarity score
 * Used internally for more granular matching decisions
 */
function findBestMatchWithScore(
  name: string,
  patterns: TransactionPattern[]
): MatchResult {
  if (!name || patterns.length === 0) return null;

  let bestMatch: TransactionPattern | null = null;
  let bestScore = 0;

  for (const pattern of patterns) {
    const score = calculateSimilarity(name, pattern.name);
    if (score > bestScore && score >= MIN_SIMILARITY_THRESHOLD) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  if (!bestMatch) return null;

  return { pattern: bestMatch, score: bestScore };
}

/**
 * Format patterns for inclusion in AI prompt
 */
export function formatPatternsForPrompt(patterns: TransactionPattern[]): string {
  if (patterns.length === 0) {
    return "No transaction history available.";
  }

  const lines = patterns
    .slice(0, 30) // Limit to top 30 for prompt size
    .map((p) => `- "${p.name}" → category: ${p.category}, avg: ${p.avgAmount}, type: ${p.type} (${p.occurrences}x)`);

  return `USER'S TRANSACTION HISTORY (use this to improve category matching):
${lines.join("\n")}

IMPORTANT: If the user's input closely matches any of these patterns, use the same category and consider the average amount if amount is unclear.`;
}

/**
 * Post-process AI results using history patterns
 * Improves category matching and fills missing amounts
 *
 * Strategy:
 * - Strong match (≥0.75): Trust history over AI - always apply category and fill missing amounts
 * - Medium match (≥0.60): Only fix generic categories, fill missing amounts
 */
export function postProcessWithHistory<T extends {
  name: string;
  category: string;
  amount: number;
  needsReview: boolean;
  confidence: number;
}>(
  drafts: T[],
  patterns: TransactionPattern[]
): T[] {
  if (patterns.length === 0) return drafts;

  return drafts.map((draft) => {
    const matchResult = findBestMatchWithScore(draft.name, patterns);
    if (!matchResult) return draft;

    const { pattern: match, score } = matchResult;
    const updates: Partial<T> = {};
    const isStrongMatch = score >= STRONG_MATCH_THRESHOLD;

    // For strong matches, trust history over AI categorization
    // For weaker matches, only fix generic categories
    const genericCategories = ["miscellaneous", "other_income"];
    const shouldUpdateCategory = isStrongMatch
      ? match.category !== draft.category // Always use history for strong matches
      : genericCategories.includes(draft.category) && !genericCategories.includes(match.category);

    if (shouldUpdateCategory) {
      updates.category = match.category as T["category"];
      updates.confidence = Math.max(draft.confidence, isStrongMatch ? 0.9 : 0.85) as T["confidence"];
    }

    // If amount is 0 or missing, use historical average
    if (draft.amount === 0 && match.avgAmount > 0) {
      updates.amount = match.avgAmount as T["amount"];
      updates.needsReview = true as T["needsReview"]; // Still flag for review since we inferred it
    }

    return { ...draft, ...updates };
  });
}
