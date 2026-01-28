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

const LOCALE_MAP: Record<SupportedLang, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR',
  fr: 'fr-FR',
};

const TRANSLATIONS: Record<SupportedLang, {
  singleTitle: (status: string) => string;
  statusScheduled: string;
  statusPending: string;
  multipleTitle: (count: number) => string;
  multipleBody: (total: string) => string;
}> = {
  es: {
    singleTitle: (status) => `Transaccion pendiente ${status} para manana`,
    statusScheduled: 'programada',
    statusPending: 'pendiente',
    multipleTitle: (count) => `${count} transacciones pendientes para manana`,
    multipleBody: (total) => `Total: $${total}. Toca para ver detalles.`,
  },
  en: {
    singleTitle: (status) => `${status} pending transaction for tomorrow`,
    statusScheduled: 'Scheduled',
    statusPending: 'Pending',
    multipleTitle: (count) => `${count} pending transactions for tomorrow`,
    multipleBody: (total) => `Total: $${total}. Tap to see details.`,
  },
  pt: {
    singleTitle: (status) => `Transacao ${status} para amanha`,
    statusScheduled: 'programada',
    statusPending: 'pendente',
    multipleTitle: (count) => `${count} transacoes para amanha`,
    multipleBody: (total) => `Total: $${total}. Toque para ver detalhes.`,
  },
  fr: {
    singleTitle: (status) => `Transaction ${status} pour demain`,
    statusScheduled: 'programmee',
    statusPending: 'en attente',
    multipleTitle: (count) => `${count} transactions pour demain`,
    multipleBody: (total) => `Total : ${total} $. Appuyez pour voir les details.`,
  },
};

function getLang(deviceInfo?: { language?: string }): SupportedLang {
  const lang = deviceInfo?.language;
  if (lang && lang in TRANSLATIONS) return lang as SupportedLang;
  return 'es';
}

function formatAmount(n: number, lang: SupportedLang = 'es') {
  return new Intl.NumberFormat(LOCALE_MAP[lang]).format(n);
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

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    // Get all active tokens with scheduled_transactions enabled
    const { data: allTokens } = await supabase.from('push_tokens').select('*').eq('is_active', true);
    const tokens = (allTokens || []).filter(t => t.preferences?.scheduled_transactions === true);

    let sent = 0;
    for (const tk of tokens) {
      const { data: us } = await supabase.from('user_state').select('state').eq('user_id', tk.user_id).single();
      const upcoming = us?.state?.transactions?.filter((tx: any) =>
        tx.date === tomorrowISO && (tx.status === 'pending' || tx.status === 'scheduled')
      ) || [];
      if (upcoming.length === 0) continue;

      // Resolve language from device_info
      const lang = getLang(tk.device_info);
      const i18n = TRANSLATIONS[lang];

      let title: string, body: string, type: string;
      if (upcoming.length === 1) {
        const tx = upcoming[0];
        const statusText = tx.status === 'scheduled' ? i18n.statusScheduled : i18n.statusPending;
        title = i18n.singleTitle(statusText);
        body = `${tx.name}: $${formatAmount(tx.amount, lang)}`;
        type = tx.status === 'scheduled' ? 'upcoming_transaction_scheduled' : 'upcoming_transaction_pending';
      } else {
        title = i18n.multipleTitle(upcoming.length);
        body = i18n.multipleBody(formatAmount(upcoming.reduce((s: number, tx: any) => s + tx.amount, 0), lang));
        type = 'upcoming_transactions_multiple';
      }

      const r = await sendFCM(tk.token, title, body, { type, action: 'open_scheduled' });
      await supabase.from('notification_history').insert({ user_id: tk.user_id, token_id: tk.id, notification_type: type, title, body, status: r.success ? 'sent' : 'failed', error_message: r.error });
      if (r.success) sent++;
      if (r.error === 'INVALID_TOKEN') await supabase.from('push_tokens').update({ is_active: false }).eq('token', tk.token);
    }
    return new Response(JSON.stringify({ sent, checked: tokens.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders }); }
});
