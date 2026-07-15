export type CmsSiteSettingsSection = "theme" | "seo" | "branding" | "footer" | "contact"

export const CMS_SITE_SETTINGS_SECTIONS: Array<{
  id: CmsSiteSettingsSection
  label: string
  description: string
}> = [
  {
    id: "theme",
    label: "Téma",
    description: "Színek, tipográfia — az egész webshop megjelenése.",
  },
  {
    id: "seo",
    label: "SEO",
    description: "Meta címek, leírások, favicon, megosztási kép.",
  },
  {
    id: "branding",
    label: "Márka és logók",
    description: "Bolt neve, navbar és lábléc logók.",
  },
  {
    id: "footer",
    label: "Lábléc",
    description: "Lábléc szövegek, gyors linkek, közösségi média.",
  },
  {
    id: "contact",
    label: "Kapcsolat",
    description: "E-mailek, telefon, cím — lábléc és kapcsolat űrlap.",
  },
]

export function parseCmsSiteSettingsSection(
  value: string | undefined,
  allowedSections: ReadonlyArray<{ id: CmsSiteSettingsSection }> = CMS_SITE_SETTINGS_SECTIONS
): CmsSiteSettingsSection {
  const found = allowedSections.find((s) => s.id === value)
  return found?.id ?? allowedSections[0]?.id ?? "theme"
}
