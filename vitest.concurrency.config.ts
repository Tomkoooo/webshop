import "dotenv/config";
import path from "path";
import { defineConfig } from "vitest/config";
import { wseAliases } from "./vitest.aliases";

/** Local / CI: inventory race tests (Mongo memory server). Not part of default `vitest.config.ts` runs. */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup/concurrency-env.ts"],
    env: { VITEST_CONCURRENCY: "1" },
    include: ["tests/concurrency/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      /** Live Stripe; run manually with RUN_STRIPE_RACE_TESTS=1 */
      "tests/concurrency/stripe-checkout-race.test.ts",
    ],
    /** One worker + serial files: shared in-memory Mongo and destructive clears must not overlap. */
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: wseAliases(path.resolve(__dirname)),
  },
});
