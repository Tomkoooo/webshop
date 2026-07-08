#!/usr/bin/env npx tsx
/**
 * One-time finalizer for the legacy ShopContent homepage keys (engine v2).
 *
 * Copies `homepage_snapshot_published` / `homepage_snapshot_draft` from the
 * flat ShopContent collection into TemplateContent (`page:home` for the DB's
 * active template) when TemplateContent has no homepage document yet, then
 * deletes the legacy keys. Backs up both collections first.
 *
 *   SEED_DB_URL="mongodb+srv://.../<customer-db>" npx tsx scripts/cms/finalize-legacy-shop-content.ts
 *   # add --dry-run to report without writing
 */
import "dotenv/config"
import mongoose from "mongoose"
import ShopContent from "@wse/core/models/ShopContent"
import TemplateContent from "@wse/core/models/TemplateContent"
import ActiveTemplate from "@wse/core/models/ActiveTemplate"
import { homepageSnapshotSchema } from "@wse/core/features/homepage-cms/types/homepage-schema"
import { backupCollectionsBeforeSeed } from "../seed/lib/safe-seed-backup"

const uri = process.env.SEED_DB_URL || process.env.DATABASE_URL
const dryRun = process.argv.includes("--dry-run")

const LEGACY_KEYS = ["homepage_snapshot_published", "homepage_snapshot_draft"] as const

function parseSnapshot(raw: string | undefined | null) {
  if (!raw) return null
  try {
    return homepageSnapshotSchema.parse(JSON.parse(raw))
  } catch {
    return null
  }
}

async function main() {
  if (!uri) {
    console.error("Set SEED_DB_URL (or DATABASE_URL) to the customer database.")
    process.exit(1)
  }
  await mongoose.connect(uri)
  console.log(`Connected to database: ${mongoose.connection.db?.databaseName}`)

  const legacyDocs = await ShopContent.find({ key: { $in: [...LEGACY_KEYS] } }).lean()
  if (legacyDocs.length === 0) {
    console.log("No legacy homepage ShopContent keys found — nothing to do.")
    await mongoose.disconnect()
    return
  }

  const activeDoc = await ActiveTemplate.findOne().lean()
  const templateId = (activeDoc?.templateId as string) || "default-modern"
  console.log(`Active template: ${templateId}`)

  const byKey = new Map(legacyDocs.map((d) => [d.key as string, d.value as string]))
  const published = parseSnapshot(byKey.get("homepage_snapshot_published"))
  const draft = parseSnapshot(byKey.get("homepage_snapshot_draft"))

  const existing = await TemplateContent.findOne({ templateId, pageKey: "page:home" }).lean()

  if (dryRun) {
    console.log(
      `[dry-run] legacy keys: ${legacyDocs.map((d) => d.key).join(", ")}; ` +
        `published snapshot ${published ? "valid" : "missing/invalid"}; ` +
        `TemplateContent page:home ${existing ? "already exists (would only delete legacy keys)" : "missing (would migrate)"}`
    )
    await mongoose.disconnect()
    return
  }

  await backupCollectionsBeforeSeed("finalize-legacy-shop-content", [
    "shopcontents",
    "templatecontents",
  ])

  if (!existing && published) {
    await TemplateContent.create({
      templateId,
      pageKey: "page:home",
      value: JSON.stringify(published),
      ...(draft && JSON.stringify(draft) !== JSON.stringify(published)
        ? { draftValue: JSON.stringify(draft) }
        : {}),
      publishedAt: new Date(),
      publishedBy: "finalize-legacy-shop-content",
    })
    console.log(`Migrated legacy homepage snapshot → TemplateContent(${templateId}, page:home)`)
  } else if (!existing && !published) {
    console.error(
      "Legacy keys exist but no valid published snapshot; aborting without deleting legacy keys."
    )
    await mongoose.disconnect()
    process.exit(1)
  } else {
    console.log("TemplateContent homepage already exists — keeping it, only removing legacy keys.")
  }

  const deleted = await ShopContent.deleteMany({ key: { $in: [...LEGACY_KEYS] } })
  console.log(`Deleted ${deleted.deletedCount} legacy ShopContent key(s). Done.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
