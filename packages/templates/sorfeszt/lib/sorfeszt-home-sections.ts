import { z } from "zod"

export const SORFESZT_HOME_SECTION_IDS = [
  "hero",
  "venue",
  "tickets",
  "beers",
  "schedule",
  "hours",
  "gallery",
  "contact",
] as const

export type SorfesztHomeSectionId = (typeof SORFESZT_HOME_SECTION_IDS)[number]

export const SORFESZT_SECTION_LABELS: Record<SorfesztHomeSectionId, string> = {
  hero: "Hero",
  venue: "Helyszín",
  tickets: "Jegyek",
  beers: "Sörök",
  schedule: "Program",
  hours: "Nyitvatartás",
  gallery: "Galéria",
  contact: "Kapcsolat",
}

export const SORFESZT_SECTION_ANCHORS: Partial<Record<SorfesztHomeSectionId, string>> = {
  venue: "helyszin",
  tickets: "jegyek",
  beers: "sorok",
  schedule: "programok",
  hours: "nyitvatartas",
  gallery: "galeria",
  contact: "kapcsolat",
}

export const sorfesztSectionLayoutEntrySchema = z.object({
  id: z.enum(SORFESZT_HOME_SECTION_IDS),
  enabled: z.boolean(),
})

export type SorfesztSectionLayoutEntry = z.infer<typeof sorfesztSectionLayoutEntrySchema>

export const DEFAULT_SORFESZT_SECTION_LAYOUT: SorfesztSectionLayoutEntry[] =
  SORFESZT_HOME_SECTION_IDS.map((id) => ({ id, enabled: true }))

export function normalizeSorfesztSectionLayout(raw: unknown): SorfesztSectionLayoutEntry[] {
  if (!Array.isArray(raw)) return DEFAULT_SORFESZT_SECTION_LAYOUT.map((row) => ({ ...row }))
  const ordered: SorfesztSectionLayoutEntry[] = []
  for (const item of raw) {
    const parsed = sorfesztSectionLayoutEntrySchema.safeParse(item)
    if (parsed.success && !ordered.some((row) => row.id === parsed.data.id)) {
      ordered.push(parsed.data)
    }
  }
  for (const id of SORFESZT_HOME_SECTION_IDS) {
    if (!ordered.some((row) => row.id === id)) {
      ordered.push({ id, enabled: true })
    }
  }
  return ordered
}
