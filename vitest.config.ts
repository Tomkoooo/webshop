import path from "path";
import { defineConfig } from "vitest/config";
import { wseAliases } from "./vitest.aliases";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup/test-env.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/concurrency/**"],
    env: { VITEST_INTEGRATION: "1" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
      include: [
        "packages/core/src/actions/admin-orders.ts",
        "packages/core/src/actions/admin-checkout.ts",
        "packages/core/src/actions/admin-flags.ts",
      ],
    },
  },
  resolve: {
    alias: wseAliases(path.resolve(__dirname)),
  },
});
