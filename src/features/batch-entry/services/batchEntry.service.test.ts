/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabaseClient";
import {
  parseBatch,
  parseText,
  parseImage,
  parseAudio,
} from "./batchEntry.service";
import type { BatchEntryResponse } from "../types/batch-entry.types";

// Mock supabase
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock dates service
vi.mock("@/services/dates.service", () => ({
  todayISO: vi.fn(() => "2024-01-15"),
}));

describe("batchEntry.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseBatch", () => {
    const mockSession = {
      user: { id: "user-123" },
      access_token: "mock-token",
    };

    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });
    });

    it("should successfully parse batch with transactions", async () => {
      const mockResponse: BatchEntryResponse = {
        success: true,
        transactions: [
          {
            id: "draft-1",
            type: "expense",
            name: "Almuerzo",
            category: "food_drink",
            amount: 50000,
            date: "2024-01-15",
            needsReview: false,
            confidence: 0.95,
          },
        ],
        confidence: 0.95,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await parseBatch({
        inputType: "text",
        data: "Gasté 50 mil en almuerzo",
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].name).toBe("Almuerzo");
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "parse-batch",
        expect.objectContaining({
          body: expect.objectContaining({
            inputType: "text",
            data: "Gasté 50 mil en almuerzo",
            localDate: "2024-01-15",
          }),
          headers: {
            Authorization: "Bearer mock-token",
          },
        })
      );
    });

    it("should add localDate if not provided", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, transactions: [], confidence: 0 },
        error: null,
      });

      await parseBatch({
        inputType: "text",
        data: "test",
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "parse-batch",
        expect.objectContaining({
          body: expect.objectContaining({
            localDate: "2024-01-15",
          }),
        })
      );
    });

    it("should preserve provided localDate", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, transactions: [], confidence: 0 },
        error: null,
      });

      await parseBatch({
        inputType: "text",
        data: "test",
        localDate: "2024-02-20",
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "parse-batch",
        expect.objectContaining({
          body: expect.objectContaining({
            localDate: "2024-02-20",
          }),
        })
      );
    });

    it("should return error when no session", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await parseBatch({
        inputType: "text",
        data: "test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Debes iniciar sesión para usar esta función");
    });

    it("should handle rate limit error for free users", async () => {
      const rateLimitError = {
        message: "Too Many Requests",
        context: {
          status: 429,
          body: JSON.stringify({ error: "RATE_LIMIT_FREE", plan: "free" }),
        },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: rateLimitError as any,
      });

      const result = await parseBatch({
        inputType: "text",
        data: "test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("RATE_LIMIT_FREE");
    });

    it("should handle rate limit error for pro users", async () => {
      const rateLimitError = {
        message: "Too Many Requests",
        context: {
          status: 429,
          body: JSON.stringify({ error: "RATE_LIMIT_PRO", plan: "pro" }),
        },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: rateLimitError as any,
      });

      const result = await parseBatch({
        inputType: "text",
        data: "test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("RATE_LIMIT_PRO");
    });

    it("should handle timeout error", async () => {
      vi.mocked(supabase.functions.invoke).mockImplementation(
        () =>
          new Promise((_, reject) => {
            const error = new Error("AbortError");
            error.name = "AbortError";
            setTimeout(() => reject(error), 100);
          })
      );

      const result = await parseBatch({
        inputType: "text",
        data: "test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("TIMEOUT");
    });

    it("should handle no response from server", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await parseBatch({
        inputType: "text",
        data: "test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("NO_RESPONSE");
    });

    it("should handle generic errors", async () => {
      const genericError = {
        message: "Network error",
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: genericError as any,
      });

      const result = await parseBatch({
        inputType: "text",
        data: "test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("parseText", () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "token" } as any },
        error: null,
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, transactions: [], confidence: 0 },
        error: null,
      });
    });

    it("should call parseBatch with text input type", async () => {
      await parseText("Gasté 100 mil en comida");

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "parse-batch",
        expect.objectContaining({
          body: expect.objectContaining({
            inputType: "text",
            data: "Gasté 100 mil en comida",
          }),
        })
      );
    });

    it("should trim whitespace from text", async () => {
      await parseText("  test  ");

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "parse-batch",
        expect.objectContaining({
          body: expect.objectContaining({
            data: "test",
          }),
        })
      );
    });
  });

  describe("parseImage", () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "token" } as any },
        error: null,
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, transactions: [], confidence: 0 },
        error: null,
      });
    });

    it("should call parseBatch with image input type", async () => {
      const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";

      await parseImage(base64Image);

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "parse-batch",
        expect.objectContaining({
          body: expect.objectContaining({
            inputType: "image",
            imageBase64: base64Image,
          }),
        })
      );
    });
  });

  describe("parseAudio", () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "token" } as any },
        error: null,
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, transactions: [], confidence: 0 },
        error: null,
      });
    });

    it("should call parseBatch with audio input type", async () => {
      const base64Audio = "data:audio/aac;base64,GkXfo59ChoEBQveB...";

      await parseAudio(base64Audio, "audio/aac");

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "parse-batch",
        expect.objectContaining({
          body: expect.objectContaining({
            inputType: "audio",
            audioBase64: base64Audio,
            audioMimeType: "audio/aac",
          }),
        })
      );
    });
  });
});
