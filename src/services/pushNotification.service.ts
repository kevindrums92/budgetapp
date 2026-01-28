/**
 * Push Notification Service
 *
 * Handles push notification registration, token management, and preferences
 * for iOS and Android native platforms using Firebase Cloud Messaging.
 */

import { FirebaseMessaging, type NotificationActionPerformedEvent } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabaseClient';
import { isNative, getPlatform } from '@/shared/utils/platform';
import type { NotificationPreferences, Platform } from '@/types/notifications';

type NotificationListener = (notification: unknown) => void;
type TokenListener = (token: string) => void;

interface PushNotificationServiceState {
  token: string | null;
  isInitialized: boolean;
  permissionGranted: boolean;
}

const state: PushNotificationServiceState = {
  token: null,
  isInitialized: false,
  permissionGranted: false,
};

const listeners: {
  notification: NotificationListener[];
  token: TokenListener[];
  cleanup: Array<() => void>;
} = {
  notification: [],
  token: [],
  cleanup: [],
};

/**
 * Initialize the push notification service
 * Only works on native platforms (iOS/Android)
 */
export async function initializePushNotifications(): Promise<boolean> {
  if (!isNative()) {
    console.log('[PushNotification] Skipping - not a native platform');
    return false;
  }

  if (state.isInitialized) {
    console.log('[PushNotification] Already initialized');
    return state.permissionGranted;
  }

  try {
    // Check current permission status
    const permissionStatus = await FirebaseMessaging.checkPermissions();
    console.log('[PushNotification] Permission status:', permissionStatus.receive);

    if (permissionStatus.receive === 'granted') {
      state.permissionGranted = true;
      await registerAndSaveToken();
      setupListeners();
      state.isInitialized = true;
      return true;
    }

    // Permission not yet granted - don't request automatically
    // Let the UI request when appropriate
    state.isInitialized = true;
    return false;
  } catch (error) {
    console.error('[PushNotification] Initialization failed:', error);
    return false;
  }
}

/**
 * Request push notification permissions from the user
 * Call this from UI when user explicitly enables notifications
 */
export async function requestPermissions(): Promise<boolean> {
  if (!isNative()) {
    console.log('[PushNotification] Skipping permission request - not native');
    return false;
  }

  try {
    const result = await FirebaseMessaging.requestPermissions();
    state.permissionGranted = result.receive === 'granted';

    console.log('[PushNotification] Permission result:', result.receive);

    if (state.permissionGranted) {
      await registerAndSaveToken();
      setupListeners();
    }

    return state.permissionGranted;
  } catch (error) {
    console.error('[PushNotification] Permission request failed:', error);
    return false;
  }
}

/**
 * Check if push notifications are enabled
 */
export async function checkPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!isNative()) {
    return 'denied';
  }

  try {
    const result = await FirebaseMessaging.checkPermissions();
    return result.receive as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    console.error('[PushNotification] Check permission failed:', error);
    return 'denied';
  }
}

/**
 * Get the current FCM token
 */
export function getToken(): string | null {
  return state.token;
}

/**
 * Register device and get FCM token
 */
async function registerAndSaveToken(): Promise<void> {
  try {
    const result = await FirebaseMessaging.getToken();
    state.token = result.token;

    console.log('[PushNotification] FCM Token obtained');

    // Save token to Supabase
    await saveTokenToBackend(state.token);
  } catch (error) {
    console.error('[PushNotification] Failed to get token:', error);
  }
}

/**
 * Save FCM token to Supabase
 */
async function saveTokenToBackend(token: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[PushNotification] No authenticated user, skipping token save');
      return;
    }

    const platform = getPlatform() as Platform;
    const deviceInfo = getDeviceInfo();

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: user.id,
        token,
        platform,
        device_info: deviceInfo,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      {
        onConflict: 'token',
      }
    );

    if (error) {
      console.error('[PushNotification] Failed to save token:', error);
      return;
    }

    console.log('[PushNotification] Token saved to backend');
  } catch (error) {
    console.error('[PushNotification] saveTokenToBackend error:', error);
  }
}

/**
 * Setup Firebase Messaging listeners
 */
function setupListeners(): void {
  // Notification received (app in foreground)
  FirebaseMessaging.addListener('notificationReceived', (notification) => {
    console.log('[PushNotification] Notification received:', notification);
    listeners.notification.forEach((callback) => callback(notification));
  }).then((handle) => {
    listeners.cleanup.push(() => handle.remove());
  });

  // Notification action (user tapped notification)
  FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
    console.log('[PushNotification] Notification action:', action);
    handleNotificationTap(action);
  }).then((handle) => {
    listeners.cleanup.push(() => handle.remove());
  });

  // Token refreshed
  FirebaseMessaging.addListener('tokenReceived', (event) => {
    console.log('[PushNotification] Token refreshed');
    state.token = event.token;
    saveTokenToBackend(event.token);
    listeners.token.forEach((callback) => callback(event.token));
  }).then((handle) => {
    listeners.cleanup.push(() => handle.remove());
  });
}

