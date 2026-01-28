# Push Notifications Setup Guide

Esta guia documenta todos los pasos necesarios para configurar Push Notifications en un nuevo proyecto de Supabase.

## Prerequisitos

### Firebase
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Ir a **Project Settings → Service Accounts**
3. Click **"Generate new private key"**
4. Guardar el JSON (contiene `client_email`, `private_key`, etc.)
5. Anotar el **Project ID** (ej: `smartspend-app-14ec4`)

### iOS (Capacitor)
- Configurar Firebase en Xcode via SPM
- Agregar `GoogleService-Info.plist` al proyecto
- Configurar capabilities de Push Notifications

---

## Paso 1: Crear Tablas en Supabase

Ejecutar en **SQL Editor**:

```sql
-- =====================================================
-- PUSH NOTIFICATIONS TABLES
-- =====================================================

-- Table: push_tokens
-- Stores FCM tokens for each user device
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_info JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{
    "scheduled_transactions": true,
    "daily_reminder": {"enabled": false, "time": "20:00"},
    "daily_summary": {"enabled": false, "time": "21:00"},
    "quiet_hours": {"enabled": false, "start": "22:00", "end": "08:00"}
  }',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: notification_history
-- Logs all sent notifications for debugging and analytics
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES public.push_tokens(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_is_active ON public.push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON public.notification_history(sent_at);

-- RLS Policies
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- push_tokens policies
CREATE POLICY "Users can view own tokens"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON public.push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- notification_history policies
CREATE POLICY "Users can view own notification history"
  ON public.notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Paso 2: Habilitar Extensiones

En **Database → Extensions**, habilitar:

1. **pg_cron** - Para programar tareas (schema: `extensions`)
2. **pg_net** - Para hacer HTTP requests desde cron jobs (schema: `extensions`)

---

## Paso 3: Configurar Secrets

En **Edge Functions → Secrets** (o en cada funcion individualmente), agregar:

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | El JSON completo del service account de Firebase |

**Nota:** `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya estan disponibles automaticamente.

---

## Paso 4: Desplegar Edge Functions

Crear las siguientes funciones en **Edge Functions → New Function**:

### 4.1 send-test-notification

