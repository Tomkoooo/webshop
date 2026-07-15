import { z } from "zod"

export const WDF_HOME_SECTION_IDS = [
  "hero",
  "festival",
  "infoCards",
  "venue",
  "schedule",
  "fees",
  "prizeMoney",
  "sponsors",
  "contact",
] as const

export type WdfHomeSectionId = (typeof WDF_HOME_SECTION_IDS)[number]

export const WDF_SECTION_LABELS: Record<WdfHomeSectionId, string> = {
  hero: "Hero",
  festival: "Fesztivál bevezető",
  infoCards: "Info kártyák",
  venue: "Helyszín",
  schedule: "Program",
  fees: "Nevezési díjak",
  prizeMoney: "Díjazás",
  sponsors: "Partnerek",
  contact: "Kapcsolat",
}

export const wdfSectionLayoutEntrySchema = z.object({
  id: z.enum(WDF_HOME_SECTION_IDS),
  enabled: z.boolean(),
})

export type WdfSectionLayoutEntry = z.infer<typeof wdfSectionLayoutEntrySchema>

export const DEFAULT_WDF_SECTION_LAYOUT: WdfSectionLayoutEntry[] = WDF_HOME_SECTION_IDS.map(
  (id) => ({ id, enabled: true })
)

/** Merge stored layout with defaults (handles new sections added in later versions). */
export function normalizeWdfSectionLayout(raw: unknown): WdfSectionLayoutEntry[] {
  if (!Array.isArray(raw)) return DEFAULT_WDF_SECTION_LAYOUT.map((row) => ({ ...row }))
  const byId = new Map<WdfHomeSectionId, WdfSectionLayoutEntry>()
  for (const item of raw) {
    const parsed = wdfSectionLayoutEntrySchema.safeParse(item)
    if (parsed.success) byId.set(parsed.data.id, parsed.data)
  }
  const ordered: WdfSectionLayoutEntry[] = []
  for (const item of raw) {
    const parsed = wdfSectionLayoutEntrySchema.safeParse(item)
    if (parsed.success && !ordered.some((row) => row.id === parsed.data.id)) {
      ordered.push(parsed.data)
    }
  }
  for (const id of WDF_HOME_SECTION_IDS) {
    if (!ordered.some((row) => row.id === id)) {
      ordered.push({ id, enabled: byId.get(id)?.enabled ?? true })
    }
  }
  return ordered
}