/**
 * Handle notification tap - navigate to appropriate screen
 */
function handleNotificationTap(action: NotificationActionPerformedEvent): void {
  const data = action.notification?.data as Record<string, unknown> | undefined;

  if (!data?.type) {
    window.location.href = '/';
    return;
  }

  switch (data.type) {
    case 'daily_reminder':
      window.location.href = '/add';
      break;
    case 'upcoming_transaction_scheduled':
    case 'upcoming_transaction_pending':
    case 'upcoming_transactions_multiple': {
      try {
        sessionStorage.setItem('pending-upcoming-modal', String(data.type));
      } catch { /* ignore */ }
      window.dispatchEvent(
        new CustomEvent('show-upcoming-transactions', {
          detail: { type: data.type },
        })
      );
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      break;
    }
    case 'daily_summary':
      window.location.href = '/stats';
      break;
    default:
      window.location.href = '/';
  }
}

/**
 * Get notification preferences for current device
 */
export async function getPreferences(): Promise<NotificationPreferences | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !state.token) {
      return null;
    }

    const { data, error } = await supabase
      .from('push_tokens')
      .select('preferences')
      .eq('token', state.token)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[PushNotification] Failed to get preferences:', error);
      return null;
    }

    return data?.preferences as NotificationPreferences;
  } catch (error) {
    console.error('[PushNotification] getPreferences error:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[PushNotification] No user to update preferences');
      return false;
    }

    if (!state.token) {
      console.warn('[PushNotification] No token to update preferences');
      return false;
    }

    // Get current preferences and merge
    const currentPrefs = await getPreferences();
    const mergedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    const { error } = await supabase
      .from('push_tokens')
      .update({ preferences: mergedPrefs })
      .eq('token', state.token)
      .eq('user_id', user.id);

    if (error) {
      console.error('[PushNotification] Failed to update preferences:', error);
      return false;
    }

    console.log('[PushNotification] Preferences updated');
    return true;
  } catch (error) {
    console.error('[PushNotification] updatePreferences error:', error);
    return false;
  }
}

/**
 * Deactivate current token (call on logout)
 */
export async function deactivateToken(): Promise<void> {
  try {
    if (!state.token) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('token', state.token)
      .eq('user_id', user.id);

    if (error) {
      console.error('[PushNotification] Failed to deactivate token:', error);
      return;
    }

    console.log('[PushNotification] Token deactivated');
  } catch (error) {
    console.error('[PushNotification] deactivateToken error:', error);
  }
}

/**
 * Update the language stored in device_info for the current token.
 * Call this when the user changes their language preference.
 */
export async function updateTokenLanguage(language: string): Promise<void> {
  try {
    if (!state.token) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Read current device_info, merge language
    const { data } = await supabase
      .from('push_tokens')
      .select('device_info')
      .eq('token', state.token)
      .eq('user_id', user.id)
      .single();

    const currentInfo = (data?.device_info as Record<string, unknown>) || {};
    const updatedInfo = { ...currentInfo, language };

    const { error } = await supabase
      .from('push_tokens')
      .update({ device_info: updatedInfo })
      .eq('token', state.token)
      .eq('user_id', user.id);

    if (error) {
      console.error('[PushNotification] Failed to update language:', error);
      return;
    }

    console.log('[PushNotification] Language updated to:', language);
  } catch (error) {
    console.error('[PushNotification] updateTokenLanguage error:', error);
  }
}

/**
 * Add notification received listener
 */
export function addNotificationListener(callback: NotificationListener): () => void {
  listeners.notification.push(callback);
  return () => {
    const index = listeners.notification.indexOf(callback);
    if (index > -1) {
      listeners.notification.splice(index, 1);
    }
  };
}

/**
 * Add token refresh listener
 */
export function addTokenListener(callback: TokenListener): () => void {
  listeners.token.push(callback);
  return () => {
    const index = listeners.token.indexOf(callback);
    if (index > -1) {
      listeners.token.splice(index, 1);
    }
  };
}

/**
 * Cleanup all listeners (call on app unmount)
 */
export function cleanup(): void {
  listeners.cleanup.forEach((remove) => remove());
  listeners.cleanup = [];
  listeners.notification = [];
  listeners.token = [];
  state.isInitialized = false;
  console.log('[PushNotification] Cleaned up');
}

/**
 * Get device info for token registration
 */
function getDeviceInfo(): Record<string, unknown> {
  return {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    language: localStorage.getItem('app_language') || 'es',
    registeredAt: new Date().toISOString(),
  };
}

/**
 * Check if push notifications are available on this platform
 */
export function isPushAvailable(): boolean {
  return isNative();
}

/**
 * Check if push notifications are fully enabled (permission + token)
 */
export function isPushEnabled(): boolean {
  return state.permissionGranted && state.token !== null;
}
