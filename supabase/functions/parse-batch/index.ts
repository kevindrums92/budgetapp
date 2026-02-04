/**
 * Edge Function: parse-batch
 * Processes text, images, or audio to extract transactions using AI
 *
 * Flow:
 * 1. Validate JWT from Supabase Auth
 * 2. Check rate limit (10 requests/hour/user)
 * 3. If audio: transcribe with OpenAI Whisper
 * 4. Process with Gemini 2.0 Flash to extract transactions (fallback: GPT-4o-mini)
 * 5. Return structured JSON response
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@2.0.5";
import { Redis } from "https://esm.sh/@upstash/redis@1.34.3";
import { getSystemPrompt, RESPONSE_SCHEMA } from "./prompts.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription plan types
type UserPlan = "free" | "pro";

// Check if user has an active subscription
async function getUserPlan(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserPlan> {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("status, expires_at")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.log(`[parse-batch] No subscription found for user ${userId}, using free plan`);
      return "free";
    }

    // Check if subscription is active (status is 'active' or 'trial' and not expired)
    const isActive =
      (data.status === "active" || data.status === "trial") &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    console.log(`[parse-batch] User ${userId} subscription status: ${data.status}, active: ${isActive}`);
    return isActive ? "pro" : "free";
  } catch (err) {
    console.error(`[parse-batch] Error checking subscription:`, err);
    return "free";
  }
}

// Initialize Upstash Redis for rate limiting
function getRateLimiter(plan: UserPlan) {
  const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!redisUrl || !redisToken) {
    console.warn("[parse-batch] Upstash not configured, rate limiting disabled");
    return null;
  }

  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  if (plan === "pro") {
    // TODO: Revert to 10 requests per hour before committing to production
    // Pro plan: 50 requests per hour (testing)
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 h"),
      analytics: true,
      prefix: "smartspend:batch:pro",
    });
  }

  // Free plan: 2 requests per day
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, "1 d"),
    analytics: true,
    prefix: "smartspend:batch:free",
  });
}

// Transcribe audio using OpenAI GPT-4o Mini Transcribe
async function transcribeAudio(audioBase64: string): Promise<string> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  console.log("[parse-batch] Transcribing audio with GPT-4o Mini Transcribe...");

  // Decode base64 to binary
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create form data
  const formData = new FormData();
  const audioBlob = new Blob([bytes], { type: "audio/webm" });
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", "gpt-4o-mini-transcribe");
  formData.append("language", "es");
  formData.append("response_format", "text");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[parse-batch] Transcription failed:", error);

    // Fallback to standard Whisper
    console.log("[parse-batch] Falling back to Whisper...");
    formData.set("model", "whisper-1");

    const fallbackResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!fallbackResponse.ok) {
      throw new Error(`Transcription failed: ${await fallbackResponse.text()}`);
    }

    return await fallbackResponse.text();
  }

  const transcription = await response.text();
  console.log("[parse-batch] Transcription:", transcription);
  return transcription;
}

// Process with Gemini 2.0 Flash
async function processWithGemini(
  text: string,
  currentDate: string,
  imageBase64?: string
): Promise<{
  transactions: Array<{
    type: "income" | "expense";
    name: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
    needsReview: boolean;
    confidence: number;
  }>;
  overallConfidence: number;
  rawInterpretation?: string;
}> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("[parse-batch] Processing with Gemini 2.0 Flash...");

  const systemPrompt = getSystemPrompt(currentDate);

  // Build content parts
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  // Add system prompt
  parts.push({ text: systemPrompt });

  // Add image if present
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    });
    parts.push({ text: "Extrae las transacciones de este recibo o imagen:" });
  } else {
    parts.push({ text: `Extrae las transacciones del siguiente texto:\n\n"${text}"` });
  }

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1, // Low temperature for more deterministic output
    },
  };

  // Try gemini-2.0-flash first, fallback to 1.5-flash if not available
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[parse-batch] Gemini error:", error);

    // Fallback to GPT-4o-mini
    console.log("[parse-batch] Falling back to GPT-4o-mini...");
    return await processWithOpenAI(text, currentDate, imageBase64);
  }

  const data = await response.json();

  // Extract the JSON response
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    console.error("[parse-batch] No content in Gemini response:", data);
    throw new Error("No content in Gemini response");
  }

  try {
    const parsed = JSON.parse(content);
    console.log("[parse-batch] Gemini result:", JSON.stringify(parsed, null, 2));
    return parsed;
  } catch {
    console.error("[parse-batch] Failed to parse Gemini JSON:", content);
    throw new Error("Failed to parse AI response");
  }
}

// Fallback: Process with OpenAI GPT-4o-mini
async function processWithOpenAI(
  text: string,
  currentDate: string,
  imageBase64?: string
): Promise<{
  transactions: Array<{
    type: "income" | "expense";
    name: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
    needsReview: boolean;
    confidence: number;
  }>;
  overallConfidence: number;
  rawInterpretation?: string;
}> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  console.log("[parse-batch] Processing with GPT-4o-mini (fallback)...");
  console.log("[parse-batch] Input text to process:", text);
  console.log("[parse-batch] Current date for prompt:", currentDate);

  const systemPrompt = getSystemPrompt(currentDate);

  const messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
        {
          type: "text",
          text: "Extrae las transacciones de este recibo o imagen.",
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `Extrae las transacciones del siguiente texto:\n\n"${text}"`,
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "batch_transactions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["income", "expense"] },
                    name: { type: "string", description: "Short description of the transaction" },
                    category: {
                      type: "string",
                      enum: [
                        // Expense categories
                        "food_drink", "home_utilities", "transport", "health",
                        "shopping", "entertainment", "education", "travel",
                        "financial", "family", "pets", "gifts",
                        "personal_care", "subscriptions", "miscellaneous",
                        // Income categories
                        "primary_income", "secondary_income", "investment_income",
                        "business_income", "government", "other_income"
                      ]
                    },
                    amount: { type: "number" },
                    date: { type: "string" },
                    notes: { type: "string" },
                    needsReview: { type: "boolean" },
                    confidence: { type: "number" }
                  },
                  required: ["type", "name", "category", "amount", "date", "notes", "needsReview", "confidence"],
                  additionalProperties: false
                }
              },
              overallConfidence: { type: "number" },
              rawInterpretation: { type: "string" }
            },
            required: ["transactions", "overallConfidence", "rawInterpretation"],
            additionalProperties: false
          }
        }
      },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  console.log("[parse-batch] OpenAI raw response:", JSON.stringify(data, null, 2));

  const content = data.choices?.[0]?.message?.content;
  console.log("[parse-batch] OpenAI content string:", content);

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const parsed = JSON.parse(content);
  console.log("[parse-batch] OpenAI parsed JSON:", JSON.stringify(parsed, null, 2));
  return parsed;
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[parse-batch] Incoming request");

  try {
    // 1. Validate authorization
    const authHeader = req.headers.get("Authorization");
    console.log("[parse-batch] Auth header present:", !!authHeader);

    if (!authHeader) {
      console.error("[parse-batch] Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to validate JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("[parse-batch] SUPABASE_URL defined:", !!supabaseUrl);
    console.log("[parse-batch] SUPABASE_ANON_KEY defined:", !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[parse-batch] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("[parse-batch] Auth result - user:", user?.id, "error:", authError?.message);

    if (authError || !user) {
      console.error("[parse-batch] Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parse-batch] User authenticated: ${user.id}`);

    // 2. Check subscription and apply rate limit
    const userPlan = await getUserPlan(supabase, user.id);
    console.log(`[parse-batch] User plan: ${userPlan}`);

    const rateLimiter = getRateLimiter(userPlan);
    let rateLimitHeaders: Record<string, string> = {};

    if (rateLimiter) {
      const { success, limit, remaining, reset } = await rateLimiter.limit(user.id);

      rateLimitHeaders = {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      };

      if (!success) {
        console.log(`[parse-batch] Rate limit exceeded for user: ${user.id} (plan: ${userPlan})`);

        // Different error messages based on plan
        const errorCode = userPlan === "free" ? "RATE_LIMIT_FREE" : "RATE_LIMIT_PRO";
        const errorMessage =
          userPlan === "free"
            ? "Has alcanzado tu límite de 2 solicitudes diarias. Actualiza a Pro para obtener más."
            : "Has excedido el límite de solicitudes. Intenta de nuevo en una hora.";

        return new Response(
          JSON.stringify({
            success: false,
            error: errorCode,
            message: errorMessage,
            plan: userPlan,
            resetAt: reset,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // 3. Parse request body
    const body = await req.json();
    const { inputType, data, imageBase64, audioBase64, localDate } = body as {
      inputType: "text" | "image" | "audio";
      data?: string;
      imageBase64?: string;
      audioBase64?: string;
      localDate?: string;
    };

    // Use client's local date if provided, otherwise fall back to UTC
    const currentDate = localDate || new Date().toISOString().split("T")[0];
    console.log(`[parse-batch] Using date: ${currentDate} (client localDate: ${localDate || "not provided"})`);

    console.log(`[parse-batch] Input type: ${inputType}`);

    // Validate input
    if (!inputType) {
      return new Response(
        JSON.stringify({ success: false, error: "inputType is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (inputType === "text" && !data) {
      return new Response(
        JSON.stringify({ success: false, error: "data is required for text input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (inputType === "image" && !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "imageBase64 is required for image input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (inputType === "audio" && !audioBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "audioBase64 is required for audio input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Process input
    let textToProcess = data || "";

    // If audio, transcribe first
    if (inputType === "audio" && audioBase64) {
      textToProcess = await transcribeAudio(audioBase64);
    }

    // 5. Process with AI (Gemini primary, OpenAI fallback)
    let result;
    try {
      result = await processWithGemini(
        textToProcess,
        currentDate,
        inputType === "image" ? imageBase64 : undefined
      );
    } catch (geminiError) {
      console.error("[parse-batch] Gemini failed, falling back to OpenAI:", geminiError);
      result = await processWithOpenAI(
        textToProcess,
        currentDate,
        inputType === "image" ? imageBase64 : undefined
      );
    }

    // 6. Add UUIDs to transactions
    const transactionsWithIds = result.transactions.map((tx) => ({
      ...tx,
      id: crypto.randomUUID(),
    }));

    // 7. Return response
    return new Response(
      JSON.stringify({
        success: true,
        transactions: transactionsWithIds,
        confidence: result.overallConfidence,
        rawInterpretation: result.rawInterpretation,
      }),
      {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[parse-batch] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