Funcion de prueba para verificar que FCM funciona.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
// IMPORTANTE: Reemplazar con tu Firebase Project ID
const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/TU_FIREBASE_PROJECT_ID/messages:send';

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return base64UrlEncode(encoder.encode(str));
}

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

  const headerB64 = stringToBase64Url(JSON.stringify(header));
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = SERVICE_ACCOUNT.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
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
      return new Response(JSON.stringify({ error: 'No active tokens found', details: error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = tokens[0];
    const accessToken = await getAccessToken();

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
            title: 'SmartSpend Test',
            body: 'Las notificaciones funcionan correctamente!',
          },
          apns: { payload: { aps: { sound: 'default' } } },
        },
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify({
      success: response.ok,
      fcm_response: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 4.2 send-daily-reminder

Envia recordatorio diario si el usuario no ha registrado transacciones hoy.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
// IMPORTANTE: Reemplazar con tu Firebase Project ID
const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/TU_FIREBASE_PROJECT_ID/messages:send';

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return base64UrlEncode(encoder.encode(str));
}

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

  const headerB64 = stringToBase64Url(JSON.stringify(header));
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = SERVICE_ACCOUNT.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function isInQuietHours(preferences: any): boolean {
  if (!preferences?.quiet_hours?.enabled) return false;
  const now = new Date();
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
  const { start, end } = preferences.quiet_hours;
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  return currentTime >= start && currentTime < end;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    const todayISO = now.toISOString().split('T')[0];

    console.log(`[DailyReminder] Checking for reminders at ${currentTime}`);

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('is_active', true)
      .eq('preferences->daily_reminder->enabled', true)
      .eq('preferences->daily_reminder->time', currentTime);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;
    const accessToken = await getAccessToken();

    for (const token of tokens) {
      if (isInQuietHours(token.preferences)) continue;

      const { data: userState } = await supabase
        .from('user_state')
        .select('state')
        .eq('user_id', token.user_id)
        .single();

      if (!userState) continue;

      const todayTransactions = userState.state.transactions?.filter(
        (t: { date: string }) => t.date === todayISO
      );

      if (todayTransactions && todayTransactions.length > 0) continue;

      const notification = {
        title: 'Registra tus gastos',
        body: 'No has registrado ninguna transaccion hoy. Toma un momento para actualizar tus finanzas.',
      };

      const response = await fetch(FCM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: token.token,
            notification,
            data: { type: 'daily_reminder', action: 'open_add_transaction' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      });

      if (response.ok) {
        sentCount++;
        await supabase.from('notification_history').insert({
          user_id: token.user_id,
          token_id: token.id,
          notification_type: 'daily_reminder',
          title: notification.title,
          body: notification.body,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, checked: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 4.3 send-upcoming-transactions

Notifica sobre transacciones programadas para manana.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
// IMPORTANTE: Reemplazar con tu Firebase Project ID
const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/TU_FIREBASE_PROJECT_ID/messages:send';

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return base64UrlEncode(encoder.encode(str));
}

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

  const headerB64 = stringToBase64Url(JSON.stringify(header));
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = SERVICE_ACCOUNT.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    console.log(`[UpcomingTransactions] Checking for transactions on ${tomorrowISO}`);

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('is_active', true)
      .eq('preferences->scheduled_transactions', true);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;
    const accessToken = await getAccessToken();

    for (const token of tokens) {
      const prefs = token.preferences;
      if (prefs?.quiet_hours?.enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const { start, end } = prefs.quiet_hours;
        const inQuietHours = start > end
          ? (currentTime >= start || currentTime < end)
          : (currentTime >= start && currentTime < end);
        if (inQuietHours) continue;
      }

      const { data: userState } = await supabase
        .from('user_state')
        .select('state')
        .eq('user_id', token.user_id)
        .single();

      if (!userState?.state?.transactions) continue;

      // La app guarda todas las transacciones en state.transactions
      // Las programadas/pendientes tienen status: 'scheduled' o 'pending'
      const upcomingTransactions = userState.state.transactions.filter(
        (t: { date: string; status?: string }) =>
          t.date === tomorrowISO && (t.status === 'scheduled' || t.status === 'pending')
      );

      if (upcomingTransactions.length === 0) continue;

      let notification;
      if (upcomingTransactions.length === 1) {
        const t = upcomingTransactions[0];
        const statusText = t.status === 'pending' ? 'pendiente' : 'programada';
        notification = {
          title: `Transaccion ${statusText} manana`,
          body: `${t.name}: $${t.amount.toLocaleString('es-CO')}`,
        };
      } else {
        const total = upcomingTransactions.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
        notification = {
          title: `${upcomingTransactions.length} transacciones manana`,
          body: `Total: $${total.toLocaleString('es-CO')}`,
        };
      }

      const response = await fetch(FCM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: token.token,
            notification,
            data: { type: 'upcoming_transaction_scheduled' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      });

      if (response.ok) {
        sentCount++;
        await supabase.from('notification_history').insert({
          user_id: token.user_id,
          token_id: token.id,
          notification_type: 'upcoming_transaction_scheduled',
          title: notification.title,
          body: notification.body,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, checked: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 4.4 send-daily-summary

Envia resumen diario si hubo actividad.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
// IMPORTANTE: Reemplazar con tu Firebase Project ID
const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/TU_FIREBASE_PROJECT_ID/messages:send';

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return base64UrlEncode(encoder.encode(str));
}

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

  const headerB64 = stringToBase64Url(JSON.stringify(header));
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = SERVICE_ACCOUNT.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    const todayISO = now.toISOString().split('T')[0];

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('is_active', true)
      .eq('preferences->daily_summary->enabled', true)
      .eq('preferences->daily_summary->time', currentTime);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;
    const accessToken = await getAccessToken();

    for (const token of tokens) {
      const { data: userState } = await supabase
        .from('user_state')
        .select('state')
        .eq('user_id', token.user_id)
        .single();

      if (!userState?.state?.transactions) continue;

      const todayTransactions = userState.state.transactions.filter(
        (t: { date: string }) => t.date === todayISO
      );

      if (todayTransactions.length === 0) continue;

      const expenses = todayTransactions
        .filter((t: { type: string }) => t.type === 'expense')
        .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

      const income = todayTransactions
        .filter((t: { type: string }) => t.type === 'income')
        .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

      const notification = {
        title: 'Resumen del dia',
        body: `Gastos: $${expenses.toLocaleString('es-CO')} | Ingresos: $${income.toLocaleString('es-CO')}`,
      };

      const response = await fetch(FCM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: token.token,
            notification,
            data: { type: 'daily_summary' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      });

      if (response.ok) {
        sentCount++;
        await supabase.from('notification_history').insert({
          user_id: token.user_id,
          token_id: token.id,
          notification_type: 'daily_summary',
          title: notification.title,
          body: notification.body,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Paso 5: Configurar Cron Jobs (pg_cron + pg_net)

Usa las extensiones `pg_cron` y `pg_net` de Supabase para programar las notificaciones directamente desde la base de datos.

### Prerequisitos

1. Habilitar extensiones en **Database → Extensions**:
   - **pg_cron** (schema: `extensions`)
   - **pg_net** (schema: `extensions`)

2. Obtener el **Service Role Key**: Supabase Dashboard → Project Settings → API → `service_role` (NO `anon`)

> **IMPORTANTE:** Verifica que el Supabase Project ID (Reference ID) sea correcto. Lo encuentras en Project Settings → General. Un typo en el hostname causara error "Couldn't resolve host name".

### Crear los 4 cron jobs

Ejecutar en **SQL Editor** (reemplazar `TU_SUPABASE_PROJECT_ID` y `TU_SERVICE_ROLE_KEY`):

```sql
-- =====================================================
-- CRON JOBS PARA PUSH NOTIFICATIONS
-- =====================================================
-- Todos los tiempos estan en UTC
-- Colombia es UTC-5 (ej: 9:00 AM COL = 14:00 UTC)

-- 1. Upcoming transactions: 9:00 AM Colombia (14:00 UTC)
SELECT cron.schedule(
  'send-upcoming-transactions',
  '0 14 * * *',
  $$SELECT net.http_post(
    url := 'https://TU_SUPABASE_PROJECT_ID.supabase.co/functions/v1/send-upcoming-transactions',
    headers := '{"Authorization": "Bearer TU_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )$$
);

-- 2. Daily reminder: cada minuto (busca coincidencia con hora configurada del usuario)
SELECT cron.schedule(
  'send-daily-reminders',
  '* * * * *',
  $$SELECT net.http_post(
    url := 'https://TU_SUPABASE_PROJECT_ID.supabase.co/functions/v1/send-daily-reminder',
    headers := '{"Authorization": "Bearer TU_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )$$
);

-- 3. Daily summary: cada minuto (busca coincidencia con hora configurada del usuario)
SELECT cron.schedule(
  'send-daily-summary',
  '* * * * *',
  $$SELECT net.http_post(
    url := 'https://TU_SUPABASE_PROJECT_ID.supabase.co/functions/v1/send-daily-summary',
    headers := '{"Authorization": "Bearer TU_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )$$
);
```

### Comandos utiles para cron jobs

```sql
-- Ver todos los cron jobs
SELECT * FROM cron.job;

-- Eliminar un cron job especifico
SELECT cron.unschedule('nombre-del-job');

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Ver respuestas HTTP de pg_net (para debug)
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;

-- Probar manualmente que pg_net puede resolver el hostname
SELECT net.http_get('https://TU_SUPABASE_PROJECT_ID.supabase.co');
-- Esperar unos segundos y verificar:
SELECT status_code, error_msg FROM net._http_response ORDER BY created DESC LIMIT 1;
```

### Troubleshooting: "Couldn't resolve host name"

Si pg_net devuelve este error:

1. **Verificar el Project ID** - El error mas comun es un typo en el hostname. Copia el Reference ID directamente desde Project Settings → General
2. **Probar resolucion DNS** - Ejecutar `SELECT net.http_get('https://www.google.com/');` y verificar en `net._http_response` que devuelve `status_code: 200`
3. **Verificar que pg_net worker esta activo** - `SELECT * FROM pg_stat_activity WHERE backend_type LIKE '%net%';`

---

## Paso 6: Verificacion

### Checklist final:

- [ ] Tablas `push_tokens` y `notification_history` creadas con RLS policies
- [ ] Extensiones `pg_cron` y `pg_net` habilitadas (schema: `extensions`)
- [ ] Secret `FIREBASE_SERVICE_ACCOUNT` configurado en Edge Functions
- [ ] 5 Edge Functions desplegadas con el **Firebase Project ID** correcto en `FCM_ENDPOINT`
- [ ] 4 Cron jobs creados con el **Supabase Project ID** correcto (verificar que no haya typo!)
- [ ] Service Role Key correcta en los headers de los cron jobs

### Prueba rapida:

1. Registrar token desde la app (ir a Perfil → Notificaciones → Activar)
2. Verificar que aparece en `push_tokens`
3. Invocar `send-test-notification` con body `{}`
4. Verificar que llega la notificacion al dispositivo

---

## Valores a reemplazar

| Placeholder | Descripcion | Donde encontrarlo |
|-------------|-------------|-------------------|
| `TU_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | Firebase Console → Project Settings |
| `TU_SUPABASE_PROJECT_ID` | Reference ID de Supabase | Supabase Dashboard → Project Settings → General |
| `TU_SERVICE_ROLE_KEY` | Service Role Key de Supabase | Supabase Dashboard → Project Settings → API → `service_role` |

> **CUIDADO:** Copia el Supabase Project ID directamente del dashboard. Un solo caracter mal causa "Couldn't resolve host name" en pg_net.

---

## Troubleshooting

### No llegan notificaciones

1. Verificar que el token existe en `push_tokens` con `is_active = true`
2. Verificar logs de Edge Function en Supabase Dashboard
3. Verificar que el FCM endpoint tiene el project ID correcto
4. Verificar que `FIREBASE_SERVICE_ACCOUNT` esta configurado

### Error de autenticacion FCM

- Verificar que el JSON del service account es valido
- Verificar que el `client_email` tiene permisos de Firebase Messaging

### Cron jobs no se ejecutan

1. Verificar que `pg_cron` y `pg_net` estan habilitados en Database → Extensions
2. Verificar que los jobs existen: `SELECT * FROM cron.job;`
3. Ver historial de ejecuciones: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
4. Ver respuestas HTTP: `SELECT status_code, error_msg FROM net._http_response ORDER BY created DESC LIMIT 10;`

### Error "Couldn't resolve host name" en pg_net

El problema mas comun es un **typo en el Supabase Project ID** (Reference ID). Para diagnosticar:

```sql
-- 1. Probar que pg_net puede hacer requests HTTP externos
SELECT net.http_get('https://www.google.com/');
-- Esperar 5 segundos, luego:
SELECT status_code, error_msg FROM net._http_response ORDER BY created DESC LIMIT 1;
-- Si status_code = 200, pg_net funciona bien

-- 2. Probar el hostname de tu proyecto
SELECT net.http_get('https://TU_SUPABASE_PROJECT_ID.supabase.co');
-- Si da "Couldn't resolve host name", el Project ID tiene un typo
-- Copia el ID directamente desde Project Settings → General
```
