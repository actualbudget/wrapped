import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-utils/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
  },
});
