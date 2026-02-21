import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Gift, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { refreshSubscription } from '@/services/subscription.service';
import { useBudgetStore } from '@/state/budget.store';

type PromoCodeSheetProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCode?: string;
};

export default function PromoCodeSheet({ open, onClose, onSuccess, initialCode = '' }: PromoCodeSheetProps) {
  const { t } = useTranslation('paywall');
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialCode when it changes (deep link)
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setStatus('idle');
        setErrorMessage('');
        if (!initialCode) setCode('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, initialCode]);

  // Focus input when sheet opens
  useEffect(() => {
    if (isAnimating && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!isVisible) return null;

  async function handleRedeem() {
    const trimmed = code.trim();
    if (!trimmed || status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setErrorMessage(t('promoCode.error.noSession'));
        return;
      }

      const { data, error } = await supabase.functions.invoke('redeem-promo', {
        body: { code: trimmed },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error('[PromoCodeSheet] Edge Function error:', error);
        setStatus('error');
        setErrorMessage(t('promoCode.error.generic'));
        return;
      }

      if (!data.success) {
        setStatus('error');
        const errorKey = getErrorTranslationKey(data.error);
        setErrorMessage(t(errorKey));
        return;
      }

      // Success: refresh subscription
      const userId = session.user?.id ?? null;
      const subscription = await refreshSubscription(userId);
      useBudgetStore.getState().setSubscription(subscription);

      setStatus('success');

      // Close after brief success display
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('[PromoCodeSheet] Unexpected error:', err);
      setStatus('error');
      setErrorMessage(t('promoCode.error.generic'));
    }
  }

  function getErrorTranslationKey(errorCode: string): string {
    switch (errorCode) {
      case 'INVALID_CODE': return 'promoCode.error.invalid';
      case 'CODE_EXPIRED': return 'promoCode.error.expired';
      case 'CODE_EXHAUSTED': return 'promoCode.error.used';
      case 'CODE_INACTIVE': return 'promoCode.error.used';
      case 'ALREADY_REDEEMED': return 'promoCode.error.alreadyRedeemed';
      case 'ALREADY_PRO': return 'promoCode.error.alreadyPro';
      case 'RATE_LIMIT': return 'promoCode.error.rateLimit';
      default: return 'promoCode.error.generic';
    }
  }

  const backdropOpacity = isAnimating ? 0.5 : 0;
  const sheetTranslate = isAnimating ? 0 : 400;

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={status !== 'loading' ? onClose : undefined}
        style={{ opacity: backdropOpacity, transition: 'opacity 300ms' }}
        aria-label="Cerrar"
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          transform: `translateY(${sheetTranslate}px)`,
          transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Content */}
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18B7B0]/10">
                <Gift size={20} className="text-[#18B7B0]" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {t('promoCode.title')}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={status === 'loading'}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Success state */}
          {status === 'success' ? (
            <div className="flex flex-col items-center py-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Check size={32} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
              </div>
              <p className="text-center text-base font-semibold text-gray-900 dark:text-gray-50">
                {t('promoCode.success')}
              </p>
            </div>
          ) : (
            <>
              {/* Input */}
              <div className="mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (status === 'error') {
                      setStatus('idle');
                      setErrorMessage('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRedeem();
                  }}
                  placeholder={t('promoCode.placeholder')}
                  disabled={status === 'loading'}
                  maxLength={20}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-4 text-center text-lg font-semibold tracking-widest text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:tracking-normal placeholder:font-normal placeholder:text-base focus:border-[#18B7B0] focus:outline-none focus:ring-2 focus:ring-[#18B7B0]/20 disabled:opacity-50 transition-colors"
                />
              </div>

              {/* Error message */}
              {status === 'error' && errorMessage && (
                <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-700 dark:text-red-300 text-center font-medium">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Redeem button */}
              <button
                type="button"
                onClick={handleRedeem}
                disabled={!code.trim() || status === 'loading'}
                className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    {t('promoCode.redeeming')}
                  </span>
                ) : (
                  t('promoCode.redeem')
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
