/**
 * Edge Function: ai-assistant
 * AI Financial Assistant - answers questions about user's finances
 *
 * Flow:
 * 1. Validate JWT from Supabase Auth
 * 2. Check rate limit (2/day free, 50/day pro)
 * 3. Build system prompt with financial snapshot
 * 4. Process with Gemini 2.5 Flash-Lite (fallback: GPT-4o-mini)
 * 5. Return text answer
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@2.0.5";
import { Redis } from "https://esm.sh/@upstash/redis@1.34.3";
import { getSystemPrompt, buildUserPrompt } from "./prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type UserPlan = "free" | "pro";

async function getUserPlan(userId: string): Promise<UserPlan> {
  try {
    // Use service role to bypass RLS on user_subscriptions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceRoleKey) {
      console.warn("[ai-assistant] SUPABASE_SERVICE_ROLE_KEY not set, defaulting to free");
      return "free";
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await adminClient
      .from("user_subscriptions")
      .select("status, expires_at")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.log(
        `[ai-assistant] No subscription found for user ${userId}, using free plan`,
      );
      return "free";
    }

    const isActive =
      (data.status === "active" || data.status === "trial") &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    console.log(
      `[ai-assistant] User ${userId} subscription: ${data.status}, active: ${isActive}`,
    );
    return isActive ? "pro" : "free";
  } catch (err) {
    console.error(`[ai-assistant] Error checking subscription:`, err);
    return "free";
  }
}

function getRateLimiter(plan: UserPlan) {
  const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!redisUrl || !redisToken) {
    console.warn(
      "[ai-assistant] Upstash not configured, rate limiting disabled",
    );
    return null;
  }

  const redis = new Redis({ url: redisUrl, token: redisToken });

  if (plan === "pro") {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
      analytics: true,
      prefix: "smartspend:assistant:pro",
    });
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, "1 d"),
    analytics: true,
    prefix: "smartspend:assistant:free",
  });
}

// Process with Gemini 2.5 Flash-Lite
async function processWithGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");

  console.log("[ai-assistant] Processing with Gemini 2.5 Flash-Lite...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[ai-assistant] Gemini error:", error);
    throw new Error(`Gemini error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    console.error("[ai-assistant] No content in Gemini response:", data);
    throw new Error("No content in Gemini response");
  }

  return content;
}

// Fallback: Process with GPT-4o-mini
async function processWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

  console.log("[ai-assistant] Processing with GPT-4o-mini (fallback)...");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in OpenAI response");

  return content;
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[ai-assistant] Incoming request");

  try {
    // 1. Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[ai-assistant] User authenticated: ${user.id}`);

    // 2. Check rate limit
    const userPlan = await getUserPlan(user.id);
    const rateLimiter = getRateLimiter(userPlan);
    let rateLimitHeaders: Record<string, string> = {};

    if (rateLimiter) {
      const { success, limit, remaining, reset } = await rateLimiter.limit(
        user.id,
      );

      rateLimitHeaders = {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      };

      if (!success) {
        console.log(
          `[ai-assistant] Rate limit exceeded for user: ${user.id} (plan: ${userPlan})`,
        );

        const errorCode =
          userPlan === "free" ? "RATE_LIMIT_FREE" : "RATE_LIMIT_PRO";

        return new Response(
          JSON.stringify({
            success: false,
            error: errorCode,
            plan: userPlan,
            resetAt: reset,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              ...rateLimitHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }
    }

    // 3. Parse request body
    const body = await req.json();
    const { question, snapshot, conversationHistory, locale } = body as {
      question: string;
      snapshot: any;
      conversationHistory?: { role: string; content: string }[];
      locale: string;
    };

    if (!question || !question.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Build prompts
    const systemPrompt = getSystemPrompt(snapshot, locale);
    const userPrompt = buildUserPrompt(question, conversationHistory);

    // 5. Process with Gemini (fallback to OpenAI)
    let answer: string;
    try {
      answer = await processWithGemini(systemPrompt, userPrompt);
    } catch (geminiError) {
      console.error(
        "[ai-assistant] Gemini failed, falling back to OpenAI:",
        geminiError,
      );
      answer = await processWithOpenAI(systemPrompt, userPrompt);
    }

    // 6. Return response
    return new Response(
      JSON.stringify({ success: true, answer }),
      {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("[ai-assistant] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
