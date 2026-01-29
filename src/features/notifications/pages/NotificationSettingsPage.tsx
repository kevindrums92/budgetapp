/**
 * Notification Settings Page
 *
 * Allows users to configure their push notification preferences:
 * - Enable/disable notification types
 * - Set daily reminder time
 * - Set daily summary time
 * - Configure quiet hours
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Calendar, Clock, Moon, TrendingUp } from 'lucide-react';
import PageHeader from '@/shared/components/layout/PageHeader';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { NotificationPreferences } from '@/types/notifications';

// Helper: Convert UTC time to local time for display
function convertUTCToLocal(timeUTC: string): string {
  const [hours, minutes] = timeUTC.split(':').map(Number);
  const now = new Date();
  now.setUTCHours(hours, minutes, 0, 0);
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Helper: Convert local time to UTC for storage
function convertLocalToUTC(timeLocal: string): string {
  const [hours, minutes] = timeLocal.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
}

export default function NotificationSettingsPage() {
  const { t } = useTranslation('notifications');
  const {
    isAvailable,
    permissionStatus,
    preferences,
    isLoading,
    requestPermission,
    updatePrefs,
  } = usePushNotifications();

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with server preferences (convert UTC to local for display)
  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        ...preferences,
        daily_reminder: {
          ...preferences.daily_reminder,
          time: convertUTCToLocal(preferences.daily_reminder.time),
        },
        daily_summary: {
          ...preferences.daily_summary,
          time: convertUTCToLocal(preferences.daily_summary.time),
        },
        quiet_hours: {
          ...preferences.quiet_hours,
          start: convertUTCToLocal(preferences.quiet_hours.start),
          end: convertUTCToLocal(preferences.quiet_hours.end),
        },
      });
    }
  }, [preferences]);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!localPrefs) return;

    const newPrefs = { ...localPrefs, [key]: value };
    setLocalPrefs(newPrefs);

    setIsSaving(true);
    await updatePrefs({ [key]: value });
    setIsSaving(false);
  };

  const handleNestedToggle = async (
    parentKey: 'daily_reminder' | 'daily_summary' | 'quiet_hours',
    enabled: boolean
  ) => {
    if (!localPrefs) return;

    // Update local state with the new enabled value
    const newLocalPrefs = {
      ...localPrefs,
      [parentKey]: { ...localPrefs[parentKey], enabled },
    };
    setLocalPrefs(newLocalPrefs);

    // Convert time fields to UTC before sending to server
    let serverPrefs: any;
    if (parentKey === 'quiet_hours') {
      serverPrefs = {
        enabled,
        start: convertLocalToUTC(localPrefs.quiet_hours.start),
        end: convertLocalToUTC(localPrefs.quiet_hours.end),
      };
    } else {
      // daily_reminder or daily_summary
      serverPrefs = {
        enabled,
        time: convertLocalToUTC(localPrefs[parentKey].time),
      };
    }

    setIsSaving(true);
    await updatePrefs({ [parentKey]: serverPrefs });
    setIsSaving(false);
  };

  const handleTimeChange = async (
    parentKey: 'daily_reminder' | 'daily_summary',
    time: string
  ) => {
    if (!localPrefs) return;

    // Update local state with the local time (for immediate UI feedback)
    const newLocalPrefs = {
      ...localPrefs,
      [parentKey]: { ...localPrefs[parentKey], time },
    };
    setLocalPrefs(newLocalPrefs);

    // Convert to UTC before sending to server
    const timeUTC = convertLocalToUTC(time);
    const newServerPrefs = {
      ...localPrefs[parentKey],
      time: timeUTC,
    };

    setIsSaving(true);
    await updatePrefs({ [parentKey]: newServerPrefs });
    setIsSaving(false);
  };

  const handleQuietHoursChange = async (field: 'start' | 'end', time: string) => {
    if (!localPrefs) return;

    // Update local state with the local time (for immediate UI feedback)
    const newLocalQuietHours = { ...localPrefs.quiet_hours, [field]: time };
    const newLocalPrefs = { ...localPrefs, quiet_hours: newLocalQuietHours };
    setLocalPrefs(newLocalPrefs);

    // Convert to UTC before sending to server
    const timeUTC = convertLocalToUTC(time);
    const newServerQuietHours = { ...localPrefs.quiet_hours, [field]: timeUTC };

    setIsSaving(true);
    await updatePrefs({ quiet_hours: newServerQuietHours });
    setIsSaving(false);
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  // Not available on this platform
  if (!isAvailable) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        <PageHeader title={t('title')} />

        <div className="flex-1 px-4 pt-6 pb-8">
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('unavailable.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('unavailable.description')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission not granted
  if (permissionStatus !== 'granted' && permissionStatus !== 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        <PageHeader title={t('title')} />

        <div className="flex-1 px-4 pt-6 pb-8">
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950">
              <Bell className="h-8 w-8 text-teal-500 dark:text-teal-400" />
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('permissionRequest.title')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('permissionRequest.description')}
            </p>

            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="mt-6 w-full rounded-2xl bg-teal-500 dark:bg-teal-600 py-4 text-base font-semibold text-white transition-colors hover:bg-teal-600 dark:hover:bg-teal-700 active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-700"
            >
              {isLoading ? t('permissionRequest.buttonLoading') : t('permissionRequest.button')}
            </button>

            {permissionStatus === 'denied' && (
              <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                {t('permissionRequest.permissionDenied')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !localPrefs) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        <PageHeader title={t('title')} />

        <div className="flex-1 px-4 pt-6 pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <PageHeader
        title={t('title')}
        rightActions={
          isSaving ? (
            <span className="text-xs text-gray-400 dark:text-gray-500">{t('saving')}</span>
          ) : null
        }
      />

      <div className="flex-1 px-4 pt-6 pb-8 space-y-4">
        {/* Transacciones programadas */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-50">{t('notifications.scheduledTransactions.title')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('notifications.scheduledTransactions.description')}
              </p>
            </div>
            <Toggle
              enabled={localPrefs.scheduled_transactions}
              onChange={(v) => handleToggle('scheduled_transactions', v)}
            />
          </div>
        </div>

        {/* Recordatorio diario */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
              <Bell className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-50">{t('notifications.dailyReminder.title')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('notifications.dailyReminder.description')}
              </p>
            </div>
            <Toggle
              enabled={localPrefs.daily_reminder.enabled}
              onChange={(v) => handleNestedToggle('daily_reminder', v)}
            />
          </div>

          {localPrefs.daily_reminder.enabled && (
            <div className="mt-4 flex items-center gap-3 pl-13">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('notifications.dailyReminder.timeLabel')}</span>
              <input
                type="time"
                value={localPrefs.daily_reminder.time}
                onChange={(e) => handleTimeChange('daily_reminder', e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-50"
              />
            </div>
          )}
        </div>

        {/* Resumen diario */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950">
              <TrendingUp className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-50">{t('notifications.dailySummary.title')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('notifications.dailySummary.description')}
              </p>
            </div>
            <Toggle
              enabled={localPrefs.daily_summary.enabled}
              onChange={(v) => handleNestedToggle('daily_summary', v)}
            />
          </div>

          {localPrefs.daily_summary.enabled && (
            <div className="mt-4 flex items-center gap-3 pl-13">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('notifications.dailySummary.timeLabel')}</span>
              <input
                type="time"
                value={localPrefs.daily_summary.time}
                onChange={(e) => handleTimeChange('daily_summary', e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-50"
              />
            </div>
          )}
        </div>

        {/* Horas de silencio */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-50">{t('notifications.quietHours.title')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('notifications.quietHours.description')}
              </p>
            </div>
            <Toggle
              enabled={localPrefs.quiet_hours.enabled}
              onChange={(v) => handleNestedToggle('quiet_hours', v)}
            />
          </div>

          {localPrefs.quiet_hours.enabled && (
            <div className="mt-4 space-y-3 pl-13">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{t('notifications.quietHours.startLabel')}</span>
                <input
                  type="time"
                  value={localPrefs.quiet_hours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-50"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{t('notifications.quietHours.endLabel')}</span>
                <input
                  type="time"
                  value={localPrefs.quiet_hours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Info text */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
          {t('info')}
        </p>
      </div>
    </div>
  );
}

// Toggle Switch Component
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-all duration-200 ${
        enabled ? 'bg-teal-500 dark:bg-teal-600' : 'bg-gray-300 dark:bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
