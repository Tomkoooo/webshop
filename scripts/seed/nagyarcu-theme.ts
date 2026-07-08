#!/usr/bin/env npx tsx
/**
 * Apply nagyarcu logo-yellow theme only (with backup).
 *
 *   SEED_DB_URL="mongodb+srv://.../nagyarcu_shop" npm run seed:nagyarcu-theme
 */
import "dotenv/config"
import mongoose from "mongoose"
import ThemeSetting from "../../src/models/ThemeSetting"
import { nagyarcuThemeColors, NAGYARCU_YELLOW } from "./lib/nagyarcu-theme"
import { backupCollectionsBeforeSeed } from "./lib/safe-seed-backup"

const uri = process.env.SEED_DB_URL || process.env.DATABASE_URL
const TEMPLATE_ID = "default-modern"

async function applyTheme() {
  const colors = nagyarcuThemeColors
  const payload = { colors, overridesOnly: true }

  await ThemeSetting.findOneAndUpdate({ key: "theme" }, { $set: { key: "theme", ...payload } }, { upsert: true })
  await ThemeSetting.findOneAndUpdate(
    { key: `theme:${TEMPLATE_ID}` },
    { $set: { key: `theme:${TEMPLATE_ID}`, ...payload } },
    { upsert: true }
  )
  console.log(`  Theme applied: dark primary chip + brand yellow accent (${NAGYARCU_YELLOW}) + orange secondary`)
}

async function main() {
  if (!uri) {
    console.error("SEED_DB_URL or DATABASE_URL required")
    process.exit(1)
  }

  const dbLabel = uri.includes("@") ? uri.replace(/\/\/[^@]+@/, "//***@") : uri
  console.log(`Connecting to ${dbLabel} …`)
  await mongoose.connect(uri)

  await backupCollectionsBeforeSeed("nagyarcu-theme", ["themesettings"], {
    key: { $in: ["theme", `theme:${TEMPLATE_ID}`] },
  })

  await applyTheme()
  console.log("Nagyarcu theme seed complete.")
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
