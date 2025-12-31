import { useState, useEffect } from "react";

export function useAnimatedNumber(target: number, duration = 1000, decimals = 0): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const raf =
      typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame
        : typeof globalThis !== "undefined" && (globalThis as any).requestAnimationFrame
          ? (globalThis as any).requestAnimationFrame
          : typeof window !== "undefined" && window.requestAnimationFrame
            ? window.requestAnimationFrame
            : null;

    if (!raf) {
      console.error("requestAnimationFrame is not available");
      setCurrent(target);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      setCurrent(target * eased);

      if (progress < 1) {
        animationFrame = raf(animate);
      } else {
        setCurrent(target);
      }
    };

    animationFrame = raf(animate);

    return () => {
      if (animationFrame) {
        if (typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(animationFrame);
        } else if (typeof globalThis !== "undefined" && (globalThis as any).cancelAnimationFrame) {
          (globalThis as any).cancelAnimationFrame(animationFrame);
        } else if (typeof window !== "undefined" && window.cancelAnimationFrame) {
          window.cancelAnimationFrame(animationFrame);
        }
      }
    };
  }, [target, duration]);

  return parseFloat(current.toFixed(decimals));
}
