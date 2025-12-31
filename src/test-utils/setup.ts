import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Polyfill requestAnimationFrame and cancelAnimationFrame for test environment
// These need to be available before any modules that use them are imported
const rafPolyfill = (cb: FrameRequestCallback) => {
  return setTimeout(cb, 16) as unknown as number;
};

const cafPolyfill = (id: number) => {
  clearTimeout(id);
};

// Define on all possible global objects to ensure they're accessible
const defineGlobal = (name: string, value: any) => {
  Object.defineProperty(globalThis, name, {
    writable: true,
    configurable: true,
    value,
  });

  Object.defineProperty(globalThis, name, {
    writable: true,
    configurable: true,
    value,
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, name, {
      writable: true,
      configurable: true,
      value,
    });
  }
};

defineGlobal("requestAnimationFrame", rafPolyfill);
defineGlobal("cancelAnimationFrame", cafPolyfill);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
