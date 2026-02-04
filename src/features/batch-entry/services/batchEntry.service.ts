/**
 * Batch Entry API Service
 * Handles communication with the parse-batch Edge Function
 */

import { supabase } from "@/lib/supabaseClient";
import { todayISO } from "@/services/dates.service";
import type {
  BatchEntryRequest,
  BatchEntryResponse,
  HistoryPattern,
} from "../types/batch-entry.types";

/** Timeout for API calls in milliseconds */
const API_TIMEOUT_MS = 60000; // 60 seconds

/** Edge Function URL */
const EDGE_FUNCTION_NAME = "parse-batch";

/**
 * Parse batch input using AI
 * Sends text, image, or audio to the Edge Function for processing
 */
export async function parseBatch(request: BatchEntryRequest): Promise<BatchEntryResponse> {
  // Add local date to request if not provided
  const requestWithDate: BatchEntryRequest = {
    ...request,
    localDate: request.localDate || todayISO(),
  };

  console.log("[batchEntry] Calling parse-batch with input type:", request.inputType, "localDate:", requestWithDate.localDate, "historyPatterns:", request.historyPatterns?.length || 0);

  try {
    // Get current session for auth token
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("[batchEntry] No active session:", sessionError);
      return {
        success: false,
        transactions: [],
        confidence: 0,
        error: "Debes iniciar sesión para usar esta función",
      };
    }

    console.log("[batchEntry] Session found, access token present:", !!session.access_token);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      // Call Edge Function with explicit Authorization header
      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
        body: requestWithDate,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error("[batchEntry] Edge Function error:", error);

        // Check for rate limit error (429)
        // Supabase FunctionsHttpError may have context with status or the error name/message
        const errorContext = (error as any).context;
        const statusCode = errorContext?.status || errorContext?.statusCode;
        const isRateLimited =
          statusCode === 429 ||
          error.message?.includes("429") ||
          error.message?.includes("Too Many Requests") ||
          error.message?.includes("rate limit") ||
          error.name === "FunctionsRelayError";

        if (isRateLimited) {
          // Try to extract plan info from the error response body
          // The body may be in different places depending on Supabase version
          let errorCode: string | undefined;
          let plan: string | undefined;

          // Try context.body first (some Supabase versions)
          if (errorContext?.body) {
            try {
              const body = typeof errorContext.body === 'string'
                ? JSON.parse(errorContext.body)
                : errorContext.body;
              errorCode = body?.error;
              plan = body?.plan;
            } catch {
              // Ignore parse errors
            }
          }

          // Try context.data (other Supabase versions)
          if (!errorCode && errorContext?.data) {
            errorCode = errorContext.data?.error;
            plan = errorContext.data?.plan;
          }

          // Try parsing error message if it contains JSON
          if (!errorCode && error.message) {
            try {
              // Sometimes the body is embedded in the error message
              const jsonMatch = error.message.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                errorCode = parsed?.error;
                plan = parsed?.plan;
              }
            } catch {
              // Ignore parse errors
            }
          }

          console.warn("[batchEntry] Rate limit exceeded (429), plan:", plan, "errorCode:", errorCode);

          // Return specific error code based on plan
          // Default to FREE if we can't determine the plan (free users more likely to hit limits)
          return {
            success: false,
            transactions: [],
            confidence: 0,
            error: errorCode === "RATE_LIMIT_PRO" ? "RATE_LIMIT_PRO" : "RATE_LIMIT_FREE",
          };
        }

        return {
          success: false,
          transactions: [],
          confidence: 0,
          error: error.message || "Error al procesar la solicitud",
        };
      }

      // Validate response
      if (!data) {
        return {
          success: false,
          transactions: [],
          confidence: 0,
          error: "NO_RESPONSE",
        };
      }

      // Check if response indicates failure
      if (data.success === false) {
        return {
          success: false,
          transactions: [],
          confidence: 0,
          error: data.error || "Error desconocido",
        };
      }

      // Success! Return the transactions
      console.log(
        "[batchEntry] Successfully parsed",
        data.transactions?.length || 0,
        "transactions"
      );

      return {
        success: true,
        transactions: data.transactions || [],
        confidence: data.confidence || 0,
        rawInterpretation: data.rawInterpretation,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("[batchEntry] Request timed out");
        return {
          success: false,
          transactions: [],
          confidence: 0,
          error: "TIMEOUT",
        };
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("[batchEntry] Unexpected error:", error);
    return {
      success: false,
      transactions: [],
      confidence: 0,
      error: error instanceof Error ? error.message : "Error inesperado",
    };
  }
}

/**
 * Parse text input
 * @param text - The text to parse
 * @param historyPatterns - Optional transaction patterns from user's history for better matching
 */
export async function parseText(
  text: string,
  historyPatterns?: HistoryPattern[]
): Promise<BatchEntryResponse> {
  return parseBatch({
    inputType: "text",
    data: text.trim(),
    historyPatterns,
  });
}

/**
 * Parse image input
 * @param imageBase64 - Base64-encoded image
 * @param historyPatterns - Optional transaction patterns from user's history for better matching
 */
export async function parseImage(
  imageBase64: string,
  historyPatterns?: HistoryPattern[]
): Promise<BatchEntryResponse> {
  return parseBatch({
    inputType: "image",
    imageBase64,
    historyPatterns,
  });
}

/**
 * Parse audio input
 * @param audioBase64 - Base64-encoded audio
 * @param historyPatterns - Optional transaction patterns from user's history for better matching
 */
export async function parseAudio(
  audioBase64: string,
  historyPatterns?: HistoryPattern[]
): Promise<BatchEntryResponse> {
  return parseBatch({
    inputType: "audio",
    audioBase64,
    historyPatterns,
  });
}

/**
 * Check if user is authenticated (required for batch entry)
 */
export async function isAuthenticated(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}
