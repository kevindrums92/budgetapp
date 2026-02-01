import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts';

const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
const PROJECT_ID = SERVICE_ACCOUNT.project_id || 'MISSING_PROJECT_ID';
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

// ---------------------------------------------------------------------------
// Scheduler helpers (ported from scheduler.service.ts)
// ---------------------------------------------------------------------------
function calculateNextDate(schedule: any, from: string): string | null {
  const fromDate = new Date(from + 'T12:00:00');
  let nextDate: Date;

  switch (schedule.frequency) {
    case 'daily':
      nextDate = new Date(fromDate);
      nextDate.setDate(nextDate.getDate() + schedule.interval);
      break;

    case 'weekly':
      nextDate = new Date(fromDate);
      nextDate.setDate(nextDate.getDate() + (7 * schedule.interval));
      if (schedule.dayOfWeek !== undefined) {
        const currentDayOfWeek = nextDate.getDay();
        const diff = schedule.dayOfWeek - currentDayOfWeek;
        nextDate.setDate(nextDate.getDate() + diff);
      }
      break;

    case 'monthly':
      nextDate = new Date(fromDate);
      nextDate.setMonth(nextDate.getMonth() + schedule.interval);
      if (schedule.dayOfMonth !== undefined) {
        const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(schedule.dayOfMonth, daysInMonth);
        nextDate.setDate(targetDay);
      }
      break;

    case 'yearly':
      nextDate = new Date(fromDate);
      nextDate.setFullYear(nextDate.getFullYear() + schedule.interval);
      break;

    default:
      return null;
  }

  const nextDateStr = nextDate.toISOString().slice(0, 10);
  if (schedule.endDate && nextDateStr > schedule.endDate) return null;
  return nextDateStr;
}

function transactionExistsForDate(transactions: any[], template: any, date: string): boolean {
  return transactions.some((tx: any) => {
    if (tx.sourceTemplateId === template.id && tx.date === date) return true;
    return tx.name === template.name && tx.category === template.category && tx.amount === template.amount && tx.date === date;
  });
}

function findNextOccurrence(schedule: any, today: string, transactions: any[], template: any): string | null {
  const endDate = new Date(today + 'T12:00:00');
  endDate.setFullYear(endDate.getFullYear() + 1);
  const endDateStr = endDate.toISOString().slice(0, 10);

  let current = calculateNextDate(schedule, schedule.startDate);
  const futureDates: string[] = [];

  while (current && current <= endDateStr) {
    futureDates.push(current);
    current = calculateNextDate(schedule, current);
  }

  for (const futureDate of futureDates) {
    if (futureDate <= today) continue;
    if (transactionExistsForDate(transactions, template, futureDate)) continue;
    return futureDate;
  }

  return null;
}

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
    singleTitle: (status) => `Transaccion ${status} para manana`,
    statusScheduled: 'programada',
    statusPending: 'pendiente',
    multipleTitle: (count) => `${count} transacciones para manana`,
    multipleBody: (total) => `Total: $${total}. Toca para ver detalles.`,
  },
  en: {
    singleTitle: (status) => `${status} transaction for tomorrow`,
    statusScheduled: 'Scheduled',
    statusPending: 'Pending',
    multipleTitle: (count) => `${count} transactions for tomorrow`,
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
    console.log(`[send-upcoming-transactions] Starting execution at ${new Date().toISOString()}`);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    console.log(`[send-upcoming-transactions] Today: ${today}, Tomorrow: ${tomorrowISO}`);

    // Get all active tokens with scheduled_transactions enabled
    const { data: allTokens } = await supabase.from('push_tokens').select('*').eq('is_active', true);
    const tokens = (allTokens || []).filter(t => t.preferences?.scheduled_transactions === true);

    console.log(`[send-upcoming-transactions] Found ${tokens.length} tokens with scheduled_transactions enabled (out of ${allTokens?.length || 0} active tokens)`);

    let sent = 0;
    for (const tk of tokens) {
      console.log(`[send-upcoming-transactions] Checking user ${tk.user_id} (${tk.platform})...`);

      const { data: us } = await supabase.from('user_state').select('state').eq('user_id', tk.user_id).single();
      const allTransactions = us?.state?.transactions || [];

      console.log(`[send-upcoming-transactions]   User has ${allTransactions.length} total transactions`);

      // 1. Find existing transactions for tomorrow (pending/scheduled OR any non-template transaction)
      // A transaction is "existing" if it has a date for tomorrow AND is not a recurring template
      const existingUpcoming = allTransactions.filter((tx: any) =>
        tx.date === tomorrowISO &&
        !tx.schedule?.enabled  // Exclude recurring templates (those are handled separately)
      );

      console.log(`[send-upcoming-transactions]   Found ${existingUpcoming.length} existing transactions for tomorrow`);

      // 2. Find scheduled templates whose next occurrence is tomorrow
      const templates = allTransactions.filter((tx: any) =>
        tx.schedule?.enabled && (!tx.schedule.endDate || tx.schedule.endDate >= tomorrowISO)
      );

      console.log(`[send-upcoming-transactions]   Found ${templates.length} active templates`);

      const virtualUpcoming: any[] = [];
      for (const template of templates) {
        if (!template.schedule) continue;
        const nextDate = findNextOccurrence(template.schedule, today, allTransactions, template);
        if (nextDate === tomorrowISO) {
          // This template's next occurrence is tomorrow
          virtualUpcoming.push({
            ...template,
            date: tomorrowISO,
            status: 'scheduled',
            isVirtual: true,
          });
        }
      }

      console.log(`[send-upcoming-transactions]   Found ${virtualUpcoming.length} virtual transactions for tomorrow`);

      // Combine both types of upcoming transactions
      const upcoming = [...existingUpcoming, ...virtualUpcoming];
      if (upcoming.length === 0) {
        console.log(`[send-upcoming-transactions]   No upcoming transactions for this user, skipping`);
        continue;
      }

      console.log(`[send-upcoming-transactions]   Sending notification for ${upcoming.length} upcoming transaction(s)`);

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

      if (r.success) {
        sent++;
        console.log(`[send-upcoming-transactions]   ✅ Notification sent successfully`);
      } else {
        console.log(`[send-upcoming-transactions]   ❌ Failed to send: ${r.error}`);
      }

      if (r.error === 'INVALID_TOKEN') {
        await supabase.from('push_tokens').update({ is_active: false }).eq('token', tk.token);
        console.log(`[send-upcoming-transactions]   Token marked as inactive due to INVALID_TOKEN error`);
      }
    }

    console.log(`[send-upcoming-transactions] Finished. Sent: ${sent}/${tokens.length}`);
    return new Response(JSON.stringify({ sent, checked: tokens.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(`[send-upcoming-transactions] Error: ${String(e)}`);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
