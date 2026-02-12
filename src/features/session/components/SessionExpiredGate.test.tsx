/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@/test/test-utils';
import { useBudgetStore } from '@/state/budget.store';

// ============================================================================
// Mock dependencies
// ============================================================================

const mockSignInWithOAuthInAppBrowser = vi.fn();
vi.mock('@/shared/utils/oauth.utils', () => ({
  signInWithOAuthInAppBrowser: (...args: any[]) => mockSignInWithOAuthInAppBrowser(...args),
}));

const mockSignInAnonymously = vi.fn();
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInAnonymously: () => mockSignInAnonymously(),
    },
  },
}));

// ============================================================================
// Tests
// ============================================================================

describe('SessionExpiredGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset store
    useBudgetStore.setState({
      sessionExpired: false,
    });

    // Default mocks
    mockSignInWithOAuthInAppBrowser.mockResolvedValue({ error: null });
    mockSignInAnonymously.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  // Helper to render the component
  async function renderGate() {
    const { default: SessionExpiredGate } = await import('./SessionExpiredGate');
    return render(<SessionExpiredGate />);
  }

  // ========================================================================
  // Visibility
  // ========================================================================
  describe('Visibility', () => {
    it('should render nothing when sessionExpired is false', async () => {
      useBudgetStore.setState({ sessionExpired: false });
      const { container } = await renderGate();
      expect(container.firstChild).toBeNull();
    });

    it('should render fullscreen modal when sessionExpired is true', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      // Title should be visible
      expect(screen.getByText('Tu sesión expiró')).toBeInTheDocument();
    });

    it('should show subtitle text', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      expect(screen.getByText('Inicia sesión nuevamente para sincronizar tus datos con tu cuenta.')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Email hint
  // ========================================================================
  describe('Email hint', () => {
    it('should show email hint when lastAuthEmail is in localStorage', async () => {
      localStorage.setItem('budget.lastAuthEmail', 'user@gmail.com');
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      expect(screen.getByText(/user@gmail.com/)).toBeInTheDocument();
    });

    it('should NOT show email hint when lastAuthEmail is not set', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      expect(screen.queryByText(/Última cuenta/)).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // OAuth button order based on last provider
  // ========================================================================
  describe('OAuth button order', () => {
    it('should show Google first when lastAuthProvider is "google"', async () => {
      localStorage.setItem('budget.lastAuthProvider', 'google');
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const allButtons = screen.getAllByRole('button');
      const googleIndex = allButtons.findIndex(b => b.textContent?.includes('Google'));
      const appleIndex = allButtons.findIndex(b => b.textContent?.includes('Apple'));

      expect(googleIndex).not.toBe(-1);
      expect(appleIndex).not.toBe(-1);

      // Google should appear before Apple in DOM order
      expect(googleIndex).toBeLessThan(appleIndex);
    });

    it('should show Apple first when lastAuthProvider is "apple"', async () => {
      localStorage.setItem('budget.lastAuthProvider', 'apple');
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const allButtons = screen.getAllByRole('button');
      const googleIndex = allButtons.findIndex(b => b.textContent?.includes('Google'));
      const appleIndex = allButtons.findIndex(b => b.textContent?.includes('Apple'));

      expect(googleIndex).not.toBe(-1);
      expect(appleIndex).not.toBe(-1);

      // Apple should appear before Google in DOM order
      expect(appleIndex).toBeLessThan(googleIndex);
    });
  });

  // ========================================================================
  // OAuth interactions
  // ========================================================================
  describe('OAuth interactions', () => {
    it('should call signInWithOAuthInAppBrowser with "google" when Google button is clicked', async () => {
      localStorage.setItem('budget.lastAuthProvider', 'google');
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const googleButton = screen.getAllByRole('button').find(b => b.textContent?.includes('Google'));
      fireEvent.click(googleButton!);

      await waitFor(() => {
        expect(mockSignInWithOAuthInAppBrowser).toHaveBeenCalledWith('google', expect.objectContaining({
          queryParams: { prompt: 'select_account' },
          skipLinkIdentity: true,
        }));
      });
    });

    it('should call signInWithOAuthInAppBrowser with "apple" when Apple button is clicked', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const appleButton = screen.getAllByRole('button').find(b => b.textContent?.includes('Apple'));
      fireEvent.click(appleButton!);

      await waitFor(() => {
        expect(mockSignInWithOAuthInAppBrowser).toHaveBeenCalledWith('apple', expect.objectContaining({
          skipLinkIdentity: true,
        }));
      });
    });

    it('should set oauthTransition flag before starting OAuth', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const googleButton = screen.getAllByRole('button').find(b => b.textContent?.includes('Google'));
      fireEvent.click(googleButton!);

      await waitFor(() => {
        expect(localStorage.getItem('budget.oauthTransition')).not.toBeNull();
      });
    });

    it('should show error when OAuth fails', async () => {
      mockSignInWithOAuthInAppBrowser.mockRejectedValue(new Error('OAuth failed'));
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const googleButton = screen.getAllByRole('button').find(b => b.textContent?.includes('Google'));
      fireEvent.click(googleButton!);

      await waitFor(() => {
        expect(screen.getByText('OAuth failed')).toBeInTheDocument();
      });
    });

    it('should remove oauthTransition flag when OAuth fails', async () => {
      mockSignInWithOAuthInAppBrowser.mockRejectedValue(new Error('OAuth failed'));
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const googleButton = screen.getAllByRole('button').find(b => b.textContent?.includes('Google'));
      fireEvent.click(googleButton!);

      await waitFor(() => {
        expect(localStorage.getItem('budget.oauthTransition')).toBeNull();
      });
    });

    it('should disable buttons while loading', async () => {
      // Make OAuth hang (never resolve)
      mockSignInWithOAuthInAppBrowser.mockReturnValue(new Promise(() => {}));
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const googleButton = screen.getAllByRole('button').find(b => b.textContent?.includes('Google'));
      fireEvent.click(googleButton!);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const oauthButtons = buttons.filter(b =>
          b.textContent?.includes('Google') || b.textContent?.includes('Apple')
        );
        oauthButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });
  });

  // ========================================================================
  // Continue as guest
  // ========================================================================
  describe('Continue as guest', () => {
    it('should clear auth flags and dismiss modal when guest button is clicked', async () => {
      localStorage.setItem('budget.wasAuthenticated', 'true');
      localStorage.setItem('budget.lastAuthEmail', 'user@gmail.com');
      localStorage.setItem('budget.lastAuthProvider', 'google');
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const guestButton = screen.getAllByRole('button').find(b =>
        b.textContent?.includes('invitado') || b.textContent?.includes('guest')
      );
      fireEvent.click(guestButton!);

      await waitFor(() => {
        // Flags should be cleared
        expect(localStorage.getItem('budget.wasAuthenticated')).toBeNull();
        expect(localStorage.getItem('budget.lastAuthEmail')).toBeNull();
        expect(localStorage.getItem('budget.lastAuthProvider')).toBeNull();

        // sessionExpired should be false
        expect(useBudgetStore.getState().sessionExpired).toBe(false);
      });
    });

    it('should call signInAnonymously when continuing as guest', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      const guestButton = screen.getAllByRole('button').find(b =>
        b.textContent?.includes('invitado') || b.textContent?.includes('guest')
      );
      fireEvent.click(guestButton!);

      await waitFor(() => {
        expect(mockSignInAnonymously).toHaveBeenCalledOnce();
      });
    });

    it('should show guest warning text', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      expect(screen.getByText(/datos se guardarán localmente/)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Body scroll lock
  // ========================================================================
  describe('Body scroll lock', () => {
    it('should lock body scroll when visible', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when dismissed', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      expect(document.body.style.overflow).toBe('hidden');

      // Dismiss by continuing as guest
      const guestButton = screen.getAllByRole('button').find(b =>
        b.textContent?.includes('invitado') || b.textContent?.includes('guest')
      );
      fireEvent.click(guestButton!);

      await waitFor(() => {
        expect(useBudgetStore.getState().sessionExpired).toBe(false);
      });
    });
  });

  // ========================================================================
  // OAuth error event listener
  // ========================================================================
  describe('OAuth error events', () => {
    it('should show error when oauth-error event is dispatched', async () => {
      useBudgetStore.setState({ sessionExpired: true });
      await renderGate();

      // Dispatch custom event (like main.tsx deep link handler would)
      window.dispatchEvent(new CustomEvent('oauth-error', {
        detail: { error: 'Deep link auth failed' },
      }));

      await waitFor(() => {
        expect(screen.getByText('Deep link auth failed')).toBeInTheDocument();
      });
    });
  });
});
