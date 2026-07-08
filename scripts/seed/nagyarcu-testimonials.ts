#!/usr/bin/env npx tsx
/**
 * Patch ONLY the homepage testimonials block for nagyarcu — nothing else.
 *
 *   SEED_DB_URL="mongodb+srv://.../nagyarcu_shop" npm run seed:nagyarcu-testimonials
 */
import "dotenv/config"
import mongoose from "mongoose"
import TemplateContent from "@wse/core/models/TemplateContent"
import { homepageSnapshotSchema } from "@wse/core/features/homepage-cms/types/homepage-schema"
import { nagyarcuPressTestimonialsBlock } from "./lib/nagyarcu-press-quotes"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { backupCollectionsBeforeSeed } from "./lib/safe-seed-backup"

const uri = process.env.SEED_DB_URL || process.env.DATABASE_URL
const TEMPLATE_ID = "default-modern"
const PAGE_KEY = "page:home"

function upsertTestimonialsBlock(snapshot: HomepageSnapshot): HomepageSnapshot {
  const blocks = [...snapshot.blocks]
  const existingIndex = blocks.findIndex((block) => block.type === "testimonials")
  const nextBlock = {
    ...nagyarcuPressTestimonialsBlock,
    id:
      existingIndex >= 0
        ? blocks[existingIndex]!.id
        : nagyarcuPressTestimonialsBlock.id,
  }

  if (existingIndex >= 0) {
    blocks[existingIndex] = nextBlock
  } else {
    const aboutIndex = blocks.findIndex((block) => block.type === "about")
    const insertAt = aboutIndex >= 0 ? aboutIndex + 1 : blocks.length
    blocks.splice(insertAt, 0, nextBlock)
  }

  return { ...snapshot, blocks }
}

function parseSnapshot(raw: string | undefined | null): HomepageSnapshot | null {
  if (!raw?.trim()) return null
  try {
    return homepageSnapshotSchema.parse(JSON.parse(raw))
  } catch {
    return null
  }
}

async function main() {
  if (!uri) {
    console.error("SEED_DB_URL or DATABASE_URL required")
    process.exit(1)
  }

  const dbLabel = uri.includes("@") ? uri.replace(/\/\/[^@]+@/, "//***@") : uri
  console.log(`Connecting to ${dbLabel} …`)
  await mongoose.connect(uri)

  await backupCollectionsBeforeSeed("nagyarcu-testimonials", ["templatecontents"], {
    templateId: TEMPLATE_ID,
    pageKey: PAGE_KEY,
  })

  const doc = await TemplateContent.findOne({ templateId: TEMPLATE_ID, pageKey: PAGE_KEY })
  if (!doc?.value?.trim()) {
    throw new Error(
      `No published homepage found for ${TEMPLATE_ID}/${PAGE_KEY}. Refusing to seed from defaults — restore CMS first.`
    )
  }

  const published = parseSnapshot(doc.value)
  if (!published) {
    throw new Error("Published homepage JSON is invalid — fix or restore before seeding testimonials.")
  }

  const nextPublished = upsertTestimonialsBlock(published)
  const publishedJson = JSON.stringify(nextPublished)

  const update: Record<string, unknown> = {
    value: publishedJson,
    publishedAt: new Date(),
    publishedBy: "seed:nagyarcu-testimonials",
  }

  if (doc.draftValue?.trim()) {
    const draft = parseSnapshot(doc.draftValue)
    if (draft) {
      update.draftValue = JSON.stringify(upsertTestimonialsBlock(draft))
    }
  }

  await TemplateContent.findOneAndUpdate({ templateId: TEMPLATE_ID, pageKey: PAGE_KEY }, { $set: update })

  const itemCount =
    nextPublished.blocks.find((b) => b.type === "testimonials")?.data.items?.length ?? 0
  console.log(`Patched testimonials only (${itemCount} items). No other CMS fields were changed.`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
