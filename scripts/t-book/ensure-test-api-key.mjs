#!/usr/bin/env node
/**
 * Ensures .env NEXT_PUBLIC_TBOOK_TEST_API_KEY matches the richest active t-book group
 * (prefers the group with the most active events / hotels — WDF EUR inventory).
 *
 *   npm run tbook:ensure-api-key
 */
import { createHash, randomBytes } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { MongoClient } from "mongodb"
import { config } from "dotenv"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
config({ path: path.join(root, ".env"), override: true })

const uri = process.env.DATABASE_URL?.trim()
if (!uri) {
  console.error("DATABASE_URL missing")
  process.exit(1)
}

function generateApiKey() {
  return `tbk_${randomBytes(24).toString("hex")}`
}

function hashApiKey(plaintext) {
  return createHash("sha256").update(plaintext).digest("hex")
}

function apiKeyHint(plaintext) {
  return `${plaintext.slice(0, 8)}…${plaintext.slice(-4)}`
}

function upsertEnvKey(envPath, key, value) {
  const raw = readFileSync(envPath, "utf8")
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, "m")
  const next = re.test(raw) ? raw.replace(re, line) : `${raw.replace(/\s*$/, "")}\n${line}\n`
  writeFileSync(envPath, next)
}

const client = new MongoClient(uri)
await client.connect()
const db = client.db()
if (db.databaseName !== "tbook-admin") {
  console.warn(`Warning: connected to "${db.databaseName}" (expected tbook-admin)`)
}

const groups = await db.collection("tbookeventgroups").find({ status: "active" }).toArray()
if (groups.length === 0) {
  console.error("No active t-book event group found")
  await client.close()
  process.exit(1)
}

const scored = []
for (const group of groups) {
  const eventCount = await db.collection("tbookevents").countDocuments({
    groupId: group._id,
    status: "active",
  })
  const hotelCount = await db.collection("tbookhotels").countDocuments({
    status: "active",
    $or: [{ groupId: group._id }],
  })
  const eurEvents = await db.collection("tbookevents").countDocuments({
    groupId: group._id,
    status: "active",
    currency: "EUR",
  })
  scored.push({
    group,
    eventCount,
    hotelCount,
    eurEvents,
    score: eventCount * 10 + hotelCount * 5 + eurEvents * 20,
  })
}

scored.sort((a, b) => b.score - a.score)
const best = scored[0]
const group = best.group

const apiKey = generateApiKey()
const now = new Date()
await db.collection("tbookeventgroups").updateOne(
  { _id: group._id },
  {
    $set: {
      apiKeyHash: hashApiKey(apiKey),
      apiKeyHint: apiKeyHint(apiKey),
      apiKeyCreatedAt: now,
      updatedAt: now,
    },
  }
)

const envPath = path.join(root, ".env")
upsertEnvKey(envPath, "NEXT_PUBLIC_TBOOK_TEST_API_KEY", apiKey)

console.log(`DB: ${db.databaseName}`)
console.log(
  `Rotated API key for "${group.name}" (${String(group._id)}) — ${best.eventCount} events, ${best.hotelCount} hotels, ${best.eurEvents} EUR`
)
console.log(`Hint: ${apiKeyHint(apiKey)}`)
console.log(`Updated ${envPath}`)
console.log(apiKey)

await client.close()
