import { useState, useCallback } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { useTranslation } from "react-i18next";
import { buildFinancialSnapshot } from "../services/snapshot.service";
import { sendAssistantMessage } from "../services/assistant.service";
import type { Message } from "../types/assistant.types";

type UseAssistantReturn = {
  messages: Message[];
  isLoading: boolean;
  remainingMessages: number | null;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearError: () => void;
};

export function useAssistant(): UseAssistantReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMessages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { t, i18n } = useTranslation("assistant");
  const { currency } = useCurrency();

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const budgets = useBudgetStore((s) => s.budgets);
  const trips = useBudgetStore((s) => s.trips);
  const tripExpenses = useBudgetStore((s) => s.tripExpenses);
  const getBudgetProgress = useBudgetStore((s) => s.getBudgetProgress);
  const getBudgetHealthCheck = useBudgetStore((s) => s.getBudgetHealthCheck);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      // Add user message immediately (optimistic)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Build compact financial snapshot
        const snapshot = buildFinancialSnapshot({
          transactions,
          categoryDefinitions,
          categoryGroups,
          budgets,
          trips,
          tripExpenses,
          getBudgetProgress,
          getBudgetHealthCheck,
          currency,
          locale: i18n.language || "es",
        });

        // Build conversation history for context (last 5 messages)
        const recentHistory = [...messages, userMessage]
          .slice(-5)
          .map((m) => ({ role: m.role, content: m.content }));

        // Send to Edge Function
        const response = await sendAssistantMessage({
          question,
          snapshot,
          conversationHistory: recentHistory,
          locale: i18n.language || "es",
        });

        if (response.success && response.answer) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response.answer,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          // Map error codes to i18n keys
          const errorCode = response.error || "UNKNOWN";
          let errorKey = "errors.generic";

          if (errorCode === "RATE_LIMIT_FREE") errorKey = "errors.rateLimitFree";
          else if (errorCode === "RATE_LIMIT_PRO") errorKey = "errors.rateLimitPro";
          else if (errorCode === "NO_SESSION") errorKey = "errors.noSession";
          else if (errorCode === "TIMEOUT") errorKey = "errors.timeout";
          else if (errorCode === "OFFLINE") errorKey = "errors.offline";

          setError(errorKey);

          // Add translated error message to chat (never raw error strings)
          const errorMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: t(errorKey),
            timestamp: Date.now(),
            isError: true,
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } catch {
        setError("errors.generic");

        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: t("errors.generic"),
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      messages,
      transactions,
      categoryDefinitions,
      categoryGroups,
      budgets,
      trips,
      tripExpenses,
      getBudgetProgress,
      getBudgetHealthCheck,
      currency,
      i18n.language,
      t,
    ],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    remainingMessages,
    error,
    sendMessage,
    clearError,
  };
}
