/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Prevent duplicate React instances from symlinked @canopy-ds packages
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    // Force Vite to pre-bundle tldraw's ESM internals
    include: ["tldraw"],
  },
  test: {
    // Playwright owns everything under e2e/ — keep Vitest's discovery scoped
    // to src/ unit tests so `npm test` doesn't try to load .spec files that
    // import @playwright/test.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
