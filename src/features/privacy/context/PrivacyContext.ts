/**
 * Privacy Context
 * Context for privacy mode (censoring sensitive financial data)
 */

import { createContext } from 'react';

export type PrivacyLevel = 'off' | 'partial' | 'full';

export interface PrivacyContextValue {
  /** Current privacy level */
  privacyLevel: PrivacyLevel;

  /** Legacy boolean: true when privacyLevel !== 'off' (backward compat) */
  privacyMode: boolean;

  /** Cycle through: off -> partial -> full -> off */
  togglePrivacyMode: () => void;

  /** Censor at 'partial' or higher (summary cards: balance, budget, safe-to-spend) */
  formatWithPrivacy: (formattedAmount: string, currencySymbol: string) => string;

  /** Censor only at 'full' (individual transactions, daily totals, breakdown details) */
  formatWithFullPrivacy: (formattedAmount: string, currencySymbol: string) => string;
}

export const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);
