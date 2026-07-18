#!/usr/bin/env node
/**
 * Full MongoDB backup before t-book live experiments.
 *
 * Uses DATABASE_URL (or MONGODB_URI / SEED_DB_URL) and writes a timestamped
 * dump under backups/t-book/ (gitignored).
 *
 * Requires `mongodump` on PATH (MongoDB Database Tools).
 *
 *   node scripts/t-book/backup-database.mjs
 *   npm run tbook:backup-db
 */
import { spawnSync } from "node:child_process"
import { mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
config({ path: path.join(root, ".env") })

const uri =
  process.env.DATABASE_URL?.trim() ||
  process.env.MONGODB_URI?.trim() ||
  process.env.SEED_DB_URL?.trim()

if (!uri) {
  console.error("Missing DATABASE_URL / MONGODB_URI / SEED_DB_URL in .env")
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-")
const outDir = path.join(root, "backups", "t-book", `full-${stamp}`)
mkdirSync(outDir, { recursive: true })

console.log(`Backing up database → ${outDir}`)
const result = spawnSync("mongodump", [`--uri=${uri}`, `--out=${outDir}`], {
  stdio: "inherit",
})

if (result.error?.code === "ENOENT") {
  console.error("mongodump not found. Install MongoDB Database Tools first.")
  process.exit(1)
}

if (result.status !== 0) {
  console.error("Backup failed.")
  process.exit(result.status ?? 1)
}

console.log("Backup complete. Hotels/events collections were not modified.")
console.log(`Restore tip: mongorestore --uri="<DATABASE_URL>" --drop "${outDir}"`)
