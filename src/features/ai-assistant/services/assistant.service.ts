/**
 * AI Assistant API Service
 * Handles communication with the ai-assistant Edge Function
 */

import { supabase } from "@/lib/supabaseClient";
import type { AssistantRequest, AssistantResponse } from "../types/assistant.types";

const API_TIMEOUT_MS = 30000; // 30 seconds
const EDGE_FUNCTION_NAME = "ai-assistant";

/**
 * Send a message to the AI assistant
 */
export async function sendAssistantMessage(
  request: AssistantRequest,
): Promise<AssistantResponse> {
  console.log("[ai-assistant] Sending message:", request.question.slice(0, 50));

  try {
    // Get current session for auth token
    let session;
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("SESSION_TIMEOUT")), 10000),
        ),
      ]);
      session = result.data.session;
    } catch {
      console.error("[ai-assistant] getSession() timed out");
      return { success: false, error: "TIMEOUT" };
    }

    if (!session) {
      console.error("[ai-assistant] No active session");
      return { success: false, error: "NO_SESSION" };
    }

    // Call Edge Function with timeout
    const { data, error } = await Promise.race([
      supabase.functions.invoke(EDGE_FUNCTION_NAME, {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AbortError")), API_TIMEOUT_MS),
      ),
    ]);

    if (error) {
      console.error("[ai-assistant] Edge Function error:", error);

      // FunctionsHttpError has a context property (Response object) for non-2xx
      const errorContext = (error as any).context;
      let responseBody: any = null;

      // Try to read the response body from the error context
      if (errorContext instanceof Response) {
        try {
          responseBody = await errorContext.json();
        } catch {
          // response body not JSON
        }
      } else if (errorContext?.body) {
        try {
          responseBody =
            typeof errorContext.body === "string"
              ? JSON.parse(errorContext.body)
              : errorContext.body;
        } catch {
          // ignore
        }
      }

      // Check for rate limit (429)
      const statusCode = errorContext?.status || errorContext?.statusCode;
      const isRateLimited =
        statusCode === 429 ||
        responseBody?.error === "RATE_LIMIT_FREE" ||
        responseBody?.error === "RATE_LIMIT_PRO" ||
        error.message?.includes("429");

      if (isRateLimited) {
        const errorCode = responseBody?.error;
        const plan = responseBody?.plan;
        console.warn("[ai-assistant] Rate limit exceeded, plan:", plan);
        return {
          success: false,
          error: errorCode === "RATE_LIMIT_PRO" ? "RATE_LIMIT_PRO" : "RATE_LIMIT_FREE",
          plan,
        };
      }

      // Detect connection/network errors → return OFFLINE code
      const msg = error.message || "";
      if (
        msg.includes("Failed to send a request") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("net::ERR_")
      ) {
        return { success: false, error: "OFFLINE" };
      }

      return {
        success: false,
        error: responseBody?.error || "UNKNOWN",
      };
    }

    if (!data) {
      return { success: false, error: "UNKNOWN" };
    }

    if (data.success === false) {
      return {
        success: false,
        error: data.error || "UNKNOWN",
        message: data.message,
      };
    }

    console.log("[ai-assistant] Response received successfully");
    return {
      success: true,
      answer: data.answer,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message === "AbortError")
    ) {
      console.error("[ai-assistant] Request timed out");
      return { success: false, error: "TIMEOUT" };
    }

    // Detect connection/network errors in outer catch too
    if (error instanceof Error) {
      const msg = error.message;
      if (
        msg.includes("Failed to send a request") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("net::ERR_")
      ) {
        console.error("[ai-assistant] Network error:", msg);
        return { success: false, error: "OFFLINE" };
      }
    }

    console.error("[ai-assistant] Unexpected error:", error);
    return { success: false, error: "UNKNOWN" };
  }
}
