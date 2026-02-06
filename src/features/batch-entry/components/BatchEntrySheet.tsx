/**
 * Batch Entry Sheet
 * Main bottom sheet that orchestrates the AI batch entry flow
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, WifiOff, X, Check } from "lucide-react";
import { getNetworkStatus, addNetworkListener } from "@/services/network.service";
import { useBudgetStore } from "@/state/budget.store";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import PaywallModal from "@/shared/components/modals/PaywallModal";
import type { Category } from "@/types/budget.types";
import type { BatchInputType, TransactionDraft } from "../types/batch-entry.types";

/**
 * Fallback mappings for AI category IDs to existing app category groups.
 * Maps newer/extended category IDs to the standard groups that exist in the app.
 */
const CATEGORY_FALLBACK_MAP: Record<string, string> = {
  // Expense category fallbacks
  health: "lifestyle",           // Health → Lifestyle
  shopping: "lifestyle",         // Shopping → Lifestyle
  entertainment: "lifestyle",    // Entertainment → Lifestyle
  personal_care: "lifestyle",    // Personal Care → Lifestyle
  education: "miscellaneous",    // Education → Miscellaneous
  travel: "miscellaneous",       // Travel → Miscellaneous
  financial: "miscellaneous",    // Financial → Miscellaneous
  family: "miscellaneous",       // Family → Miscellaneous
  pets: "miscellaneous",         // Pets → Miscellaneous
  gifts: "miscellaneous",        // Gifts → Miscellaneous
  subscriptions: "home_utilities", // Subscriptions → Home & Utilities
  // Income category fallbacks
  secondary_income: "other_income",   // Secondary Income → Other Income
  investment_income: "other_income",  // Investment Income → Other Income
  business_income: "primary_income",  // Business Income → Primary Income
  government: "other_income",         // Government → Other Income
};

/**
 * Keywords to search in category names for smart matching.
 * Maps AI category IDs to keywords that might appear in user's custom category names.
 */
const CATEGORY_NAME_KEYWORDS: Record<string, string[]> = {
  // Expense categories
  financial: ["inversión", "inversiones", "finanzas", "financiero", "crypto", "bitcoin", "trading", "bolsa"],
  food_drink: ["comida", "alimentación", "restaurante", "café", "bebida"],
  transport: ["transporte", "uber", "taxi", "gasolina", "bus"],
  health: ["salud", "médico", "doctor", "farmacia", "gym"],
  shopping: ["compras", "ropa", "tienda"],
  entertainment: ["entretenimiento", "cine", "ocio", "diversión"],
  home_utilities: ["hogar", "servicios", "arriendo", "luz", "agua"],
  education: ["educación", "curso", "universidad", "colegio"],
  travel: ["viaje", "vacaciones", "hotel", "vuelo"],
  // Income categories
  investment_income: ["inversión", "inversiones", "dividendos", "rendimiento"],
  business_income: ["negocio", "ventas", "freelance", "emprendimiento"],
};

/** Map AI category group ID to a real category from the store */
function mapAICategoryToStoreCategory(
  aiCategoryGroupId: string,
  categoryDefinitions: Category[],
  transactionType: "income" | "expense"
): string | null {
  // Filter categories by type first
  const categoriesOfType = categoryDefinitions.filter((cat) => cat.type === transactionType);

  // 1. Try to find a category that belongs to this exact group
  const matchingCategory = categoriesOfType.find(
    (cat) => cat.groupId === aiCategoryGroupId
  );
  if (matchingCategory) {
    return matchingCategory.id;
  }

  // 2. Try to find a category by name keywords (for custom categories)
  const keywords = CATEGORY_NAME_KEYWORDS[aiCategoryGroupId];
  if (keywords) {
    for (const keyword of keywords) {
      const matchByName = categoriesOfType.find(
        (cat) => cat.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matchByName) {
        return matchByName.id;
      }
    }
  }

  // 3. Try fallback mapping for extended category IDs
  const fallbackGroupId = CATEGORY_FALLBACK_MAP[aiCategoryGroupId];
  if (fallbackGroupId) {
    const fallbackCategory = categoriesOfType.find(
      (cat) => cat.groupId === fallbackGroupId
    );
    if (fallbackCategory) {
      return fallbackCategory.id;
    }
  }

  // 4. Try to find "Otros" category for the transaction type
  const defaultFallbackGroupId = transactionType === "income" ? "other_income" : "miscellaneous";
  const otrosCategory = categoriesOfType.find(
    (cat) => cat.groupId === defaultFallbackGroupId
  );
  if (otrosCategory) {
    return otrosCategory.id;
  }

  // 5. No category found - user must select manually
  return null;
}

