/**
 * Push Notifications Types
 */

export type NotificationType =
  | 'daily_reminder'
  | 'upcoming_transaction_scheduled'
  | 'upcoming_transaction_pending'
  | 'upcoming_transactions_multiple'
  | 'daily_summary';

export type NotificationStatus = 'sent' | 'delivered' | 'clicked' | 'failed';

export type Platform = 'ios' | 'android';

export interface DailyReminderPreference {
  enabled: boolean;
  time: string; // "HH:mm" format, e.g., "20:00"
}

export interface DailySummaryPreference {
  enabled: boolean;
  time: string; // "HH:mm" format, e.g., "20:00"
}

export interface QuietHoursPreference {
  enabled: boolean;
  start: string; // "HH:mm" format, e.g., "22:00"
  end: string; // "HH:mm" format, e.g., "08:00"
}

export interface NotificationPreferences {
  scheduled_transactions: boolean;
  daily_reminder: DailyReminderPreference;
  daily_summary: DailySummaryPreference;
  quiet_hours: QuietHoursPreference;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: Platform;
  device_info: Record<string, unknown>;
  preferences: NotificationPreferences;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string;
}

export interface NotificationHistoryEntry {
  id: string;
  user_id: string;
  token_id: string | null;
  notification_type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
  clicked_at: string | null;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  scheduled_transactions: true,
  daily_reminder: {
    enabled: false,
    time: '20:00',
  },
  daily_summary: {
    enabled: false,
    time: '20:00',
  },
  quiet_hours: {
    enabled: false,
    start: '23:59',
    end: '00:00',
  },
};
