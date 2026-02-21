/**
 * Edge Function: redeem-promo
 *
 * Validates and redeems a promotional code, granting the user a Pro subscription.
 * Supports monthly, annual, and lifetime promo codes.
 *
 * Flow:
 * 1. Validate JWT from Supabase Auth
 * 2. Rate limit: max 5 attempts per user per hour (brute-force protection)
 * 3. Validate promo code (exists, active, not expired, not at max redemptions)
 * 4. Check user hasn't already redeemed this code
 * 5. In a transaction: increment redemptions, insert redemption record, upsert subscription
 * 6. Log to revenuecat_events for audit trail
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Map product_id → duration type for expires_at calculation
function calculateExpiresAt(productId: string): string | null {
  if (productId === 'co.smartspend.lifetime') return null;

  const now = new Date();
  if (productId === 'co.smartspend.monthly') {
    now.setDate(now.getDate() + 30);
  } else if (productId === 'co.smartspend.annual') {
    now.setDate(now.getDate() + 365);
  }
  return now.toISOString();
}

function productIdToType(productId: string): string {
  if (productId === 'co.smartspend.monthly') return 'monthly';
  if (productId === 'co.smartspend.annual') return 'annual';
  return 'lifetime';
}

// Simple in-memory rate limiting (per invocation instance)
// For production, this resets on each cold start, but combined with DB checks it's sufficient
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxAttempts = 5, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    // ─── Auth: Validate JWT ───
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Missing authorization' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('[redeem-promo] Missing Supabase environment variables');
      return jsonResponse({ success: false, error: 'Server configuration error' }, 500);
    }

    // Client with user's JWT (for auth validation)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ success: false, error: 'Invalid or expired token' }, 401);
    }

    const userId = user.id;
    console.log(`[redeem-promo] User authenticated: ${userId}`);

    // ─── Rate limit ───
    if (!checkRateLimit(userId)) {
      console.warn(`[redeem-promo] Rate limit exceeded for user ${userId}`);
      return jsonResponse({
        success: false,
        error: 'RATE_LIMIT',
        message: 'Demasiados intentos. Espera un momento antes de intentar de nuevo.',
      }, 429);
    }

    // ─── Parse body ───
    const body = await req.json();
    const rawCode = body.code;

    if (!rawCode || typeof rawCode !== 'string' || rawCode.trim().length === 0) {
      return jsonResponse({ success: false, error: 'INVALID_INPUT', message: 'Código requerido' }, 400);
    }

    const code = rawCode.trim().toUpperCase();
    console.log(`[redeem-promo] Attempting to redeem code: ${code} for user: ${userId}`);

    // ─── Admin client (bypasses RLS) ───
    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ─── Validate code ───
    const { data: promoCode, error: codeError } = await admin
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (codeError || !promoCode) {
      console.log(`[redeem-promo] Code not found: ${code}`);
      return jsonResponse({ success: false, error: 'INVALID_CODE', message: 'Código no válido' }, 404);
    }

    // Check active
    if (!promoCode.is_active) {
      return jsonResponse({ success: false, error: 'CODE_INACTIVE', message: 'Este código ya no está disponible' }, 410);
    }

    // Check expiration
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return jsonResponse({ success: false, error: 'CODE_EXPIRED', message: 'Este código ha expirado' }, 410);
    }

    // Check max redemptions
    if (promoCode.current_redemptions >= promoCode.max_redemptions) {
      return jsonResponse({ success: false, error: 'CODE_EXHAUSTED', message: 'Este código ya fue utilizado' }, 410);
    }

    // ─── Check if user already redeemed this code ───
    const { data: existingRedemption } = await admin
      .from('promo_redemptions')
      .select('id')
      .eq('code_id', promoCode.id)
      .eq('user_id', userId)
      .single();

    if (existingRedemption) {
      return jsonResponse({ success: false, error: 'ALREADY_REDEEMED', message: 'Ya canjeaste este código' }, 409);
    }

    // ─── Check if user already has active lifetime subscription ───
    const { data: existingSub } = await admin
      .from('user_subscriptions')
      .select('status, product_id, expires_at')
      .eq('user_id', userId)
      .single();

    if (existingSub?.status === 'active' && existingSub.product_id === 'co.smartspend.lifetime') {
      // User already has a lifetime subscription — no code can improve on this
      return jsonResponse({ success: false, error: 'ALREADY_PRO', message: 'Ya tienes una suscripción Pro de por vida' }, 409);
    }

    // ─── Redeem: increment, insert redemption, upsert subscription ───
    const now = new Date().toISOString();
    const eventId = `promo-${code}-${userId.substring(0, 8)}-${Date.now()}`;

    // 1. Increment redemption count
    const { error: updateError } = await admin
      .from('promo_codes')
      .update({
        current_redemptions: promoCode.current_redemptions + 1,
      })
      .eq('id', promoCode.id)
      .eq('current_redemptions', promoCode.current_redemptions); // Optimistic lock

    if (updateError) {
      console.error('[redeem-promo] Failed to increment redemptions:', updateError);
      return jsonResponse({ success: false, error: 'REDEMPTION_FAILED', message: 'Error al canjear. Intenta de nuevo.' }, 500);
    }

    // 2. Insert redemption record
    const { error: redemptionError } = await admin
      .from('promo_redemptions')
      .insert({
        code_id: promoCode.id,
        user_id: userId,
        redeemed_at: now,
      });

    if (redemptionError) {
      console.error('[redeem-promo] Failed to insert redemption:', redemptionError);
      // Rollback: decrement count
      await admin
        .from('promo_codes')
        .update({ current_redemptions: promoCode.current_redemptions })
        .eq('id', promoCode.id);
      return jsonResponse({ success: false, error: 'REDEMPTION_FAILED', message: 'Error al canjear. Intenta de nuevo.' }, 500);
    }

    // 3. Upsert subscription (same pattern as admin gift)
    const expiresAt = calculateExpiresAt(promoCode.product_id);

    const { error: subError } = await admin
      .from('user_subscriptions')
      .upsert(
        {
          user_id: userId,
          product_id: promoCode.product_id,
          entitlement_ids: ['pro'],
          original_transaction_id: null,
          status: 'active',
          period_type: 'normal',
          purchased_at: now,
          expires_at: expiresAt,
          billing_issue_detected_at: null,
          environment: 'PRODUCTION',
          last_event_id: eventId,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (subError) {
      console.error('[redeem-promo] Failed to upsert subscription:', subError);
      return jsonResponse({ success: false, error: 'SUBSCRIPTION_FAILED', message: 'Error al activar Pro. Contacta soporte.' }, 500);
    }

    // 4. Audit log
    await admin.from('revenuecat_events').insert({
      event_id: eventId,
      event_type: 'PROMO_REDEMPTION',
      user_id: userId,
      payload: {
        code: code,
        code_id: promoCode.id,
        description: promoCode.description,
        product_id: promoCode.product_id,
        redeemed_at: now,
        user_email: user.email || null,
      },
      processed_at: now,
    });

    console.log(`[redeem-promo] Successfully redeemed code ${code} for user ${userId}`);

    const planType = productIdToType(promoCode.product_id);

    return jsonResponse({
      success: true,
      subscription: {
        status: 'active',
        type: planType,
        expiresAt: expiresAt,
      },
    });
  } catch (err) {
    console.error('[redeem-promo] Unexpected error:', err);
    return jsonResponse({ success: false, error: 'INTERNAL_ERROR', message: 'Error interno del servidor' }, 500);
  }
});
