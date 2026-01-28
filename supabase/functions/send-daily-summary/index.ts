import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts';

const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
const PROJECT_ID = SERVICE_ACCOUNT.project_id || 'MISSING_PROJECT_ID';
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
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
  title: (count: number) => string;
  transaction: string;
  transactions: string;
  both: (expenses: string, income: string) => string;
  expensesOnly: (amount: string, count: number, word: string) => string;
  incomeOnly: (amount: string, count: number, word: string) => string;
}> = {
  es: {
    title: (count) => `Resumen del dia: ${count} movimiento${count > 1 ? 's' : ''}`,
    transaction: 'transaccion',
    transactions: 'transacciones',
    both: (expenses, income) => `Gastos: $${expenses} | Ingresos: $${income}`,
    expensesOnly: (amount, count, word) => `Gastaste $${amount} en ${count} ${word}`,
    incomeOnly: (amount, count, word) => `Recibiste $${amount} en ${count} ${word}`,
  },
  en: {
    title: (count) => `Daily summary: ${count} movement${count > 1 ? 's' : ''}`,
    transaction: 'transaction',
    transactions: 'transactions',
    both: (expenses, income) => `Expenses: $${expenses} | Income: $${income}`,
    expensesOnly: (amount, count, word) => `You spent $${amount} in ${count} ${word}`,
    incomeOnly: (amount, count, word) => `You received $${amount} in ${count} ${word}`,
  },
  pt: {
    title: (count) => `Resumo do dia: ${count} movimento${count > 1 ? 's' : ''}`,
    transaction: 'transacao',
    transactions: 'transacoes',
    both: (expenses, income) => `Gastos: $${expenses} | Receitas: $${income}`,
    expensesOnly: (amount, count, word) => `Voce gastou $${amount} em ${count} ${word}`,
    incomeOnly: (amount, count, word) => `Voce recebeu $${amount} em ${count} ${word}`,
  },
  fr: {
    title: (count) => `Resume du jour : ${count} mouvement${count > 1 ? 's' : ''}`,
    transaction: 'transaction',
    transactions: 'transactions',
    both: (expenses, income) => `Depenses : ${expenses} $ | Revenus : ${income} $`,
    expensesOnly: (amount, count, word) => `Vous avez depense ${amount} $ en ${count} ${word}`,
    incomeOnly: (amount, count, word) => `Vous avez recu ${amount} $ en ${count} ${word}`,
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

    // Get all active tokens with daily_summary enabled at this time
    const { data: allTokens } = await supabase.from('push_tokens').select('*').eq('is_active', true);
    const tokens = (allTokens || []).filter(t =>
      t.preferences?.daily_summary?.enabled === true &&
      t.preferences?.daily_summary?.time === currentTime
    );

    let sent = 0;
    for (const tk of tokens) {
      if (isInQuietHours(tk.preferences)) continue;

      const { data: us } = await supabase.from('user_state').select('state').eq('user_id', tk.user_id).single();
      const todayTx = us?.state?.transactions?.filter((tx: any) => tx.date === todayISO) || [];
      if (todayTx.length === 0) continue;

      // Resolve language from device_info
      const lang = getLang(tk.device_info);
      const i18n = TRANSLATIONS[lang];

      const expenses = todayTx.filter((t: any) => t.type === 'expense');
      const income = todayTx.filter((t: any) => t.type === 'income');
      const totalExpenses = expenses.reduce((s: number, t: any) => s + t.amount, 0);
      const totalIncome = income.reduce((s: number, t: any) => s + t.amount, 0);

      let body: string;
      if (totalExpenses > 0 && totalIncome > 0) {
        body = i18n.both(formatAmount(totalExpenses, lang), formatAmount(totalIncome, lang));
      } else if (totalExpenses > 0) {
        const word = expenses.length > 1 ? i18n.transactions : i18n.transaction;
        body = i18n.expensesOnly(formatAmount(totalExpenses, lang), expenses.length, word);
      } else {
        const word = income.length > 1 ? i18n.transactions : i18n.transaction;
        body = i18n.incomeOnly(formatAmount(totalIncome, lang), income.length, word);
      }

      const title = i18n.title(todayTx.length);
      const r = await sendFCM(tk.token, title, body, { type: 'daily_summary', date: todayISO, action: 'open_home' });

      await supabase.from('notification_history').insert({
        user_id: tk.user_id,
        token_id: tk.id,
        notification_type: 'daily_summary',
        title,
        body,
        status: r.success ? 'sent' : 'failed',
        error_message: r.error
      });

      if (r.success) sent++;
      if (r.error === 'INVALID_TOKEN') await supabase.from('push_tokens').update({ is_active: false }).eq('token', tk.token);
    }

    return new Response(JSON.stringify({ sent, checked: tokens.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
