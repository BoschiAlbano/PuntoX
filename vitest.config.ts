/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // jsdom para tests de componentes React (Testing Library)
    environmentMatchGlobs: {
      "src/components/**/*.test.{ts,tsx}": "jsdom",
      "src/**/*.test.tsx": "jsdom",
    },
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.config.*",
        "**/dist/",
        "**/.next/",
      ],
    },
    // Solo incluir archivos de test
    include: ["src/**/*.test.{ts,tsx}"],
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

