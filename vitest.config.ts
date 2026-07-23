import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    environmentOptions: {
      jsdom: {
        url: "http://localhost/"
      }
    },
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/comments/**/*.ts",
        "src/db/**/*.ts",
        "src/engine/**/*.ts",
        "src/filters/**/*.ts",
        "src/stores/**/*.ts",
        "src/utils/**/*.ts",
        "src/workers/diff/parser.ts",
        "src/workers/diff/patchId.ts"
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85
      }
    }
  }
});
