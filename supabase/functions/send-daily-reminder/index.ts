import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts';

const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/smartspend-app-14ec4/messages:send';
const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
type SupportedLang = 'es' | 'en' | 'pt' | 'fr';

const TRANSLATIONS: Record<SupportedLang, {
  title: string;
  body: string;
}> = {
  es: {
    title: 'Registra tus gastos',
    body: 'No has registrado ninguna transaccion hoy. Toma un momento para actualizar tus finanzas.',
  },
  en: {
    title: 'Track your expenses',
    body: 'You haven\'t registered any transactions today. Take a moment to update your finances.',
  },
  pt: {
    title: 'Registre seus gastos',
    body: 'Voce nao registrou nenhuma transacao hoje. Reserve um momento para atualizar suas financas.',
  },
  fr: {
    title: 'Enregistrez vos depenses',
    body: 'Vous n\'avez enregistre aucune transaction aujourd\'hui. Prenez un moment pour mettre a jour vos finances.',
  },
};

function getLang(deviceInfo?: { language?: string }): SupportedLang {
  const lang = deviceInfo?.language;
  if (lang && lang in TRANSLATIONS) return lang as SupportedLang;
  return 'es';
}

// ---------------------------------------------------------------------------
// FCM helpers
// ---------------------------------------------------------------------------
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: SERVICE_ACCOUNT.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  const enc = new TextEncoder();
  const headerB64 = base64Encode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64Encode(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const pemContents = SERVICE_ACCOUNT.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(unsignedToken));
  const jwt = `${unsignedToken}.${base64Encode(new Uint8Array(signature))}`;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  return (await res.json()).access_token;
}

async function sendFCM(token: string, title: string, body: string, data?: Record<string, string>) {
  try {
    const accessToken = await getAccessToken();
    const res = await fetch(FCM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ message: { token, notification: { title, body }, data, android: { priority: 'high' }, apns: { payload: { aps: { sound: 'default' } } } } }) });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error?.details?.some((d: any) => d.errorCode === 'UNREGISTERED') ? 'INVALID_TOKEN' : err.error?.message };
  } catch (e) { return { success: false, error: String(e) }; }
}

function isInQuietHours(preferences: any): boolean {
  if (!preferences.quiet_hours?.enabled) return false;
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const { start, end } = preferences.quiet_hours;
  if (start > end) return currentTime >= start || currentTime < end;
  return currentTime >= start && currentTime < end;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const now = new Date();
    const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    const todayISO = now.toISOString().split('T')[0];

    // Get all active tokens with daily_reminder enabled at this time
    const { data: allTokens } = await supabase.from('push_tokens').select('*').eq('is_active', true);
    const tokens = (allTokens || []).filter(t =>
      t.preferences?.daily_reminder?.enabled === true &&
      t.preferences?.daily_reminder?.time === currentTime
    );

    let sent = 0;
    let skipped = 0;

    for (const tk of tokens) {
      if (isInQuietHours(tk.preferences)) {
        skipped++;
        continue;
      }

      const { data: us } = await supabase.from('user_state').select('state').eq('user_id', tk.user_id).single();
      const todayTx = us?.state?.transactions?.filter((tx: any) => tx.date === todayISO) || [];

      // Only send reminder if user has NO transactions today
      if (todayTx.length > 0) {
        skipped++;
        continue;
      }

      // Resolve language from device_info
      const lang = getLang(tk.device_info);
      const i18n = TRANSLATIONS[lang];

      const r = await sendFCM(tk.token, i18n.title, i18n.body, { type: 'daily_reminder', action: 'open_add_transaction' });

      await supabase.from('notification_history').insert({
        user_id: tk.user_id,
        token_id: tk.id,
        notification_type: 'daily_reminder',
        title: i18n.title,
        body: i18n.body,
        status: r.success ? 'sent' : 'failed',
        error_message: r.error
      });

      if (r.success) sent++;
      if (r.error === 'INVALID_TOKEN') await supabase.from('push_tokens').update({ is_active: false }).eq('token', tk.token);
    }

    return new Response(JSON.stringify({ sent, skipped, checked: tokens.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
