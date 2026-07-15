/** Root class for World Darts Festival storefront pages (home, tBook, static). */
export const WDF_STOREFRONT_ROOT_CLASS = "wdf-storefront"

/** Applied to tBook plugin route mains on WDF deploys. */
export const WDF_TBOOK_PAGE_CLASS = "wdf-tbook-page"

export function isWdfTemplate(templateId: string | null | undefined): boolean {
  return templateId === "world-darts-festival"
}
