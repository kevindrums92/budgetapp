import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@/test/test-utils';
import { PrivacyProvider } from './PrivacyProvider';
import { usePrivacy } from '../hooks/usePrivacy';
import { CurrencyProvider } from '@/features/currency';

// Helper component to test the hook
function TestComponent() {
  const { privacyLevel, privacyMode, togglePrivacyMode, formatWithPrivacy, formatWithFullPrivacy } = usePrivacy();

  return (
    <div>
      <p data-testid="privacy-level">{privacyLevel}</p>
      <p data-testid="privacy-mode">{privacyMode ? 'ON' : 'OFF'}</p>
      <button onClick={togglePrivacyMode}>Toggle</button>
      <p data-testid="formatted-amount">
        {formatWithPrivacy('$ 1.500.000', '$')}
      </p>
      <p data-testid="full-formatted-amount">
        {formatWithFullPrivacy('$ 1.500.000', '$')}
      </p>
    </div>
  );
}

// Wrapper function to render component with required providers
function renderWithProviders(component: React.ReactElement) {
  return render(
    <CurrencyProvider>
      <PrivacyProvider>{component}</PrivacyProvider>
    </CurrencyProvider>
  );
}

describe('PrivacyProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should start with privacy level "off" by default', () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('privacy-level')).toHaveTextContent('off');
      expect(screen.getByTestId('privacy-mode')).toHaveTextContent('OFF');
    });

    it('should migrate old "1" value to "full"', () => {
      localStorage.setItem('app_privacy_mode', '1');

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('privacy-level')).toHaveTextContent('full');
      expect(screen.getByTestId('privacy-mode')).toHaveTextContent('ON');
    });

    it('should load "partial" from localStorage', () => {
      localStorage.setItem('app_privacy_mode', 'partial');

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('privacy-level')).toHaveTextContent('partial');
      expect(screen.getByTestId('privacy-mode')).toHaveTextContent('ON');
    });

    it('should load "full" from localStorage', () => {
      localStorage.setItem('app_privacy_mode', 'full');

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('privacy-level')).toHaveTextContent('full');
      expect(screen.getByTestId('privacy-mode')).toHaveTextContent('ON');
    });

    it('should default to "off" when localStorage has invalid value', () => {
      localStorage.setItem('app_privacy_mode', 'invalid');

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('privacy-level')).toHaveTextContent('off');
    });

    it('should default to "off" when localStorage is empty', () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('privacy-level')).toHaveTextContent('off');
    });

    it('should handle localStorage read errors gracefully', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('privacy-level')).toHaveTextContent('off');

      getItemSpy.mockRestore();
    });
  });

  describe('Toggle functionality', () => {
    it('should cycle off -> partial -> full -> off', () => {
      renderWithProviders(<TestComponent />);

      const level = screen.getByTestId('privacy-level');
      const toggleButton = screen.getByText('Toggle');

      expect(level).toHaveTextContent('off');

      fireEvent.click(toggleButton);
      expect(level).toHaveTextContent('partial');

      fireEvent.click(toggleButton);
      expect(level).toHaveTextContent('full');

      fireEvent.click(toggleButton);
      expect(level).toHaveTextContent('off');
    });

    it('should cycle correctly over multiple rounds', () => {
      renderWithProviders(<TestComponent />);

      const level = screen.getByTestId('privacy-level');
      const toggleButton = screen.getByText('Toggle');

      // First cycle
      fireEvent.click(toggleButton); // off -> partial
      fireEvent.click(toggleButton); // partial -> full
      fireEvent.click(toggleButton); // full -> off

      // Second cycle
      fireEvent.click(toggleButton); // off -> partial
      expect(level).toHaveTextContent('partial');

      fireEvent.click(toggleButton); // partial -> full
      expect(level).toHaveTextContent('full');
    });

    it('privacyMode boolean should be true for partial and full', () => {
      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      const toggleButton = screen.getByText('Toggle');

      expect(mode).toHaveTextContent('OFF'); // off

      fireEvent.click(toggleButton);
      expect(mode).toHaveTextContent('ON'); // partial

      fireEvent.click(toggleButton);
      expect(mode).toHaveTextContent('ON'); // full

      fireEvent.click(toggleButton);
      expect(mode).toHaveTextContent('OFF'); // off again
    });
  });

  describe('localStorage persistence', () => {
    it('should store "partial" when toggled from off', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle'));

      expect(localStorage.getItem('app_privacy_mode')).toBe('partial');
    });

    it('should store "full" when toggled from partial', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial
      fireEvent.click(screen.getByText('Toggle')); // partial -> full

      expect(localStorage.getItem('app_privacy_mode')).toBe('full');
    });

    it('should remove from localStorage when toggled to off', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial
      fireEvent.click(screen.getByText('Toggle')); // partial -> full
      fireEvent.click(screen.getByText('Toggle')); // full -> off

      expect(localStorage.getItem('app_privacy_mode')).toBeNull();
    });

    it('should handle localStorage write errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      renderWithProviders(<TestComponent />);

      expect(() => fireEvent.click(screen.getByText('Toggle'))).not.toThrow();

      // Privacy level should still toggle despite localStorage error
      expect(screen.getByTestId('privacy-level')).toHaveTextContent('partial');

      setItemSpy.mockRestore();
    });

    it('should handle localStorage remove errors gracefully', () => {
      localStorage.setItem('app_privacy_mode', 'full');

      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      removeItemSpy.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      renderWithProviders(<TestComponent />);

      // full -> off
      expect(() => fireEvent.click(screen.getByText('Toggle'))).not.toThrow();
      expect(screen.getByTestId('privacy-level')).toHaveTextContent('off');

      removeItemSpy.mockRestore();
    });
  });

  describe('formatWithPrivacy function', () => {
    it('should return original amount when privacy level is off', () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('formatted-amount')).toHaveTextContent('$ 1.500.000');
    });

    it('should censor amount at partial level', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial

      expect(screen.getByTestId('formatted-amount')).toHaveTextContent('$ -----');
    });

    it('should censor amount at full level', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial
      fireEvent.click(screen.getByText('Toggle')); // partial -> full

      expect(screen.getByTestId('formatted-amount')).toHaveTextContent('$ -----');
    });

    it('should use correct currency symbol in censored format', () => {
      function TestComponentWithCurrencies() {
        const { formatWithPrivacy, togglePrivacyMode } = usePrivacy();

        return (
          <div>
            <button onClick={togglePrivacyMode}>Toggle</button>
            <p data-testid="cop-amount">{formatWithPrivacy('$ 1.500.000', '$')}</p>
            <p data-testid="eur-amount">{formatWithPrivacy('€ 1.500,00', '€')}</p>
            <p data-testid="gtq-amount">{formatWithPrivacy('Q 1,500.00', 'Q')}</p>
          </div>
        );
      }

      renderWithProviders(<TestComponentWithCurrencies />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial

      expect(screen.getByTestId('cop-amount')).toHaveTextContent('$ -----');
      expect(screen.getByTestId('eur-amount')).toHaveTextContent('€ -----');
      expect(screen.getByTestId('gtq-amount')).toHaveTextContent('Q -----');
    });
  });

  describe('formatWithFullPrivacy function', () => {
    it('should return original amount when privacy level is off', () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('full-formatted-amount')).toHaveTextContent('$ 1.500.000');
    });

    it('should NOT censor at partial level', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial

      expect(screen.getByTestId('full-formatted-amount')).toHaveTextContent('$ 1.500.000');
    });

    it('should censor at full level', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial
      fireEvent.click(screen.getByText('Toggle')); // partial -> full

      expect(screen.getByTestId('full-formatted-amount')).toHaveTextContent('$ -----');
    });

    it('should distinguish between partial and full censoring', () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByText('Toggle')); // off -> partial

      // At partial: formatWithPrivacy censors, formatWithFullPrivacy does NOT
      expect(screen.getByTestId('formatted-amount')).toHaveTextContent('$ -----');
      expect(screen.getByTestId('full-formatted-amount')).toHaveTextContent('$ 1.500.000');

      fireEvent.click(screen.getByText('Toggle')); // partial -> full

      // At full: both censor
      expect(screen.getByTestId('formatted-amount')).toHaveTextContent('$ -----');
      expect(screen.getByTestId('full-formatted-amount')).toHaveTextContent('$ -----');
    });
  });

  describe('usePrivacy hook', () => {
    it('should throw error when used outside PrivacyProvider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePrivacy());
      }).toThrow('usePrivacy must be used within PrivacyProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should provide correct context value', () => {
      const { result } = renderHook(() => usePrivacy(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <CurrencyProvider>
            <PrivacyProvider>{children}</PrivacyProvider>
          </CurrencyProvider>
        ),
      });

      expect(result.current).toHaveProperty('privacyLevel');
      expect(result.current).toHaveProperty('privacyMode');
      expect(result.current).toHaveProperty('togglePrivacyMode');
      expect(result.current).toHaveProperty('formatWithPrivacy');
      expect(result.current).toHaveProperty('formatWithFullPrivacy');
      expect(result.current.privacyLevel).toBe('off');
      expect(typeof result.current.privacyMode).toBe('boolean');
      expect(typeof result.current.togglePrivacyMode).toBe('function');
      expect(typeof result.current.formatWithPrivacy).toBe('function');
      expect(typeof result.current.formatWithFullPrivacy).toBe('function');
    });
  });

  describe('React strict mode compatibility', () => {
    it('should not double-toggle in strict mode', () => {
      renderWithProviders(<TestComponent />);

      const level = screen.getByTestId('privacy-level');
      expect(level).toHaveTextContent('off');

      fireEvent.click(screen.getByText('Toggle'));

      expect(level).toHaveTextContent('partial');
      expect(localStorage.getItem('app_privacy_mode')).toBe('partial');
    });
  });
});
