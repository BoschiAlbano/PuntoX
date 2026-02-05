/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // Configuración para tests de UI (jsdom)
    environmentMatchGlobs: [
      ["**/testing/components/**/*.test.{ts,tsx}", "jsdom"],
      ["**/testing/ui/**/*.test.{ts,tsx}", "jsdom"],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "testing/utils/",
        "**/*.config.*",
        "**/dist/",
        "**/.next/",
      ],
    },
    // Incluir archivos de test en src y testing
    include: [
      "src/**/*.test.{ts,tsx}",
      "testing/**/*.test.{ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    target: "node18",
  },
  // Configurar para que no intente cargar PostCSS
  publicDir: false,
});

