/**
 * BiometricGate Component
 *
 * Lifecycle coordinator for biometric authentication.
 * Determines WHEN to show BiometricPrompt based on:
 * - Cold start (app launch)
 * - App resume after 5 minutes inactive
 * - User authentication status
 * - Biometric enabled in settings
 */

import { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useBudgetStore } from '@/state/budget.store';
import BiometricPrompt from './BiometricPrompt';
import { checkBiometricAvailability } from '../services/biometric.service';

const BIOMETRIC_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function BiometricGate() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('faceId');
  const lastAuthRef = useRef<number>(Date.now());

  // Get user and security state
  const user = useBudgetStore((s) => s.user);
  const security = useBudgetStore((s) => s.security);
  const updateLastAuthTimestamp = useBudgetStore((s) => s.updateLastAuthTimestamp);

  const isLoggedIn = Boolean(user.email);
  const biometricEnabled = security?.biometricEnabled ?? false;

  // Check if biometric prompt should be shown
  const shouldShowPrompt = async (): Promise<boolean> => {
    // Only on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('[BiometricGate] Not native platform, skipping');
      return false;
    }

    // Only for authenticated users
    if (!isLoggedIn) {
      console.log('[BiometricGate] User not logged in, skipping');
      return false;
    }

    // Only if biometric is enabled in settings
    if (!biometricEnabled) {
      console.log('[BiometricGate] Biometric not enabled, skipping');
      return false;
    }

    // Check if enough time has passed since last auth
    const now = Date.now();
    const lastAuth = security?.lastAuthTimestamp ?? 0;
    const timeSinceLastAuth = now - lastAuth;

    if (timeSinceLastAuth < BIOMETRIC_TIMEOUT) {
      console.log('[BiometricGate] Last auth was recent, skipping');
      return false;
    }

    // Check if biometric is available
    try {
      console.log('[BiometricGate] Checking biometric availability...');
      const availability = await checkBiometricAvailability();

      if (!availability.isAvailable) {
        console.log('[BiometricGate] Biometric not available, skipping');
        return false;
      }

      setBiometryType(availability.biometryType);
      console.log('[BiometricGate] Showing biometric prompt, type:', availability.biometryType);
      return true;
    } catch (error) {
      console.error('[BiometricGate] Error checking availability:', error);
      return false;
    }
  };

  // Cold start: Check on mount
  useEffect(() => {
    let isMounted = true;

    const checkOnMount = async () => {
      // Small delay to let the app fully initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!isMounted) return;

      const should = await shouldShowPrompt();
      if (isMounted && should) {
        setShowPrompt(true);
      }
    };

    checkOnMount();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // App resume: Check when app comes to foreground
  useEffect(() => {
    let isMounted = true;

    const listener = CapacitorApp.addListener('appStateChange', async (state) => {
      if (!isMounted) return;

      if (state.isActive) {
        console.log('[BiometricGate] App resumed');

        // Check if enough time passed since last check
        const now = Date.now();
        const timeSinceLastCheck = now - lastAuthRef.current;

        if (timeSinceLastCheck < BIOMETRIC_TIMEOUT) {
          console.log('[BiometricGate] App was inactive for less than timeout, skipping');
          return;
        }

        // Update last check time
        lastAuthRef.current = now;

        // Check if we should show prompt
        const should = await shouldShowPrompt();
        if (should) {
          setShowPrompt(true);
        }
      }
    });

    return () => {
      isMounted = false;
      listener.then((l) => l.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, biometricEnabled]); // Re-subscribe when auth state changes

  const handleSuccess = () => {
    console.log('[BiometricGate] Authentication successful');
    updateLastAuthTimestamp();
    lastAuthRef.current = Date.now();
    setShowPrompt(false);
  };

  const handleSkip = () => {
    console.log('[BiometricGate] User skipped biometric auth');
    // Don't update lastAuthTimestamp - will prompt again next time
    setShowPrompt(false);
  };

  return (
    <BiometricPrompt
      open={showPrompt}
      onSuccess={handleSuccess}
      onSkip={handleSkip}
      biometryType={biometryType}
    />
  );
}
