#!/usr/bin/env node
/**
 * Start a Next site app with the repo-root .env loaded.
 *
 *   node scripts/t-book/dev-with-env.mjs world-darts-festival 3101
 *   node scripts/t-book/dev-with-env.mjs reference 3100
 */
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
config({ path: path.join(root, ".env") })

const site = process.argv[2] || "world-darts-festival"
const port = process.argv[3] || "3101"
const appDir = path.join(root, "apps", site)
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next")

if (!process.env.DATABASE_URL && !process.env.MONGODB_URI) {
  console.error("DATABASE_URL missing after loading .env")
  process.exit(1)
}

// Site apps bake identity in next.config, but legacy registry still reads DEPLOYMENT_KEY.
const deploymentKey =
  process.env.DEPLOYMENT_KEY?.trim() ||
  (site === "world-darts-festival" ? "world-darts-festival" : process.env.DEPLOYMENT_KEY)

const childEnv = { ...process.env }
delete childEnv.NODE_OPTIONS
if (site === "world-darts-festival" && !process.env.DEPLOYMENT_KEY?.includes("world-darts")) {
  childEnv.DEPLOYMENT_KEY = "world-darts-festival"
} else if (deploymentKey) {
  childEnv.DEPLOYMENT_KEY = deploymentKey
}
// Matrix live tests quote every event×hotel path — raise the public quote/booking window.
if (!childEnv.TBOOK_RATE_LIMIT_OVERRIDE) {
  childEnv.TBOOK_RATE_LIMIT_OVERRIDE = "5000"
}

const child = spawn(
  process.execPath,
  [nextBin, "dev", "--webpack", "--port", String(port)],
  {
    cwd: appDir,
    stdio: "inherit",
    env: childEnv,
  }
)

child.on("exit", (code) => process.exit(code ?? 0))
