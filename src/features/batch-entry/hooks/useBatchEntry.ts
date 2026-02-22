/**
 * useBatchEntry Hook
 * Extracted from BatchEntrySheet - contains all AI batch entry business logic:
 * - Flow state machine
 * - Rate limiting & daily usage tracking
 * - Network status monitoring
 * - AI processing (text, image, audio)
 * - Category mapping
 * - Draft management
 * - Rewarded video & paywall gating
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getNetworkStatus, addNetworkListener } from "@/services/network.service";
import { useBudgetStore } from "@/state/budget.store";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import { useSubscription } from "@/hooks/useSubscription";
import { todayISO } from "@/services/dates.service";
import { showRewardedVideo, isRewardedVideoReady } from "@/services/ads.service";
import { isNative } from "@/shared/utils/platform";
import type { Category } from "@/types/budget.types";
import type { BatchInputType, TransactionDraft, HistoryPattern } from "../types/batch-entry.types";
import { parseText, parseImage, parseAudio } from "../services/batchEntry.service";
import {
  extractPatterns,
  postProcessWithHistory,
} from "../services/historyMatcher.service";

// --- Category mapping constants ---

const CATEGORY_FALLBACK_MAP: Record<string, string> = {
  health: "lifestyle",
  shopping: "lifestyle",
  entertainment: "lifestyle",
  personal_care: "lifestyle",
  education: "miscellaneous",
  travel: "miscellaneous",
  financial: "miscellaneous",
  family: "miscellaneous",
  pets: "miscellaneous",
  gifts: "miscellaneous",
  subscriptions: "home_utilities",
  secondary_income: "other_income",
  investment_income: "other_income",
  business_income: "primary_income",
  government: "other_income",
};

const CATEGORY_NAME_KEYWORDS: Record<string, string[]> = {
  financial: ["inversión", "inversiones", "finanzas", "financiero", "crypto", "bitcoin", "trading", "bolsa"],
  food_drink: ["comida", "alimentación", "restaurante", "café", "bebida"],
  transport: ["transporte", "uber", "taxi", "gasolina", "bus"],
  health: ["salud", "médico", "doctor", "farmacia", "gym"],
  shopping: ["compras", "ropa", "tienda"],
  entertainment: ["entretenimiento", "cine", "ocio", "diversión"],
  home_utilities: ["hogar", "servicios", "arriendo", "luz", "agua"],
  education: ["educación", "curso", "universidad", "colegio"],
  travel: ["viaje", "vacaciones", "hotel", "vuelo"],
  investment_income: ["inversión", "inversiones", "dividendos", "rendimiento"],
  business_income: ["negocio", "ventas", "freelance", "emprendimiento"],
};

/** Map AI category group ID to a real category from the store */
function mapAICategoryToStoreCategory(
  aiCategoryGroupId: string,
  categoryDefinitions: Category[],
  transactionType: "income" | "expense"
): string | null {
  const categoriesOfType = categoryDefinitions.filter((cat) => cat.type === transactionType);

  // 1. Exact group match
  const matchingCategory = categoriesOfType.find((cat) => cat.groupId === aiCategoryGroupId);
  if (matchingCategory) return matchingCategory.id;

  // 2. Keyword match in custom categories
  const keywords = CATEGORY_NAME_KEYWORDS[aiCategoryGroupId];
  if (keywords) {
    for (const keyword of keywords) {
      const matchByName = categoriesOfType.find(
        (cat) => cat.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matchByName) return matchByName.id;
    }
  }

  // 3. Fallback mapping
  const fallbackGroupId = CATEGORY_FALLBACK_MAP[aiCategoryGroupId];
  if (fallbackGroupId) {
    const fallbackCategory = categoriesOfType.find((cat) => cat.groupId === fallbackGroupId);
    if (fallbackCategory) return fallbackCategory.id;
  }

  // 4. Default "Otros" category
  const defaultFallbackGroupId = transactionType === "income" ? "other_income" : "miscellaneous";
  const otrosCategory = categoriesOfType.find((cat) => cat.groupId === defaultFallbackGroupId);
  if (otrosCategory) return otrosCategory.id;

  return null;
}

// --- Flow types ---

