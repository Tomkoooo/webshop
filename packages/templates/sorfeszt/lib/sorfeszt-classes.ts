/** Root class for Sörfeszt storefront pages (home, tBook, static). */
export const SORFESZT_STOREFRONT_ROOT_CLASS = "sorfeszt-storefront"

export function isSorfesztTemplate(templateId: string | null | undefined): boolean {
  return templateId === "sorfeszt"
}
