#!/usr/bin/env npx tsx
/**
 * Restore nagyarcu homepage CMS + logo-yellow theme (with pre-write backup).
 *
 *   SEED_DB_URL="mongodb+srv://.../nagyarcu_shop" npm run seed:nagyarcu-restore
 */
import "dotenv/config"
import mongoose from "mongoose"
import TemplateContent from "../../src/models/TemplateContent"
import ThemeSetting from "../../src/models/ThemeSetting"
import { homepageSnapshotSchema } from "../../src/features/homepage-cms/types/homepage-schema"
import { buildNagyarcuHomepageSnapshot } from "./lib/nagyarcu-homepage-content"
import { nagyarcuThemeColors } from "./lib/nagyarcu-theme"
import { backupCollectionsBeforeSeed } from "./lib/safe-seed-backup"

const uri = process.env.SEED_DB_URL || process.env.DATABASE_URL
const TEMPLATE_ID = "default-modern"
const PAGE_KEY = "page:home"

async function restoreTheme() {
  const colors = nagyarcuThemeColors
  const payload = { colors, overridesOnly: true }

  await ThemeSetting.findOneAndUpdate({ key: "theme" }, { $set: { key: "theme", ...payload } }, { upsert: true })
  await ThemeSetting.findOneAndUpdate(
    { key: `theme:${TEMPLATE_ID}` },
    { $set: { key: `theme:${TEMPLATE_ID}`, ...payload } },
    { upsert: true }
  )
  console.log("  Theme: logo yellow (#FFEA00) restored on theme + theme:default-modern")
}

async function restoreHomepage() {
  const snapshot = homepageSnapshotSchema.parse(buildNagyarcuHomepageSnapshot())
  const json = JSON.stringify(snapshot)
  const now = new Date()

  await TemplateContent.findOneAndUpdate(
    { templateId: TEMPLATE_ID, pageKey: PAGE_KEY },
    {
      $set: {
        templateId: TEMPLATE_ID,
        pageKey: PAGE_KEY,
        value: json,
        draftValue: json,
        publishedAt: now,
        publishedBy: "seed:nagyarcu-restore",
      },
    },
    { upsert: true }
  )
  console.log("  Homepage CMS: Hungarian content + press testimonials published")
}

async function main() {
  if (!uri) {
    console.error("SEED_DB_URL or DATABASE_URL required")
    process.exit(1)
  }

  const dbLabel = uri.includes("@") ? uri.replace(/\/\/[^@]+@/, "//***@") : uri
  console.log(`Connecting to ${dbLabel} …`)
  await mongoose.connect(uri)

  await backupCollectionsBeforeSeed("nagyarcu-restore-template", ["templatecontents"], {
    templateId: TEMPLATE_ID,
    pageKey: PAGE_KEY,
  })
  await backupCollectionsBeforeSeed("nagyarcu-restore-theme", ["themesettings"], {
    key: { $in: ["theme", `theme:${TEMPLATE_ID}`] },
  })

  await restoreTheme()
  await restoreHomepage()

  console.log("Nagyarcu restore complete.")
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
