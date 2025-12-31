import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/main.tsx"],
  project: ["src/**/*.{ts,tsx}"],
  ignore: [
    "dist/**",
    "node_modules/**",
    "netlify/**",
    "*.config.{ts,js}",
    "vitest.config.ts",
    "vite.config.ts",
  ],
  vitest: {
    entry: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
};

export default config;
