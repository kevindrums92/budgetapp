import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts';

const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');

// CRITICAL: Get project_id from SERVICE_ACCOUNT, not hardcoded
const PROJECT_ID = SERVICE_ACCOUNT.project_id || 'MISSING_PROJECT_ID';
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64Encode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64Encode(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = SERVICE_ACCOUNT.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    enc.encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64Encode(new Uint8Array(signature))}`;

  console.log('[Debug] JWT Token (first 50 chars):', jwt.substring(0, 50) + '...');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await res.json();
  console.log('[Debug] OAuth response status:', res.status);
  console.log('[Debug] OAuth response:', JSON.stringify(tokenData));

  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify SERVICE_ACCOUNT configuration
    console.log('=== SERVICE_ACCOUNT DEBUG ===');
    console.log('[Debug] Has client_email:', !!SERVICE_ACCOUNT.client_email);
    console.log('[Debug] Has private_key:', !!SERVICE_ACCOUNT.private_key);
    console.log('[Debug] Has project_id:', !!SERVICE_ACCOUNT.project_id);
    console.log('[Debug] Project ID:', SERVICE_ACCOUNT.project_id);
    console.log('[Debug] Client email:', SERVICE_ACCOUNT.client_email);
    console.log('[Debug] FCM Endpoint:', FCM_ENDPOINT);

    if (!SERVICE_ACCOUNT.client_email || !SERVICE_ACCOUNT.private_key || !SERVICE_ACCOUNT.project_id) {
      return new Response(
        JSON.stringify({
          error: 'SERVICE_ACCOUNT not properly configured',
          details:
            'Missing required fields. Go to Supabase Dashboard → Edge Functions → send-upcoming-transactions → Secrets and verify FIREBASE_SERVICE_ACCOUNT is set correctly.',
          has_client_email: !!SERVICE_ACCOUNT.client_email,
          has_private_key: !!SERVICE_ACCOUNT.private_key,
          has_project_id: !!SERVICE_ACCOUNT.project_id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Get token from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    if (error || !tokens?.length) {
      return new Response(
        JSON.stringify({ error: 'No active tokens found', details: error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = tokens[0];
    console.log('[Debug] Device token (first 30 chars):', token.token.substring(0, 30) + '...');

    // 3. Generate access token
    console.log('=== ACCESS TOKEN DEBUG ===');
    const accessToken = await getAccessToken();
    console.log('[Debug] Access token generated:', !!accessToken);
    console.log('[Debug] Access token length:', accessToken?.length || 0);
    console.log('[Debug] Access token (first 50 chars):', accessToken.substring(0, 50) + '...');

    // 4. Send FCM notification
    console.log('=== FCM SEND DEBUG ===');
    const response = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: token.token,
          notification: {
            title: '🎉 Test Notification',
            body: 'This is a test from SmartSpend!',
          },
          data: {
            type: 'test',
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
        },
      }),
    });

    const result = await response.json();
    console.log('[Debug] FCM response status:', response.status);
    console.log('[Debug] FCM response:', JSON.stringify(result));

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        fcm_response: result,
        debug_info: {
          project_id: SERVICE_ACCOUNT.project_id,
          fcm_endpoint: FCM_ENDPOINT,
          has_access_token: !!accessToken,
          token_preview: token.token.substring(0, 30) + '...',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
