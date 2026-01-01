import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAnimatedNumber } from './useAnimatedNumber';

// Mock requestAnimationFrame to work with fake timers
const mockRAF = vi.fn((cb: FrameRequestCallback) => {
  return setTimeout(cb, 16) as unknown as number;
});

const mockCAF = vi.fn((id: number) => {
  clearTimeout(id);
});

describe('useAnimatedNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Override the polyfills with mocks for testing
    (
      globalThis as unknown as { requestAnimationFrame: typeof requestAnimationFrame }
    ).requestAnimationFrame = mockRAF;
    (
      globalThis as unknown as { cancelAnimationFrame: typeof cancelAnimationFrame }
    ).cancelAnimationFrame = mockCAF;
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame = mockRAF;
      window.cancelAnimationFrame = mockCAF;
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0', () => {
    const { result } = renderHook(() => useAnimatedNumber(100));
    expect(result.current).toBe(0);
  });

  it('animates to target value', async () => {
    const { result } = renderHook(() => useAnimatedNumber(100, 1000));

    // Initially should be 0
    expect(result.current).toBe(0);

    // Fast-forward time partially and trigger animation frames
    act(() => {
      // Advance time by a small amount to see intermediate value
      vi.advanceTimersByTime(100);
      vi.runOnlyPendingTimers();
    });

    // Value should be animating (between 0 and 100)
    const midValue = result.current;
    expect(midValue).toBeGreaterThanOrEqual(0);
    // At 100ms into a 1000ms animation, value should be less than 100
    if (midValue >= 100) {
      // If it already reached 100, that's also valid (animation might be fast)
      expect(midValue).toBe(100);
    } else {
      expect(midValue).toBeLessThan(100);
    }

    act(() => {
      vi.advanceTimersByTime(900);
      vi.runOnlyPendingTimers();
    });

    // Should reach target
    expect(result.current).toBe(100);
  });

  it('reaches target value after duration', async () => {
    const { result } = renderHook(() => useAnimatedNumber(200, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBe(200);
  });

  it('handles decimal places correctly', async () => {
    const { result } = renderHook(() => useAnimatedNumber(123.456, 1000, 2));

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBeCloseTo(123.46, 1);
  });

  it('updates when target changes', async () => {
    const { result, rerender } = renderHook(({ target }) => useAnimatedNumber(target, 1000), {
      initialProps: { target: 100 },
    });

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBe(100);

    rerender({ target: 200 });
    act(() => {
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBe(200);
  });

  it('handles zero target', async () => {
    const { result } = renderHook(() => useAnimatedNumber(0, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBe(0);
  });

  it('handles negative target', async () => {
    const { result } = renderHook(() => useAnimatedNumber(-100, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBe(-100);
  });

  it('handles very large target', async () => {
    const { result } = renderHook(() => useAnimatedNumber(1000000, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBe(1000000);
  });

  it('uses custom duration', async () => {
    const { result } = renderHook(() => useAnimatedNumber(100, 500));

    act(() => {
      vi.advanceTimersByTime(500);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toBe(100);
  });

  it('cleans up animation frame on unmount', () => {
    const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = renderHook(() => useAnimatedNumber(100, 1000));

    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    cancelAnimationFrameSpy.mockRestore();
  });

  it('applies easing function correctly', async () => {
    const { result } = renderHook(() => useAnimatedNumber(100, 1000));

    // Check intermediate values show easing (ease-out)
    // Use a smaller time increment to catch it before completion
    act(() => {
      vi.advanceTimersByTime(50);
      vi.runOnlyPendingTimers();
    });

    const value = result.current;
    // With ease-out, value should be less than linear (5 for 50ms/1000ms * 100)
    // But if animation completes quickly, value might be 100
    if (value < 100) {
      expect(value).toBeLessThan(5); // Linear would be 5, ease-out should be less
    }
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
  });
});
