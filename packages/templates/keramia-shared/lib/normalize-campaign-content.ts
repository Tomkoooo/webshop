import { deepMergeRecords } from "@wse/core/lib/deep-merge-records"
import {
  campaignPageSchema,
  type CampaignPageContent,
} from "../static-pages/shared/schema"

/** Coerce partial / legacy stored JSON into a full campaign snapshot. */
export function normalizeCampaignContent(
  raw: unknown,
  fallback: CampaignPageContent
): CampaignPageContent {
  const partial =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const merged = deepMergeRecords(
    fallback as unknown as Record<string, unknown>,
    partial
  )
  const parsed = campaignPageSchema.safeParse(merged)
  return parsed.success ? parsed.data : fallback
}
