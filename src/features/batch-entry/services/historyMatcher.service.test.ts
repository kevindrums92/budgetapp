/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import {
  extractPatterns,
  buildHistorySummary,
  findBestMatch,
  formatPatternsForPrompt,
  postProcessWithHistory,
  type TransactionPattern,
} from "./historyMatcher.service";
import type { Transaction } from "@/types/budget.types";

// Helper to create mock transactions
function createTransaction(
  overrides: Partial<Transaction> & { name: string; category: string; date: string }
): Transaction {
  return {
    id: `tx-${Math.random().toString(36).substr(2, 9)}`,
    type: "expense",
    amount: 10000,
    notes: "",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("historyMatcher.service", () => {
  describe("extractPatterns", () => {
    it("should extract patterns from transactions with 2+ occurrences", () => {
      const transactions: Transaction[] = [
        createTransaction({ name: "café en chipre", category: "food_drink", amount: 7000, date: "2026-01-15" }),
        createTransaction({ name: "café en chipre", category: "food_drink", amount: 8000, date: "2026-01-20" }),
        createTransaction({ name: "uber", category: "transport", amount: 15000, date: "2026-01-18" }),
      ];

      const patterns = extractPatterns(transactions);

      // Only "café en chipre" has 2+ occurrences (normalized to "cafe chipre")
      expect(patterns.length).toBe(1);
      expect(patterns[0].name).toBe("cafe chipre"); // Normalized: no accents, "en" removed
      expect(patterns[0].category).toBe("food_drink");
      expect(patterns[0].avgAmount).toBe(7500); // (7000 + 8000) / 2
      expect(patterns[0].occurrences).toBe(2);
    });

    it("should normalize names (lowercase, trim, remove accents, remove stop words)", () => {
      const transactions: Transaction[] = [
        createTransaction({ name: "  Café en Chipre  ", category: "food_drink", amount: 7000, date: "2026-01-15" }),
        createTransaction({ name: "café en chipre", category: "food_drink", amount: 8000, date: "2026-01-20" }),
      ];

      const patterns = extractPatterns(transactions);

      expect(patterns.length).toBe(1);
      // Normalized: lowercase, no accents, "en" stop word removed
      expect(patterns[0].name).toBe("cafe chipre");
    });

    it("should normalize accents (café → cafe)", () => {
      const recentDate = new Date().toISOString().split("T")[0];
      const transactions: Transaction[] = [
        createTransaction({ name: "café", category: "food_drink", amount: 5000, date: recentDate }),
        createTransaction({ name: "cafe", category: "food_drink", amount: 6000, date: recentDate }),
      ];

      const patterns = extractPatterns(transactions);

      // Both should normalize to "cafe" and group together
      expect(patterns.length).toBe(1);
      expect(patterns[0].name).toBe("cafe");
      expect(patterns[0].occurrences).toBe(2);
    });

    it("should remove stop words (de, en, con, para)", () => {
      const recentDate = new Date().toISOString().split("T")[0];
      const transactions: Transaction[] = [
        createTransaction({ name: "almuerzo en oficina", category: "food_drink", amount: 20000, date: recentDate }),
        createTransaction({ name: "almuerzo de oficina", category: "food_drink", amount: 22000, date: recentDate }),
      ];

      const patterns = extractPatterns(transactions);

      // Both should normalize to "almuerzo oficina"
      expect(patterns.length).toBe(1);
      expect(patterns[0].name).toBe("almuerzo oficina");
    });

    it("should use most common category when there are multiple", () => {
      const transactions: Transaction[] = [
        createTransaction({ name: "almuerzo", category: "food_drink", amount: 20000, date: "2026-01-10" }),
        createTransaction({ name: "almuerzo", category: "food_drink", amount: 25000, date: "2026-01-15" }),
        createTransaction({ name: "almuerzo", category: "entertainment", amount: 30000, date: "2026-01-20" }),
      ];

      const patterns = extractPatterns(transactions);

      expect(patterns[0].category).toBe("food_drink"); // 2 out of 3
    });

    it("should exclude transactions with sourceTemplateId (auto-generated)", () => {
      const transactions: Transaction[] = [
        createTransaction({ name: "netflix", category: "subscriptions", amount: 50000, date: "2026-01-01" }),
        createTransaction({ name: "netflix", category: "subscriptions", amount: 50000, date: "2026-01-01", sourceTemplateId: "template-1" }),
      ];

      const patterns = extractPatterns(transactions);

      // Only 1 transaction without sourceTemplateId, so no pattern (needs 2+)
      expect(patterns.length).toBe(0);
    });

    it("should filter to recent transactions only (90 days)", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const transactions: Transaction[] = [
        createTransaction({ name: "viejo gasto", category: "misc", amount: 5000, date: oldDate.toISOString().split("T")[0] }),
        createTransaction({ name: "viejo gasto", category: "misc", amount: 5000, date: oldDate.toISOString().split("T")[0] }),
      ];

      const patterns = extractPatterns(transactions);

      expect(patterns.length).toBe(0); // Too old
    });

    it("should sort patterns by occurrences (most frequent first)", () => {
      const recentDate = new Date().toISOString().split("T")[0];
      const transactions: Transaction[] = [
        createTransaction({ name: "uber", category: "transport", amount: 10000, date: recentDate }),
        createTransaction({ name: "uber", category: "transport", amount: 12000, date: recentDate }),
        createTransaction({ name: "café", category: "food_drink", amount: 5000, date: recentDate }),
        createTransaction({ name: "café", category: "food_drink", amount: 6000, date: recentDate }),
        createTransaction({ name: "café", category: "food_drink", amount: 7000, date: recentDate }),
      ];

      const patterns = extractPatterns(transactions);

      expect(patterns[0].name).toBe("cafe"); // 3 occurrences (normalized, no accent)
      expect(patterns[1].name).toBe("uber"); // 2 occurrences
    });
  });

  describe("buildHistorySummary", () => {
    it("should return patterns and metadata", () => {
      const recentDate = new Date().toISOString().split("T")[0];
      const transactions: Transaction[] = [
        createTransaction({ name: "café", category: "food_drink", amount: 5000, date: recentDate }),
        createTransaction({ name: "café", category: "food_drink", amount: 6000, date: recentDate }),
      ];

      const summary = buildHistorySummary(transactions);

      expect(summary.patterns.length).toBe(1);
      expect(summary.totalTransactions).toBe(2);
      expect(summary.daysAnalyzed).toBe(90);
    });
  });

  describe("findBestMatch", () => {
    // Note: patterns are already normalized (accents removed, stop words removed)
    const patterns: TransactionPattern[] = [
      { name: "cafe chipre", category: "food_drink", avgAmount: 7000, occurrences: 5, type: "expense" },
      { name: "uber", category: "transport", avgAmount: 15000, occurrences: 10, type: "expense" },
      { name: "almuerzo", category: "food_drink", avgAmount: 20000, occurrences: 8, type: "expense" },
    ];

    it("should find exact matches", () => {
      const match = findBestMatch("cafe chipre", patterns);

      expect(match).not.toBeNull();
      expect(match?.name).toBe("cafe chipre");
    });

    it("should find matches with accents (café → cafe)", () => {
      const match = findBestMatch("café chipre", patterns);

      expect(match).not.toBeNull();
      expect(match?.name).toBe("cafe chipre");
    });

    it("should find matches with stop words removed (café en chipre → cafe chipre)", () => {
      const match = findBestMatch("café en chipre", patterns);

      expect(match).not.toBeNull();
      expect(match?.name).toBe("cafe chipre");
    });

    it("should find similar matches via Levenshtein distance", () => {
      // "cafe chipr" is similar to "cafe chipre" (missing one letter)
      const match = findBestMatch("cafe chipr", patterns);

      expect(match).not.toBeNull();
      expect(match?.name).toBe("cafe chipre");
    });

    it("should return null for no good match", () => {
      const match = findBestMatch("completamente diferente", patterns);

      expect(match).toBeNull();
    });

    it("should handle empty name", () => {
      const match = findBestMatch("", patterns);

      expect(match).toBeNull();
    });

    it("should handle empty patterns", () => {
      const match = findBestMatch("café", []);

      expect(match).toBeNull();
    });
  });

  describe("formatPatternsForPrompt", () => {
    it("should format patterns for AI prompt", () => {
      const patterns: TransactionPattern[] = [
        { name: "cafe", category: "food_drink", avgAmount: 7000, occurrences: 5, type: "expense" },
      ];

      const formatted = formatPatternsForPrompt(patterns);

      expect(formatted).toContain("cafe");
      expect(formatted).toContain("food_drink");
      expect(formatted).toContain("7000");
      expect(formatted).toContain("5x");
      expect(formatted).toContain("USER'S TRANSACTION HISTORY");
    });

    it("should return message for empty patterns", () => {
      const formatted = formatPatternsForPrompt([]);

      expect(formatted).toBe("No transaction history available.");
    });

    it("should limit to 30 patterns", () => {
      const patterns: TransactionPattern[] = Array.from({ length: 50 }, (_, i) => ({
        name: `pattern-${i}`,
        category: "misc",
        avgAmount: 1000,
        occurrences: 2,
        type: "expense" as const,
      }));

      const formatted = formatPatternsForPrompt(patterns);

      // Should only include 30
      const matches = formatted.match(/pattern-/g);
      expect(matches?.length).toBe(30);
    });
  });

  describe("postProcessWithHistory", () => {
    // Patterns are normalized (no accents, no stop words)
    const patterns: TransactionPattern[] = [
      { name: "cafe chipre", category: "food_drink", avgAmount: 7000, occurrences: 5, type: "expense" },
    ];

    it("should improve category for generic categories (medium match)", () => {
      const drafts = [
        {
          id: "1",
          name: "cafe en chipre", // Will normalize to "cafe chipre" - matches pattern
          category: "miscellaneous",
          amount: 7000,
          needsReview: false,
          confidence: 0.7,
        },
      ];

      const processed = postProcessWithHistory(drafts, patterns);

      expect(processed[0].category).toBe("food_drink");
      expect(processed[0].confidence).toBeGreaterThanOrEqual(0.85);
    });

    it("should override AI category for strong matches (cafe chipre → exact match)", () => {
      const drafts = [
        {
          id: "1",
          name: "café chipre", // Will normalize to "cafe chipre" - strong match
          category: "entertainment", // AI returned wrong specific category
          amount: 7000,
          needsReview: false,
          confidence: 0.8,
        },
      ];

      const processed = postProcessWithHistory(drafts, patterns);

      // Strong match should override AI's specific category
      expect(processed[0].category).toBe("food_drink");
      expect(processed[0].confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("should override AI category for strong matches with accents (café en chipre)", () => {
      const drafts = [
        {
          id: "1",
          name: "café en chipre", // Will normalize to "cafe chipre" - strong match
          category: "shopping", // AI returned wrong specific category
          amount: 8000,
          needsReview: false,
          confidence: 0.75,
        },
      ];

      const processed = postProcessWithHistory(drafts, patterns);

      // Strong match should override AI's specific category
      expect(processed[0].category).toBe("food_drink");
    });

    it("should fill missing amount from history", () => {
      const drafts = [
        {
          id: "1",
          name: "café en chipre",
          category: "food_drink",
          amount: 0,
          needsReview: false,
          confidence: 0.7,
        },
      ];

      const processed = postProcessWithHistory(drafts, patterns);

      expect(processed[0].amount).toBe(7000);
      expect(processed[0].needsReview).toBe(true); // Should flag for review
    });

    it("should not change specific categories for weak matches", () => {
      const drafts = [
        {
          id: "1",
          name: "cafe solo", // Will match "cafe chipre" but weaker match
          category: "entertainment", // Already specific
          amount: 7000,
          needsReview: false,
          confidence: 0.9,
        },
      ];

      const processed = postProcessWithHistory(drafts, patterns);

      // Weak match should not override specific categories
      expect(processed[0].category).toBe("entertainment");
    });

    it("should return unchanged drafts if no patterns", () => {
      const drafts = [
        {
          id: "1",
          name: "café",
          category: "miscellaneous",
          amount: 0,
          needsReview: false,
          confidence: 0.5,
        },
      ];

      const processed = postProcessWithHistory(drafts, []);

      expect(processed).toEqual(drafts);
    });
  });
});