export type FlowState =
  | "idle"          // Welcome/ready state
  | "capturing"     // Recording voice, capturing image, or typing
  | "processing"    // AI is processing
  | "preview"       // Showing extracted transactions
  | "saving"        // Saving to store
  | "success"       // Saved successfully
  | "error";        // Error occurred

const BATCH_DAILY_KEY_PREFIX = "budget.batchDailyCount.";

function getBatchDailyCount(): number {
  const key = BATCH_DAILY_KEY_PREFIX + todayISO();
  return parseInt(localStorage.getItem(key) || "0", 10);
}

function incrementBatchDailyCount(): void {
  const key = BATCH_DAILY_KEY_PREFIX + todayISO();
  const current = getBatchDailyCount();
  localStorage.setItem(key, String(current + 1));
}

// --- Hook ---

export function useBatchEntry() {
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const transactions = useBudgetStore((s) => s.transactions);
  const { isPro } = useSubscription();

  // Rewarded video state
  const [showRewardedModal, setShowRewardedModal] = useState(false);
  const [isLoadingReward, setIsLoadingReward] = useState(false);
  const [rewardedWasConsumed, setRewardedWasConsumed] = useState(false);
  const pendingSubmitRef = useRef<(() => Promise<void>) | null>(null);

  // Network state
  const [isOnline, setIsOnline] = useState(true);

  // Flow state
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [inputType, setInputType] = useState<BatchInputType | null>(null);
  const [drafts, setDrafts] = useState<TransactionDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Paywall purchase handler
  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
  });

  // Extract patterns from user's transaction history
  const historyPatterns: HistoryPattern[] = useMemo(() => {
    const patterns = extractPatterns(transactions);
    console.log("[useBatchEntry] Extracted history patterns:", patterns.length);
    return patterns;
  }, [transactions]);

  // Process AI results: map categories and add notes
  const processAIResults = useCallback(
    (txDrafts: TransactionDraft[], interpretation: string): TransactionDraft[] => {
      return txDrafts.map((tx) => {
        const mappedCategoryId = mapAICategoryToStoreCategory(
          tx.category,
          categoryDefinitions,
          tx.type
        );
        return {
          ...tx,
          category: mappedCategoryId || "",
          notes: tx.notes || interpretation || "",
          needsReview: tx.needsReview || !mappedCategoryId,
        };
      });
    },
    [categoryDefinitions]
  );

  // Track network status
  useEffect(() => {
    getNetworkStatus().then(setIsOnline);
    const removeListener = addNetworkListener((online) => {
      setIsOnline(online);
    });
    return removeListener;
  }, []);

  // Show rewarded video modal when server-side rate limit is hit
  useEffect(() => {
    if (flowState === "error" && error === "RATE_LIMIT_FREE" && !showRewardedModal && !showPaywall) {
      if (rewardedWasConsumed) return;
      if (isNative() && isRewardedVideoReady()) {
        setShowRewardedModal(true);
      } else {
        setShowPaywall(true);
      }
    }
  }, [flowState, error, showRewardedModal, showPaywall, rewardedWasConsumed]);

  // Auto-execute pending submit when user upgrades to Pro mid-flow
  useEffect(() => {
    if (isPro && pendingSubmitRef.current) {
      const fn = pendingSubmitRef.current;
      pendingSubmitRef.current = null;
      fn();
    }
  }, [isPro]);

  // --- Rewarded video gatekeeper ---

  const checkAndProceed = useCallback(async (submitFn: () => Promise<void>) => {
    if (isPro) {
      await submitFn();
      return;
    }

    const dailyCount = getBatchDailyCount();
    if (dailyCount === 0) {
      // First request of the day: free
      await submitFn();
      return;
    }

    // 2nd+ request for free user: require rewarded video or Pro upgrade
    pendingSubmitRef.current = submitFn;

    if (isNative() && isRewardedVideoReady()) {
      setShowRewardedModal(true);
    } else {
      // No ad available (web or ad didn't load): show paywall
      setShowPaywall(true);
    }
  }, [isPro]);

  // --- Flow handlers ---

  const handleTextSubmit = async (text: string) => {
    await checkAndProceed(async () => {
      setFlowState("processing");
      try {
        const result = await parseText(text, historyPatterns);
        if (result.success && result.transactions.length > 0) {
          const interpretation = result.rawInterpretation || "";
          let processedDrafts = processAIResults(result.transactions, interpretation);
          processedDrafts = postProcessWithHistory(processedDrafts, historyPatterns);
          setDrafts(processedDrafts);
          setFlowState("preview");
          incrementBatchDailyCount();
        } else {
          setError(result.error || "No se encontraron transacciones");
          setFlowState("error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
        setFlowState("error");
      }
    });
  };

  const handleImageCapture = async (imageBase64: string) => {
    await checkAndProceed(async () => {
      setFlowState("processing");
      try {
        const result = await parseImage(imageBase64, historyPatterns);
        if (result.success && result.transactions.length > 0) {
          const interpretation = result.rawInterpretation || "";
          let processedDrafts = processAIResults(result.transactions, interpretation);
          processedDrafts = postProcessWithHistory(processedDrafts, historyPatterns);
          setDrafts(processedDrafts);
          setFlowState("preview");
          incrementBatchDailyCount();
        } else {
          setError(result.error || "No se encontraron transacciones");
          setFlowState("error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
        setFlowState("error");
      }
    });
  };

  const handleAudioCapture = async (audioBase64: string, mimeType: string) => {
    await checkAndProceed(async () => {
      setFlowState("processing");
      try {
        const result = await parseAudio(audioBase64, mimeType, historyPatterns);
        if (result.success && result.transactions.length > 0) {
          const interpretation = result.rawInterpretation || "";
          let processedDrafts = processAIResults(result.transactions, interpretation);
          processedDrafts = postProcessWithHistory(processedDrafts, historyPatterns);
          setDrafts(processedDrafts);
          setFlowState("preview");
          incrementBatchDailyCount();
        } else {
          setError(result.error || "No se encontraron transacciones");
          setFlowState("error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
        setFlowState("error");
      }
    });
  };

  const handleUpdateDraft = (id: string, updates: Partial<TransactionDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveAll = async () => {
    const hasInvalidDrafts = drafts.some((d) => !d.category || d.amount <= 0);
    if (hasInvalidDrafts || drafts.length === 0) return;

    setFlowState("saving");
    try {
      for (const draft of drafts) {
        addTransaction({
          type: draft.type || "expense",
          name: draft.name || "Transacción",
          category: draft.category,
          amount: draft.amount || 0,
          date: draft.date || new Date().toISOString().split("T")[0],
          notes: draft.notes || "",
          status: "paid",
        });
      }
      setFlowState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setFlowState("error");
    }
  };

  const handleWatchRewardedVideo = async () => {
    setIsLoadingReward(true);
    try {
      const reward = await showRewardedVideo();
      if (reward) {
        setRewardedWasConsumed(true);
        setShowRewardedModal(false);
        if (pendingSubmitRef.current) {
          await pendingSubmitRef.current();
          pendingSubmitRef.current = null;
        }
      } else {
        console.log("[useBatchEntry] Rewarded video cancelled");
      }
    } catch (err) {
      setRewardedWasConsumed(true);
      console.warn("[useBatchEntry] Rewarded video unavailable, granting free use:", err);
      setShowRewardedModal(false);
      if (pendingSubmitRef.current) {
        await pendingSubmitRef.current();
        pendingSubmitRef.current = null;
      }
    } finally {
      setIsLoadingReward(false);
    }
  };

  const handleRetry = () => {
    setDrafts([]);
    setError(null);
    setFlowState("idle");
    setInputType(null);
  };

  const reset = () => {
    setFlowState("idle");
    setInputType(null);
    setDrafts([]);
    setError(null);
    setShowRewardedModal(false);
    setRewardedWasConsumed(false);
    pendingSubmitRef.current = null;
  };

  return {
    // State
    flowState,
    setFlowState,
    inputType,
    setInputType,
    drafts,
    error,
    isOnline,
    showPaywall,
    setShowPaywall,
    showRewardedModal,
    setShowRewardedModal,
    isLoadingReward,
    rewardedWasConsumed,
    isPro,

    // Handlers
    handleTextSubmit,
    handleImageCapture,
    handleAudioCapture,
    handleUpdateDraft,
    handleDeleteDraft,
    handleSaveAll,
    handleWatchRewardedVideo,
    handleRetry,
    handleSelectPlan,
    reset,
  };
}
