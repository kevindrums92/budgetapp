/**
 * useLogin Hook
 * Login flow with device trust check
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthSessionData } from '../types/auth.types';
import {
  signInWithEmail,
  signInWithPhone,
} from '../services/auth.service';
import {
  getDeviceFingerprint,
  checkDeviceTrusted,
} from '../services/device.service';
import { detectIdentifierType, normalizeEmail, validatePhone } from '../services/validation.service';

interface UseLoginReturn {
  login: (identifier: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const identifierType = detectIdentifierType(identifier);

      // Attempt sign in
      const result = identifierType === 'email'
        ? await signInWithEmail(identifier, password)
        : await signInWithPhone(identifier, password);

      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión');
        return;
      }

      // Get device fingerprint and check if trusted
      const fingerprint = await getDeviceFingerprint();
      const isTrusted = result.userId
        ? await checkDeviceTrusted(result.userId, fingerprint)
        : false;

      if (isTrusted) {
        // Device is trusted, skip OTP and go directly to app
        console.log('[useLogin] Trusted device, skipping OTP');
        navigate('/', { replace: true });
      } else {
        // Device not trusted, need OTP verification
        console.log('[useLogin] Untrusted device, redirecting to OTP');

        const sessionData: AuthSessionData = {
          identifier: identifierType === 'email'
            ? normalizeEmail(identifier)
            : validatePhone(identifier).normalized,
          identifierType,
          isNewUser: false,
          userId: result.userId,
        };

        navigate('/onboarding/auth/verify', {
          replace: true,
          state: sessionData,
        });
      }
    } catch (err) {
      console.error('[useLogin] Login error:', err);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}
