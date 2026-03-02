/**
 * PrivacyProvider
 * Provider for privacy mode (censoring sensitive financial data)
 * Supports 3 levels: off → partial → full
 */

import React, { useState, useCallback, useMemo } from 'react';
import { PrivacyContext, type PrivacyContextValue, type PrivacyLevel } from '../context/PrivacyContext';

const STORAGE_KEY = 'app_privacy_mode';

const CYCLE: Record<PrivacyLevel, PrivacyLevel> = {
  off: 'partial',
  partial: 'full',
  full: 'off',
};

function getInitialPrivacyLevel(): PrivacyLevel {
  if (typeof window === 'undefined') return 'off';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 'off';

    // Migration: old boolean format ('1') -> 'full'
    if (stored === '1') return 'full';

    // New format: validate stored value
    if (stored === 'partial' || stored === 'full') return stored;

    return 'off';
  } catch {
    return 'off';
  }
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(getInitialPrivacyLevel);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyLevel((prev) => {
      const next = CYCLE[prev];
      try {
        if (next === 'off') {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, next);
        }
      } catch (err) {
        console.error('[Privacy] Failed to persist privacy level:', err);
      }
      console.log('[Privacy] Privacy level changed:', next);
      return next;
    });
  }, []);

  // Censors at partial or full
  const formatWithPrivacy = useCallback(
    (formattedAmount: string, currencySymbol: string): string => {
      if (privacyLevel === 'off') return formattedAmount;
      return `${currencySymbol} -----`;
    },
    [privacyLevel]
  );

  // Censors only at full
  const formatWithFullPrivacy = useCallback(
    (formattedAmount: string, currencySymbol: string): string => {
      if (privacyLevel !== 'full') return formattedAmount;
      return `${currencySymbol} -----`;
    },
    [privacyLevel]
  );

  const value: PrivacyContextValue = useMemo(
    () => ({
      privacyLevel,
      privacyMode: privacyLevel !== 'off',
      togglePrivacyMode,
      formatWithPrivacy,
      formatWithFullPrivacy,
    }),
    [privacyLevel, togglePrivacyMode, formatWithPrivacy, formatWithFullPrivacy]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}
