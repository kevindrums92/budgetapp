-- =====================================================
-- DEPLOY PUSH NOTIFICATIONS TO PRODUCTION
-- =====================================================
-- Ejecuta este script completo en el SQL Editor de Supabase (producción)
--
-- IMPORTANTE: Verifica que NO existan estas tablas/funciones antes de ejecutar
-- Si ya existen, ajusta el script según sea necesario

-- =====================================================
-- PASO 1: Crear tablas base y tipos
-- =====================================================
-- Archivo: 20260128_create_push_notifications_tables.sql

-- Enum for platforms
CREATE TYPE platform_type AS ENUM ('ios', 'android');

-- Main tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform platform_type NOT NULL,
  device_info JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{
    "scheduled_transactions": true,
    "daily_reminder": {
      "enabled": false,
      "time": "20:00"
    },
    "daily_summary": {
      "enabled": false,
      "time": "20:00"
    },
    "quiet_hours": {
      "enabled": false,
      "start": "23:59",
      "end": "00:00"
    }
  }',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one token per device
  CONSTRAINT unique_token UNIQUE (token)
);

-- Indexes for performance
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_push_tokens_user_active ON push_tokens(user_id, is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view their own tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Enum for notification status
CREATE TYPE notification_status AS ENUM ('sent', 'delivered', 'clicked', 'failed');

-- Enum for notification types
CREATE TYPE notification_type AS ENUM (
  'daily_reminder',
  'upcoming_transaction_scheduled',
  'upcoming_transaction_pending',
  'upcoming_transactions_multiple',
  'daily_summary'
);

-- History table
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES push_tokens(id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status notification_status DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_status ON notification_history(status);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX idx_notification_history_type ON notification_history(notification_type);

-- RLS Policies
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification history
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for push_tokens
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE push_tokens IS 'Stores FCM tokens for push notifications on iOS and Android devices';
COMMENT ON COLUMN push_tokens.token IS 'FCM registration token from Firebase';
COMMENT ON COLUMN push_tokens.platform IS 'Device platform: ios or android';
COMMENT ON COLUMN push_tokens.preferences IS 'User notification preferences (which types to receive, quiet hours, etc.)';
COMMENT ON COLUMN push_tokens.is_active IS 'Whether this token is still valid and should receive notifications';

COMMENT ON TABLE notification_history IS 'Tracks all push notifications sent to users';
COMMENT ON COLUMN notification_history.notification_type IS 'Type of notification sent';
COMMENT ON COLUMN notification_history.status IS 'Current status: sent, delivered, clicked, or failed';
COMMENT ON COLUMN notification_history.data IS 'Additional payload data sent with the notification';

-- =====================================================
-- PASO 2: Actualizar quiet hours default
-- =====================================================
-- Archivo: 20260128_update_quiet_hours_default.sql

-- Update all records that still have the old default quiet hours values
UPDATE push_tokens
SET preferences = jsonb_set(
  jsonb_set(
    preferences,
    '{quiet_hours,start}',
    '"23:59"'::jsonb
  ),
  '{quiet_hours,end}',
  '"00:00"'::jsonb
)
WHERE
  -- Only update records that have the old default values
  (preferences->'quiet_hours'->>'start' = '22:00'
   AND (preferences->'quiet_hours'->>'end' = '08:00' OR preferences->'quiet_hours'->>'end' = '06:00'))
  -- And quiet hours are disabled (user hasn't configured them)
  AND (preferences->'quiet_hours'->>'enabled')::boolean = false;

-- =====================================================
-- PASO 3: Arreglar RLS policies
-- =====================================================
-- Archivo: 20260128_fix_push_tokens_rls.sql

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON push_tokens;

-- Recreate SELECT policy to allow viewing any token
-- This is necessary for upsert to work (needs to check for conflicts)
-- Security is still maintained via UPDATE/INSERT WITH CHECK clauses
CREATE POLICY "Users can view any token"
  ON push_tokens FOR SELECT
  USING (true);

-- Recreate INSERT policy
CREATE POLICY "Users can insert their own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recreate UPDATE policy to allow taking over tokens from other users
-- This is necessary because FCM tokens are device-specific, not user-specific
-- When a user logs in on a device previously used by another user,
-- the same FCM token needs to be reassigned to the new user
CREATE POLICY "Users can update their own tokens"
  ON push_tokens FOR UPDATE
  USING (true)  -- Allow checking any token (needed for upsert on conflict)
  WITH CHECK (auth.uid() = user_id);  -- But only if the new user_id matches the authenticated user

-- =====================================================
-- PASO 4: Función refresh_push_token
-- =====================================================
-- Archivo: 20260128_fix_upsert_preserve_preferences.sql

CREATE OR REPLACE FUNCTION refresh_push_token(
  p_user_id UUID,
  p_token TEXT,
  p_platform platform_type,
  p_device_info JSONB
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Update existing token record (bypasses RLS)
  UPDATE push_tokens
  SET
    user_id = p_user_id,
    platform = p_platform,
    device_info = p_device_info,
    is_active = true,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE token = p_token
  RETURNING id INTO v_token_id;

  -- If token doesn't exist, insert with defaults
  IF v_token_id IS NULL THEN
    INSERT INTO push_tokens (
      user_id,
      token,
      platform,
      device_info,
      preferences,
      is_active,
      last_used_at
    )
    VALUES (
      p_user_id,
      p_token,
      p_platform,
      p_device_info,
      '{"quiet_hours":{"end":"00:00","start":"23:59","enabled":false},"daily_summary":{"time":"20:00","enabled":false},"daily_reminder":{"time":"20:00","enabled":false},"scheduled_transactions":true}'::jsonb,
      true,
      NOW()
    )
    RETURNING id INTO v_token_id;
  END IF;

  RETURN v_token_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_push_token(UUID, TEXT, platform_type, JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION refresh_push_token IS 'Refreshes a push token metadata (user_id, platform, device_info) WITHOUT touching preferences. Used for token refresh on app restart.';

-- =====================================================
-- PASO 5: Función upsert_push_token (FINAL)
-- =====================================================
-- Archivo: 20260128_upsert_push_token_final.sql

CREATE OR REPLACE FUNCTION upsert_push_token(
  p_user_id UUID,
  p_token TEXT,
  p_platform platform_type,
  p_device_info JSONB,
  p_preferences JSONB
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Upsert the token (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO push_tokens (
    user_id,
    token,
    platform,
    device_info,
    preferences,
    is_active,
    last_used_at
  )
  VALUES (
    p_user_id,
    p_token,
    p_platform,
    p_device_info,
    p_preferences,
    true,
    NOW()
  )
  ON CONFLICT (token)
  DO UPDATE SET
    user_id = p_user_id,
    platform = p_platform,
    device_info = p_device_info,
    preferences = p_preferences,
    is_active = true,
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_push_token(UUID, TEXT, platform_type, JSONB, JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION upsert_push_token IS 'Upserts a push token, allowing token transfer between users on the same device. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- PASO 6: Setup cron jobs (OPCIONAL - solo si tienes pg_cron habilitado)
-- =====================================================
-- Archivo: 20260128_setup_notification_cron_jobs.sql
--
-- NOTA: Esto requiere que la extensión pg_cron esté habilitada en Supabase
-- Solo ejecuta esta sección si tienes Edge Functions deployadas

-- Enable pg_cron extension (skip if already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reminder notifications (12:00 UTC = 20:00 Colombia)
-- SELECT cron.schedule(
--   'send-daily-reminder',
--   '0 12 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminder',
--     headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- Schedule daily summary notifications (00:00 UTC = 20:00 Colombia previous day)
-- SELECT cron.schedule(
--   'send-daily-summary',
--   '0 0 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-summary',
--     headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- Schedule upcoming transactions notifications (00:01 UTC daily)
-- SELECT cron.schedule(
--   'send-upcoming-transactions',
--   '1 0 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-upcoming-transactions',
--     headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las funciones existen
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('upsert_push_token', 'refresh_push_token', 'update_updated_at_column');

-- Verificar estructura de la tabla
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'push_tokens'
ORDER BY ordinal_position;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Push Notifications deployment complete!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy Edge Functions (send-daily-reminder, send-daily-summary, send-upcoming-transactions)';
  RAISE NOTICE '2. Configure FIREBASE_SERVICE_ACCOUNT secret in Edge Functions settings';
  RAISE NOTICE '3. Test push notification registration from the app';
END $$;
