import { deepMergeRecords } from "@wse/core/lib/deep-merge-records"
import { homeSchema, type HomeContent } from "../pages/home/schema"
import { normalizeWdfSectionLayout } from "./wdf-home-sections"

/** Coerce partial / legacy stored JSON into a full WDF home snapshot. */
export function normalizeWdfHomeContent(raw: unknown, fallback: HomeContent): HomeContent {
  const partial =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? ({ ...(raw as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  // Legacy flat hero image at root (eventstructure-style drafts).
  if (typeof partial.heroImage === "string" && partial.hero === undefined) {
    partial.hero = {
      ...(fallback.hero as unknown as Record<string, unknown>),
      heroImage: partial.heroImage,
    }
    delete partial.heroImage
  }

  const merged = deepMergeRecords(
    fallback as unknown as Record<string, unknown>,
    partial
  )
  if (merged.sectionLayout !== undefined) {
    merged.sectionLayout = normalizeWdfSectionLayout(merged.sectionLayout)
  }
  const parsed = homeSchema.safeParse(merged)
  return parsed.success ? parsed.data : fallback
}
