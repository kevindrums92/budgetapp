/**
 * ResetPasswordPage
 * Página para ingresar nueva contraseña después de seguir el link de reset
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import { updatePassword } from '../services/auth.service';
import { validatePassword } from '../services/validation.service';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  // Verificar que el usuario tenga una sesión válida (link seguido)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        console.warn('[ResetPasswordPage] No valid session, invalid/expired link');
        setValidSession(false);
      } else {
        console.log('[ResetPasswordPage] Valid session for password reset');
        setValidSession(true);
      }
    };

    checkSession();
  }, []);

  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = validation.isValid && passwordsMatch && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    const result = await updatePassword(password);

    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      // Redirigir al login después de 2s
      setTimeout(() => {
        navigate('/onboarding/login', { replace: true });
      }, 2000);
    } else {
      setError(result.error || 'Error al actualizar la contraseña');
    }
  };

  // Loading state mientras verifica sesión
  if (validSession === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Link inválido o expirado
  if (validSession === false) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('auth.resetPassword.invalidLink', 'Link inválido o expirado')}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.resetPassword.requestNew', 'Solicita un nuevo link de recuperación desde el login')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/onboarding/login', { replace: true })}
          className="rounded-xl bg-[#18B7B0] px-6 py-3 text-sm font-medium text-white hover:bg-[#16a5a0]"
        >
          {t('auth.resetPassword.backToLogin', 'Volver al login')}
        </button>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('auth.resetPassword.success', '¡Contraseña actualizada!')}
        </h1>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.resetPassword.redirecting', 'Redirigiendo al login...')}
        </p>
      </div>
    );
  }

  // Form
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-800">
        <div className="h-full w-2/3 bg-[#18B7B0] transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center px-6 pt-12">
        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/10">
          <KeyRound className="h-10 w-10 text-[#18B7B0]" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('auth.resetPassword.title', 'Nueva contraseña')}
        </h1>

        {/* Subtitle */}
        <p className="mb-8 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.resetPassword.message', 'Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres')}
        </p>

        {/* Password Input */}
        <div className="w-full max-w-sm mb-4">
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder={t('auth.fields.password', 'Contraseña')}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword(!showPassword)}
            showStrength
          />
        </div>

        {/* Confirm Password Input */}
        <div className="w-full max-w-sm mb-4">
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t('auth.resetPassword.confirmPassword', 'Confirmar contraseña')}
            showPassword={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
            showStrength={false}
          />
        </div>

        {/* Passwords don't match error */}
        {confirmPassword && !passwordsMatch && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            {t('auth.resetPassword.passwordsDontMatch', 'Las contraseñas no coinciden')}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t('auth.resetPassword.button', 'Actualizar contraseña')
          )}
        </button>
      </div>
    </div>
  );
}
