import { deepMergeRecords } from "@wse/core/lib/deep-merge-records"
import { homeSchema, type HomeContent } from "../pages/home/schema"
import { normalizeSorfesztSectionLayout } from "./sorfeszt-home-sections"

export function normalizeSorfesztHomeContent(raw: unknown, fallback: HomeContent): HomeContent {
  const partial =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? ({ ...(raw as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const merged = deepMergeRecords(fallback as unknown as Record<string, unknown>, partial)
  if (merged.sectionLayout !== undefined) {
    merged.sectionLayout = normalizeSorfesztSectionLayout(merged.sectionLayout)
  }
  const parsed = homeSchema.safeParse(merged)
  return parsed.success ? parsed.data : fallback
}
