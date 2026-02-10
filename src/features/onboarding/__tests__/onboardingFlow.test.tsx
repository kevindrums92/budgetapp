/**
 * Onboarding Flow Tests
 *
 * Validates the new onboarding flow after removing Screen7_ChoosePlan and LoginProScreen.
 *
 * New flow: Welcome (6 screens) → Config (5 screens) → App
 * Login phase is only for logout/re-login, NOT part of initial onboarding.
 *
 * Critical cases tested:
 * 1. Welcome/6 → Config/1 (not Login)
 * 2. Config/1 back → Welcome/6 (not Login)
 * 3. Skip from Welcome → Config/5 (not Welcome/7)
 * 4. Logout → determineStartScreen → 'login'
 * 5. DEVICE_INITIALIZED persists across logout
 * 6. ProgressDots total = 6 (via constants)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OnboardingProvider } from '../OnboardingContext';
import { useOnboardingProgress } from '../hooks/useOnboardingProgress';
import {
  PHASE_SCREEN_COUNTS,
  WELCOME_SCREENS,
  ONBOARDING_KEYS,
  DEFAULT_ONBOARDING_STATE,
} from '../utils/onboarding.constants';
import {
  determineStartScreen,
  markLogout,
  markOnboardingComplete,
  isOnboardingCompleted,
} from '../utils/onboarding.helpers';
import type { ReactNode } from 'react';

// --- Mocks ---

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockGetSession = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('@/services/cloudState.service', () => ({
  getCloudState: vi.fn().mockResolvedValue(null),
  upsertCloudState: vi.fn().mockResolvedValue(undefined),
}));

// --- Helpers ---

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/onboarding/welcome/1']}>
          <OnboardingProvider>{children}</OnboardingProvider>
        </MemoryRouter>
      </I18nextProvider>
    );
  };
}

function setProgress(phase: string, step: number) {
  localStorage.setItem(
    ONBOARDING_KEYS.PROGRESS,
    JSON.stringify({ phase, step })
  );
}

// --- Tests ---

describe('Onboarding Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  // =============================================
  // 1. Constants Validation
  // =============================================

  describe('Constants', () => {
    it('welcome phase has exactly 6 screens (not 7)', () => {
      expect(PHASE_SCREEN_COUNTS.welcome).toBe(6);
    });

    it('WELCOME_SCREENS map has exactly 6 entries', () => {
      expect(Object.keys(WELCOME_SCREENS)).toHaveLength(6);
    });

    it('WELCOME_SCREENS does not have a 7th entry', () => {
      expect((WELCOME_SCREENS as Record<string, string>)[7]).toBeUndefined();
    });

    it('config phase has exactly 5 screens', () => {
      expect(PHASE_SCREEN_COUNTS.config).toBe(5);
    });

    it('default state starts at welcome phase, step 1', () => {
      expect(DEFAULT_ONBOARDING_STATE.phase).toBe('welcome');
      expect(DEFAULT_ONBOARDING_STATE.step).toBe(1);
    });

    it('DEVICE_INITIALIZED key is budget.device.initialized', () => {
      expect(ONBOARDING_KEYS.DEVICE_INITIALIZED).toBe('budget.device.initialized');
    });
  });

  // =============================================
  // 2. useOnboardingProgress - handleNext
  // =============================================

  describe('useOnboardingProgress - handleNext', () => {
    it('welcome/1 → welcome/2 (next step within phase)', async () => {
      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('welcome');
        expect(result.current.currentStep).toBe(1);
      });

      act(() => {
        result.current.handleNext();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome/2');
    });

    it('welcome/5 → welcome/6 (last step before phase transition)', async () => {
      setProgress('welcome', 5);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(5);
      });

      act(() => {
        result.current.handleNext();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome/6');
    });

    it('welcome/6 → config/1 (CRITICAL: goes to config, NOT login)', async () => {
      setProgress('welcome', 6);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('welcome');
        expect(result.current.currentStep).toBe(6);
      });

      act(() => {
        result.current.handleNext();
      });

      // CRITICAL: Must go to config, NOT login
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/1');
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/login');
    });

    it('config/1 → config/2 (next step within config phase)', async () => {
      setProgress('config', 1);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('config');
        expect(result.current.currentStep).toBe(1);
      });

      act(() => {
        result.current.handleNext();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/2');
    });

    it('config/5 → /home (completes onboarding)', async () => {
      setProgress('config', 5);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('config');
        expect(result.current.currentStep).toBe(5);
      });

      act(() => {
        result.current.handleNext();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // =============================================
  // 3. useOnboardingProgress - handleBack
  // =============================================

  describe('useOnboardingProgress - handleBack', () => {
    it('welcome/3 → welcome/2 (back within welcome phase)', async () => {
      setProgress('welcome', 3);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(3);
      });

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome/2');
    });

    it('config/1 → welcome/6 (CRITICAL: back to last welcome screen, NOT login)', async () => {
      setProgress('config', 1);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('config');
        expect(result.current.currentStep).toBe(1);
      });

      act(() => {
        result.current.handleBack();
      });

      // CRITICAL: Must go to welcome/6, NOT login
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome/6');
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/login');
    });

    it('config/3 → config/2 (back within config phase)', async () => {
      setProgress('config', 3);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(3);
      });

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/2');
    });
  });

  // =============================================
  // 4. useOnboardingProgress - handleSkip
  // =============================================

  describe('useOnboardingProgress - handleSkip', () => {
    it('skip from welcome → config/5 (CRITICAL: goes to Screen5_Complete, NOT welcome/7)', async () => {
      setProgress('welcome', 2);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('welcome');
      });

      act(() => {
        result.current.handleSkip();
      });

      // CRITICAL: Must skip to config/5, NOT welcome/7
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/5');
      expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding/welcome/7');
    });

    it('skip from config → config/5 (goes to Screen5_Complete)', async () => {
      setProgress('config', 2);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('config');
      });

      act(() => {
        result.current.handleSkip();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/5');
    });

    it('skip from welcome/1 → config/5 (skip at very beginning)', async () => {
      // Default state is welcome/1, no need to set progress

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('welcome');
        expect(result.current.currentStep).toBe(1);
      });

      act(() => {
        result.current.handleSkip();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/5');
    });
  });

  // =============================================
  // 5. determineStartScreen
  // =============================================

  describe('determineStartScreen', () => {
    it('returns "onboarding" for first-time user (clean localStorage)', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await determineStartScreen();
      expect(result).toBe('onboarding');
    });

    it('returns "app" for completed user with active session', async () => {
      localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const result = await determineStartScreen();
      expect(result).toBe('app');
    });

    it('returns "app" for completed guest user (no session)', async () => {
      localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await determineStartScreen();
      expect(result).toBe('app');
    });

    it('returns "login" when user has explicitly logged out', async () => {
      markLogout();
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await determineStartScreen();
      expect(result).toBe('login');
    });

    it('returns "login" when device is initialized but no session or completion', async () => {
      localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await determineStartScreen();
      expect(result).toBe('login');
    });

    it('returns "continue" when session exists but onboarding not completed', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const result = await determineStartScreen();
      expect(result).toBe('continue');
    });

    it('returns "continue" when saved progress exists', async () => {
      setProgress('config', 3);
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await determineStartScreen();
      expect(result).toBe('continue');
    });

    it('returns "login" for logout even if session is still active (async signOut)', async () => {
      markLogout();
      // Session might still be "active" briefly after signOut
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const result = await determineStartScreen();
      // LOGOUT flag takes priority over active session
      expect(result).toBe('login');
    });
  });

  // =============================================
  // 6. DEVICE_INITIALIZED flag lifecycle
  // =============================================

  describe('DEVICE_INITIALIZED flag lifecycle', () => {
    it('markOnboardingComplete sets COMPLETED flag', () => {
      markOnboardingComplete();
      expect(isOnboardingCompleted()).toBe(true);
    });

    it('markLogout clears COMPLETED but NOT DEVICE_INITIALIZED', () => {
      localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
      localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');

      markLogout();

      // COMPLETED should be cleared
      expect(localStorage.getItem(ONBOARDING_KEYS.COMPLETED)).toBeNull();
      // DEVICE_INITIALIZED should persist (permanent flag, never cleared)
      expect(localStorage.getItem(ONBOARDING_KEYS.DEVICE_INITIALIZED)).toBe('true');
    });

    it('markLogout also clears PROGRESS and SELECTIONS', () => {
      setProgress('config', 3);
      localStorage.setItem(ONBOARDING_KEYS.SELECTIONS, JSON.stringify({ language: 'es' }));

      markLogout();

      expect(localStorage.getItem(ONBOARDING_KEYS.PROGRESS)).toBeNull();
      expect(localStorage.getItem(ONBOARDING_KEYS.SELECTIONS)).toBeNull();
    });

    it('DEVICE_INITIALIZED causes "login" on next app start (skips Welcome)', async () => {
      // Simulate: user completed onboarding, then cleared localStorage (app reinstall)
      // but DEVICE_INITIALIZED persists (permanent flag)
      localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await determineStartScreen();
      // Should skip Welcome and go directly to Login
      expect(result).toBe('login');
      expect(result).not.toBe('onboarding');
    });
  });

  // =============================================
  // 7. Complete user flow scenarios
  // =============================================

  describe('User flow scenarios', () => {
    it('Flow 1: new user completes full onboarding → Welcome/6 next goes to Config', async () => {
      // New user starts at welcome/6 (last welcome screen)
      setProgress('welcome', 6);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('welcome');
        expect(result.current.currentStep).toBe(6);
      });

      // Pressing "Continue" on last welcome screen
      act(() => {
        result.current.handleNext();
      });

      // Should transition directly to first config screen
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/1');
    });

    it('Flow 2: user skips welcome from screen 3 → lands on Config/5 (Complete)', async () => {
      setProgress('welcome', 3);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(3);
      });

      act(() => {
        result.current.handleSkip();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/config/5');
    });

    it('Flow 3: user goes back from Config/1 → returns to Welcome/6', async () => {
      setProgress('config', 1);

      const { result } = renderHook(() => useOnboardingProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('config');
        expect(result.current.currentStep).toBe(1);
      });

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/welcome/6');
    });

    it('Flow 4: logout sets correct flags, next start returns "login"', async () => {
      // User was using the app, then logs out
      localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
      localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');

      markLogout();

      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const result = await determineStartScreen();

      expect(result).toBe('login');
    });

    it('Flow 5: device initialized + localStorage cleared → "login" (skips Welcome)', async () => {
      // Simulates app data cleared but DEVICE_INITIALIZED persists
      localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await determineStartScreen();

      expect(result).toBe('login');
    });
  });
});
