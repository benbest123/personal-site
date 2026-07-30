/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 98.css@0.1.21 ships `@media (not(hover))`, which is invalid CSS syntax that
  // Vite's default Lightning CSS minifier rejects at build time. Ask Lightning CSS
  // to recover from parse errors instead of failing the build, until upstream fixes it.
  css: { lightningcss: { errorRecovery: true } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    coverage: { provider: "v8", reporter: ["text", "lcov"] },
  },
});
