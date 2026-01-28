import { useEffect } from "react";

/**
 * Hook that automatically dismisses the keyboard when:
 * - User manually scrolls (not auto-scroll from focusing)
 * - User touches outside the active input field
 *
 * This provides a native mobile app feel where the keyboard
 * closes on interaction outside the input area.
 *
 * Usage: Simply call the hook at the top level of any component
 * that has input fields where you want this behavior.
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   useKeyboardDismiss();
 *   return <input type="text" />;
 * }
 * ```
 */
export function useKeyboardDismiss() {
  useEffect(() => {
    let lastFocusTime = 0;

    // Detect user-initiated scroll (via touch)
    const handleTouchMove = () => {
      // Close keyboard if enough time has passed since last focus (500ms)
      const timeSinceFocus = Date.now() - lastFocusTime;
      if (timeSinceFocus > 500) {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement
        ) {
          activeElement.blur();
        }
      }
    };

    // Track when inputs are focused
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        lastFocusTime = Date.now();
      }
    };

    // Close keyboard when touching outside the active input
    const handleTouchStart = (e: TouchEvent) => {
      const activeElement = document.activeElement;
      const target = e.target as Node;

      // If touching an input/textarea, don't close keyboard (user is focusing a new input)
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // If there's an active input and touch is outside it, close keyboard
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        if (!activeElement.contains(target) && activeElement !== target) {
          activeElement.blur();
        }
      }
    };

    // Add listeners
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("touchstart", handleTouchStart);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);
}
