/**
 * Fake Progress Hook
 * Simulates a progress bar that goes from 0% to ~90%, then jumps to 100% when done.
 * Uses exponential decay so progress starts fast and slows down.
 */

import { useState, useEffect, useRef } from "react";

type UseFakeProgressOptions = {
  /** Whether processing is active */
  isProcessing: boolean;
  /** How often to update progress (ms) */
  intervalMs?: number;
  /** Maximum progress before completion (0-100) */
  maxProgress?: number;
  /** Speed factor (higher = faster initial progress) */
  speed?: number;
};

/**
 * Returns a fake progress value (0-100) that simulates loading.
 * - Starts at 0 when isProcessing becomes true
 * - Gradually increases toward maxProgress (default 90%)
 * - Returns 100 briefly when isProcessing becomes false (completion animation)
 */
export function useFakeProgress({
  isProcessing,
  intervalMs = 150,
  maxProgress = 90,
  speed = 0.08,
}: UseFakeProgressOptions): number {
  const [progress, setProgress] = useState(0);
  const wasProcessing = useRef(false);

  useEffect(() => {
    // When processing starts, reset to 0
    if (isProcessing && !wasProcessing.current) {
      setProgress(0);
    }

    // When processing ends, jump to 100 briefly
    if (!isProcessing && wasProcessing.current) {
      setProgress(100);
      // Reset to 0 after animation completes
      const timeout = setTimeout(() => setProgress(0), 500);
      wasProcessing.current = false;
      return () => clearTimeout(timeout);
    }

    wasProcessing.current = isProcessing;

    if (!isProcessing) return;

    // Increment progress using exponential decay
    // Formula: progress + (maxProgress - progress) * speed
    // This makes progress fast at first, then slows as it approaches max
    const interval = setInterval(() => {
      setProgress((prev) => {
        const remaining = maxProgress - prev;
        const increment = remaining * speed;
        // Add some randomness for natural feel
        const randomFactor = 0.5 + Math.random();
        const newProgress = prev + increment * randomFactor;
        return Math.min(newProgress, maxProgress);
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isProcessing, intervalMs, maxProgress, speed]);

  return Math.round(progress);
}
