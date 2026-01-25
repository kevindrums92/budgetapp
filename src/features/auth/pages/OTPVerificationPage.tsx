/**
 * OTPVerificationPage
 * OTP verification after login/register
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2 } from 'lucide-react';

import OTPInput from '../components/OTPInput';
import TrustDevicePrompt from '../components/TrustDevicePrompt';
import { useOTPVerification } from '../hooks/useOTPVerification';
import { getDeviceFingerprint, trustDevice } from '../services/device.service';
import { maskEmail, maskPhone } from '../services/validation.service';
import { getCurrentUser } from '../services/auth.service';
import type { AuthSessionData, OTPType } from '../types/auth.types';

export default function OTPVerificationPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const location = useLocation();

  // Get session data from navigation state
  const sessionData = location.state as AuthSessionData | undefined;

  const otp = useOTPVerification();
  const [showTrustPrompt, setShowTrustPrompt] = useState(false);
  const [isTrusting, setIsTrusting] = useState(false);

  // Redirect if no session data
  useEffect(() => {
    if (!sessionData) {
      console.warn('[OTPVerificationPage] No session data, redirecting');
      navigate('/onboarding/auth', { replace: true });
    }
  }, [sessionData, navigate]);

  if (!sessionData) {
    return null;
  }

  const { identifier, identifierType, isNewUser } = sessionData;
  const otpType: OTPType = identifierType === 'email' ? 'email' : 'sms';

  // Masked identifier for display
  const maskedIdentifier =
    identifierType === 'email' ? maskEmail(identifier) : maskPhone(identifier);

  // Handle verify
  const handleVerify = async () => {
    const success = await otp.verify(identifier, otpType);

    if (success) {
      // Show trust device prompt
      setShowTrustPrompt(true);
    }
  };

  // Handle trust device
  const handleTrustDevice = async () => {
    setIsTrusting(true);

    try {
      const fingerprint = await getDeviceFingerprint();
      const user = await getCurrentUser();

      if (user) {
        await trustDevice(user.id, fingerprint);
      }
    } catch (err) {
      console.error('[OTPVerificationPage] Trust device error:', err);
    }

    completeAuth();
  };

  // Handle skip trust
  const handleSkipTrust = () => {
    completeAuth();
  };

  // Complete authentication and navigate to app
  const completeAuth = () => {
    setIsTrusting(false);
    setShowTrustPrompt(false);

    // Navigate to first config if new user, otherwise to app
    if (isNewUser) {
      navigate('/onboarding/config/1', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Handle resend
  const handleResend = async () => {
    await otp.resend(identifier, otpType);
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Progress bar at top */}
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-800">
        <div className="h-full w-1/3 bg-[#18B7B0] transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center px-6 pt-12 pb-32">
        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/10">
          <KeyRound className="h-10 w-10 text-[#18B7B0]" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('auth.verify.title', 'Verifica tu identidad')}
        </h1>

        {/* Subtitle */}
        <p className="mb-8 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.verify.message', 'Ingresa el código de 6 dígitos que enviamos a')}{' '}
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {maskedIdentifier}
          </span>
        </p>

        {/* OTP Input */}
        <div className="mb-6">
          <OTPInput
            digits={otp.digits}
            onDigitChange={otp.setDigit}
            disabled={otp.isVerifying}
            error={!!otp.error}
          />
        </div>

        {/* Error message */}
        {otp.error && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            {otp.error}
          </p>
        )}

        {/* Resend link */}
        <div className="text-center">
          {otp.canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-medium text-[#18B7B0] hover:underline"
            >
              {t('auth.verify.resend', 'Reenviar código')}
            </button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.verify.resendIn', { seconds: otp.resendCooldown })}
            </p>
          )}
        </div>
      </div>

      {/* Verify button */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-gray-950 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handleVerify}
          disabled={!otp.isComplete || otp.isVerifying}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {otp.isVerifying ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t('auth.verify.button', 'Verificar y entrar')
          )}
        </button>
      </div>

      {/* Trust Device Prompt */}
      <TrustDevicePrompt
        open={showTrustPrompt}
        onTrust={handleTrustDevice}
        onSkip={handleSkipTrust}
        isLoading={isTrusting}
      />
    </div>
  );
}