import { parseText, parseImage, parseAudio, isAuthenticated } from "../services/batchEntry.service";
import {
  extractPatterns,
  postProcessWithHistory,
} from "../services/historyMatcher.service";
import type { HistoryPattern } from "../types/batch-entry.types";
import InputTypeSelector from "./InputTypeSelector";
import VoiceRecorder from "./VoiceRecorder";
import ImageCaptureView from "./ImageCaptureView";
import TextInputArea from "./TextInputArea";
import TransactionPreview from "./TransactionPreview";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Optional: Skip type selection and go directly to capturing */
  initialInputType?: BatchInputType | null;
};

type FlowState =
  | "select-type"    // Choosing input type
  | "capturing"      // Recording voice, capturing image, or typing
  | "processing"     // AI is processing
  | "preview"        // Showing extracted transactions
  | "saving"         // Saving to store
  | "success"        // Saved successfully
  | "error";         // Error occurred

const SHEET_HEIGHT = 500;
const DRAG_THRESHOLD = 0.3;

export default function BatchEntrySheet({ open, onClose, initialInputType }: Props) {
  const { t } = useTranslation("batch");
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const transactions = useBudgetStore((s) => s.transactions);

  // Extract patterns from user's transaction history for better AI matching
  const historyPatterns: HistoryPattern[] = useMemo(() => {
    const patterns = extractPatterns(transactions);
    console.log("[BatchEntrySheet] Extracted history patterns:", patterns.length);
    return patterns;
  }, [transactions]);

  // Sheet animation state
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Network state
  const [isOnline, setIsOnline] = useState(true);

  // Flow state
  const [flowState, setFlowState] = useState<FlowState>("select-type");
  const [inputType, setInputType] = useState<BatchInputType | null>(null);
  const [drafts, setDrafts] = useState<TransactionDraft[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_confidence, setConfidence] = useState(0);
  // Store rawInterpretation for potential display (prefixed to suppress unused warning)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_rawInterpretation, setRawInterpretation] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Paywall purchase handler
  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
  });

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  /**
   * Process AI results: map categories and add notes from rawInterpretation
   */
  const processAIResults = useCallback(
    (
      transactions: TransactionDraft[],
      interpretation: string
    ): TransactionDraft[] => {
      return transactions.map((tx) => {
        // Map AI category group to real category ID
        const mappedCategoryId = mapAICategoryToStoreCategory(
          tx.category,
          categoryDefinitions,
          tx.type
        );

        return {
          ...tx,
          // Use mapped category or empty string (needs manual selection)
          category: mappedCategoryId || "",
          // Use rawInterpretation as notes if no notes provided
          notes: tx.notes || interpretation || "",
          // Mark for review if no category match found
          needsReview: tx.needsReview || !mappedCategoryId,
        };
      });
    },
    [categoryDefinitions]
  );

  // Check authentication on mount
  useEffect(() => {
    if (open) {
      isAuthenticated().then(setIsAuthed);
    }
  }, [open]);

  // Track network status
  useEffect(() => {
    // Get initial status
    getNetworkStatus().then(setIsOnline);

    // Listen for changes
    const removeListener = addNetworkListener((online) => {
      setIsOnline(online);
    });

    return removeListener;
  }, []);

  // Handle initialInputType - skip to capturing if provided
  useEffect(() => {
    if (open && initialInputType) {
      setInputType(initialInputType);
      setFlowState("capturing");
    }
  }, [open, initialInputType]);

  // Handle open/close animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setDragOffset(0);
        // Reset state on close
        setFlowState("select-type");
        setInputType(null);
        setDrafts([]);
        setConfidence(0);
        setRawInterpretation("");
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Drag handlers
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
  }, []);

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;
      const diff = clientY - startYRef.current;
      if (diff > 0) {
        setDragOffset(Math.min(diff, SHEET_HEIGHT));
      } else {
        setDragOffset(0);
      }
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > SHEET_HEIGHT * DRAG_THRESHOLD) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart]
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove]
  );
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // Mouse events for handle only
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleDragStart(e.clientY),
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // --- Flow handlers ---

  const handleSelectInputType = (type: BatchInputType) => {
    setInputType(type);
    setFlowState("capturing");
    setError(null);
  };

  const handleTextSubmit = async (text: string) => {
    setFlowState("processing");
    try {
      const result = await parseText(text, historyPatterns);
      if (result.success && result.transactions.length > 0) {
        const interpretation = result.rawInterpretation || "";
        setRawInterpretation(interpretation);
        // Process AI results and apply history-based improvements
        let processedDrafts = processAIResults(result.transactions, interpretation);
        processedDrafts = postProcessWithHistory(processedDrafts, historyPatterns);
        setDrafts(processedDrafts);
        setConfidence(result.confidence);
        setFlowState("preview");
      } else {
        setError(result.error || "No se encontraron transacciones");
        setFlowState("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setFlowState("error");
    }
  };

  const handleImageCapture = async (imageBase64: string) => {
    setFlowState("processing");
    try {
      const result = await parseImage(imageBase64, historyPatterns);
      if (result.success && result.transactions.length > 0) {
        const interpretation = result.rawInterpretation || "";
        setRawInterpretation(interpretation);
        // Process AI results and apply history-based improvements
        let processedDrafts = processAIResults(result.transactions, interpretation);
        processedDrafts = postProcessWithHistory(processedDrafts, historyPatterns);
        setDrafts(processedDrafts);
        setConfidence(result.confidence);
        setFlowState("preview");
      } else {
        setError(result.error || "No se encontraron transacciones");
        setFlowState("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setFlowState("error");
    }
  };

  const handleAudioCapture = async (audioBase64: string) => {
    setFlowState("processing");
    try {
      const result = await parseAudio(audioBase64, historyPatterns);
      if (result.success && result.transactions.length > 0) {
        const interpretation = result.rawInterpretation || "";
        setRawInterpretation(interpretation);
        // Process AI results and apply history-based improvements
        let processedDrafts = processAIResults(result.transactions, interpretation);
        processedDrafts = postProcessWithHistory(processedDrafts, historyPatterns);
        setDrafts(processedDrafts);
        setConfidence(result.confidence);
        setFlowState("preview");
      } else {
        setError(result.error || "No se encontraron transacciones");
        setFlowState("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setFlowState("error");
    }
  };

  const handleCancel = () => {
    // If launched with initialInputType, close the sheet entirely
    // Otherwise, go back to type selection
    if (initialInputType) {
      onClose();
    } else {
      setFlowState("select-type");
      setInputType(null);
      setError(null);
    }
  };

  const handleRetry = () => {
    // If launched with initialInputType, close the sheet on retry
    // Otherwise, go back to type selection
    if (initialInputType) {
      onClose();
    } else {
      setDrafts([]);
      setConfidence(0);
      setRawInterpretation("");
      setError(null);
      setFlowState("select-type");
      setInputType(null);
    }
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
    // Validation is done in TransactionPreview (save button is disabled if invalid)
    // This is a safety check in case it's called programmatically
    const hasInvalidDrafts = drafts.some((d) => !d.category || d.amount <= 0);
    if (hasInvalidDrafts || drafts.length === 0) {
      return;
    }

    setFlowState("saving");
    try {
      // Save each transaction to the store
      for (const draft of drafts) {
        addTransaction({
          type: draft.type || "expense",
          name: draft.name || "Transacción",
          category: draft.category, // Already validated above
          amount: draft.amount || 0,
          date: draft.date || new Date().toISOString().split("T")[0],
          notes: draft.notes || "",
          status: "paid",
        });
      }
      setFlowState("success");
      // Close after brief success indication
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setFlowState("error");
    }
  };

  // --- Render ---

  if (!isVisible) return null;

  // Always go fullscreen when previewing transactions
  const isFullScreen = flowState === "preview" || flowState === "saving";

  const sheetTranslate = isAnimating ? dragOffset : SHEET_HEIGHT;
  const backdropOpacity = isAnimating
    ? Math.max(0, 1 - dragOffset / SHEET_HEIGHT) * 0.4
    : 0;

  // Get title based on state
  const getTitle = () => {
    switch (flowState) {
      case "select-type":
        return t("title");
      case "capturing":
        if (inputType === "audio") return t("inputTypes.voice.title");
        if (inputType === "image") return t("inputTypes.image.title");
        return t("inputTypes.text.title");
      case "processing":
        return t("common.processing");
      case "preview":
        return t("review.title");
      case "saving":
        return t("common.processing");
      case "success":
        return t("review.saveAll");
      case "error":
        return t("common.error");
      default:
        return t("title");
    }
  };

  // Render content based on state
  const renderContent = () => {
    // Check offline
    if (!isOnline) {
      return (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <WifiOff className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-base font-medium text-gray-900 dark:text-gray-50">
            {t("errors.noConnection", { defaultValue: "Sin conexión" })}
          </p>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("errors.needsConnection", { defaultValue: "Necesitas conexión a internet para usar el ingreso con IA" })}
          </p>
        </div>
      );
    }

    // Check auth
    if (isAuthed === false) {
      return (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Sparkles className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-base font-medium text-gray-900 dark:text-gray-50">
            {t("errors.loginRequiredTitle", { defaultValue: "Inicia sesión" })}
          </p>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("errors.loginRequired")}
          </p>
        </div>
      );
    }

    // Error state
    if (flowState === "error") {
      // Free user rate limit - modal is rendered separately below
      if (error === "RATE_LIMIT_FREE") {
        return null;
      }

      // Translate error codes to user-friendly messages
      const getErrorMessage = () => {
        if (!error) return t("errors.generic");
        if (error === "RATE_LIMIT_PRO") return t("errors.rateLimitPro");
        if (error === "TIMEOUT") return t("errors.timeout");
        if (error === "NO_RESPONSE") return t("errors.noResponse");
        return error;
      };

      return (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              {getErrorMessage()}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl bg-gray-100 dark:bg-gray-800 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("common.retry")}
          </button>
        </div>
      );
    }

    // Success state
    if (flowState === "success") {
      return (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <Sparkles className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-medium text-gray-900 dark:text-gray-50">
            {t("success.title", { defaultValue: "Transacciones guardadas" })}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("review.transactionsFound", { count: drafts.length })}
          </p>
        </div>
      );
    }

    // Select type
    if (flowState === "select-type") {
      return <InputTypeSelector onSelect={handleSelectInputType} />;
    }

    // Capturing states
    if (flowState === "capturing" || flowState === "processing") {
      const isProcessing = flowState === "processing";

      if (inputType === "audio") {
        return (
          <VoiceRecorder
            onRecordingComplete={handleAudioCapture}
            onCancel={handleCancel}
            isProcessing={isProcessing}
          />
        );
      }

      if (inputType === "image") {
        return (
          <ImageCaptureView
            onImageCaptured={handleImageCapture}
            onCancel={handleCancel}
            isProcessing={isProcessing}
          />
        );
      }

      if (inputType === "text") {
        return (
          <TextInputArea
            onSubmit={handleTextSubmit}
            onCancel={handleCancel}
            isProcessing={isProcessing}
          />
        );
      }
    }

    // Preview state
    if (flowState === "preview" || flowState === "saving") {
      return (
        <TransactionPreview
          drafts={drafts}
          onUpdateDraft={handleUpdateDraft}
          onDeleteDraft={handleDeleteDraft}
          onSaveAll={handleSaveAll}
          onCancel={handleRetry}
          isSaving={flowState === "saving"}
          isFullScreen={isFullScreen}
        />
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label={t("common.cancel")}
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? "none" : "opacity 300ms ease-out",
        }}
      />

      {/* Sheet - hidden when rate limit modal is showing */}
      <div
        ref={sheetRef}
        className={`absolute shadow-2xl ${
          isFullScreen
            ? "inset-0 flex flex-col bg-gray-100 dark:bg-gray-950"
            : "inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900"
        } ${flowState === "error" && error === "RATE_LIMIT_FREE" ? "!hidden" : ""}`}
        style={{
          transform: isFullScreen
            ? `translateY(${isAnimating ? 0 : window.innerHeight}px)`
            : `translateY(${sheetTranslate}px)`,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
          maxHeight: isFullScreen ? undefined : "85vh",
          paddingTop: isFullScreen ? "env(safe-area-inset-top)" : undefined,
        }}
      >
        {/* Drag handle for bottom sheet mode only */}
        {!isFullScreen && (
          <div
            className="flex shrink-0 justify-center py-3 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
        )}

        {/* Content */}
        <div
          className={`px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] ${
            isFullScreen ? "flex flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-gray-950" : "bg-white dark:bg-gray-900"
          }`}
        >
          {/* Title - hidden in fullscreen preview mode (title is in the card) */}
          {!isFullScreen && (
            <div className="mb-4 flex shrink-0 items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
                {getTitle()}
              </h3>
            </div>
          )}

          {/* Dynamic content */}
          <div className={isFullScreen ? "flex flex-1 flex-col overflow-hidden" : ""}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Rate limit upsell modal for free users */}
      {flowState === "error" && error === "RATE_LIMIT_FREE" && !showPaywall && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          <div className="relative mx-6 w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-gray-800 to-gray-900 p-6 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all active:scale-95"
            >
              <X size={16} className="text-gray-400" />
            </button>

            {/* Icon */}
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18B7B0] to-violet-500 shadow-lg shadow-[#18B7B0]/20">
                <Sparkles size={32} className="text-white" strokeWidth={1.8} />
              </div>
            </div>

            {/* Title */}
            <h3 className="mb-2 text-center text-xl font-extrabold tracking-tight text-white">
              Sin Límites
            </h3>

            {/* Subtitle */}
            <p className="mb-6 text-center text-sm leading-relaxed text-gray-400">
              No dejes que nada te detenga. Desbloquea registros con IA ilimitados y obtén el control total.
            </p>

            {/* Benefits */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18B7B0]/20">
                  <Check size={14} className="text-[#18B7B0]" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-200">
                  Registros con IA ilimitados
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18B7B0]/20">
                  <Check size={14} className="text-[#18B7B0]" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-200">
                  Escaneo de recibos inteligente
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setShowPaywall(true)}
              className="w-full rounded-2xl bg-white py-4 text-base font-bold text-gray-900 shadow-lg transition-all active:scale-[0.98]"
            >
              Prueba Gratis por 7 Días
            </button>
          </div>
        </div>
      )}

      {/* Paywall modal for free users */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="batch_entry_limit"
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
