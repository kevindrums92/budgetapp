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

/**
 * Calculate "today" in the user's timezone
 * @param timezone - IANA timezone (e.g., "America/Bogota")
 * @returns Date string in YYYY-MM-DD format
 */
function getTodayInTimezone(timezone?: string): string {
  const now = new Date();

  // If no timezone provided, fallback to UTC
  if (!timezone) {
    return now.toISOString().split('T')[0];
  }

  try {
    // Convert to user's timezone using toLocaleString
    // Format: "M/D/YYYY, HH:MM:SS AM/PM"
    const dateStr = now.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Parse MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error(`[send-daily-summary] Invalid timezone "${timezone}", falling back to UTC:`, e);
    return now.toISOString().split('T')[0];
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    console.log(`[send-daily-summary] Starting execution at ${new Date().toISOString()}`);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const now = new Date();
    const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;

    console.log(`[send-daily-summary] Current time: ${currentTime} UTC`);

    // Get all active tokens with daily_summary enabled at this time
    const { data: allTokens } = await supabase.from('push_tokens').select('*').eq('is_active', true);
    const tokens = (allTokens || []).filter(t =>
      t.preferences?.daily_summary?.enabled === true &&
      t.preferences?.daily_summary?.time === currentTime
    );

    console.log(`[send-daily-summary] Found ${tokens.length} tokens with daily_summary enabled at ${currentTime} (out of ${allTokens?.length || 0} active tokens)`);

    let sent = 0;
    let skipped = 0;

    for (const tk of tokens) {
      console.log(`[send-daily-summary] Checking user ${tk.user_id} (${tk.platform})...`);

      if (isInQuietHours(tk.preferences)) {
        console.log(`[send-daily-summary]   Skipping: user is in quiet hours`);
        skipped++;
        continue;
      }

      // Calculate "today" in user's timezone
      const userTimezone = tk.device_info?.timezone;
      const todayISO = getTodayInTimezone(userTimezone);
      console.log(`[send-daily-summary]   User timezone: ${userTimezone || 'UTC (fallback)'}, Today: ${todayISO}`);

      const { data: us } = await supabase.from('user_state').select('state').eq('user_id', tk.user_id).single();
      const todayTx = us?.state?.transactions?.filter((tx: any) => tx.date === todayISO) || [];

      console.log(`[send-daily-summary]   User has ${todayTx.length} transactions today`);

      if (todayTx.length === 0) {
        console.log(`[send-daily-summary]   Skipping: no transactions today`);
        skipped++;
        continue;
      }

      console.log(`[send-daily-summary]   Sending summary...`);

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

      if (r.success) {
        sent++;
        console.log(`[send-daily-summary]   ✅ Notification sent successfully`);
      } else {
        console.log(`[send-daily-summary]   ❌ Failed to send: ${r.error}`);
      }

      if (r.error === 'INVALID_TOKEN') {
        await supabase.from('push_tokens').update({ is_active: false }).eq('token', tk.token);
        console.log(`[send-daily-summary]   Token marked as inactive due to INVALID_TOKEN error`);
      }
    }

    console.log(`[send-daily-summary] Finished. Sent: ${sent}, Skipped: ${skipped}, Checked: ${tokens.length}`);
    return new Response(JSON.stringify({ sent, skipped, checked: tokens.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(`[send-daily-summary] Error: ${String(e)}`);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
