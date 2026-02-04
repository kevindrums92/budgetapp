/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFakeProgress } from "./useFakeProgress";

describe("useFakeProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should start at 0 progress when not processing", () => {
    const { result } = renderHook(() => useFakeProgress({ isProcessing: false }));

    expect(result.current).toBe(0);
  });

  it("should start at 0 progress when processing starts", () => {
    const { result } = renderHook(
      ({ isProcessing }) => useFakeProgress({ isProcessing }),
      { initialProps: { isProcessing: true } }
    );

    expect(result.current).toBe(0);
  });

  it("should increment progress over time when processing", () => {
    const { result } = renderHook(() => useFakeProgress({ isProcessing: true }));

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it("should approach but not exceed maxProgress", () => {
    const { result } = renderHook(() =>
      useFakeProgress({ isProcessing: true, maxProgress: 90 })
    );

    act(() => {
      vi.advanceTimersByTime(30000); // 30 seconds
    });

    expect(result.current).toBeLessThanOrEqual(90);
  });

  it("should reset to 0 when processing starts", () => {
    const { result, rerender } = renderHook(
      ({ isProcessing }) => useFakeProgress({ isProcessing }),
      { initialProps: { isProcessing: false } }
    );

    expect(result.current).toBe(0);

    // Start processing
    rerender({ isProcessing: true });

    expect(result.current).toBe(0);
  });

  it("should jump to 100 when processing completes", () => {
    const { result, rerender } = renderHook(
      ({ isProcessing }) => useFakeProgress({ isProcessing }),
      { initialProps: { isProcessing: true } }
    );

    // Let progress increase
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const progressBeforeComplete = result.current;
    expect(progressBeforeComplete).toBeGreaterThan(0);
    expect(progressBeforeComplete).toBeLessThan(100);

    // Complete processing
    act(() => {
      rerender({ isProcessing: false });
    });

    expect(result.current).toBe(100);
  });

  it("should reset to 0 after completion animation", () => {
    const { result, rerender } = renderHook(
      ({ isProcessing }) => useFakeProgress({ isProcessing }),
      { initialProps: { isProcessing: true } }
    );

    // Let progress increase
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Complete processing
    act(() => {
      rerender({ isProcessing: false });
    });

    expect(result.current).toBe(100);

    // Wait for reset (500ms)
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current).toBe(0);
  });

  it("should use custom maxProgress", () => {
    const { result } = renderHook(() =>
      useFakeProgress({ isProcessing: true, maxProgress: 75 })
    );

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current).toBeLessThanOrEqual(75);
  });

  it("should use custom intervalMs", () => {
    const { result } = renderHook(() =>
      useFakeProgress({ isProcessing: true, intervalMs: 100 })
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should have updated after 100ms
    expect(result.current).toBeGreaterThan(0);
  });

  it("should use custom speed", () => {
    const { result: fastResult } = renderHook(() =>
      useFakeProgress({ isProcessing: true, speed: 0.2 })
    );

    const { result: slowResult } = renderHook(() =>
      useFakeProgress({ isProcessing: true, speed: 0.05 })
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Faster speed should result in higher progress
    expect(fastResult.current).toBeGreaterThan(slowResult.current);
  });
});
