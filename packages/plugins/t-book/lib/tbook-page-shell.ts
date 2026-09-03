export function isTBookThemedLanding(templateId: string): boolean {
  return templateId === "world-darts-festival" || templateId === "sorfeszt"
}

/** Storefront main wrapper classes for tBook plugin routes. */
export function tBookMainClassName(templateId: string): string {
  if (templateId === "world-darts-festival") {
    return "wdf-tbook-page min-h-[70vh] px-4 py-10"
  }
  if (templateId === "sorfeszt") {
    return "sorfeszt-storefront sorfeszt-tbook-page min-h-[70vh] px-4 py-10"
  }
  return "min-h-[70vh] bg-background px-4 py-10"
}

export function tBookListVariant(templateId: string): "default" | "wdf" | "sorfeszt" {
  if (templateId === "world-darts-festival") return "wdf"
  if (templateId === "sorfeszt") return "sorfeszt"
  return "default"
}

export function tBookStorefrontRootClass(templateId: string): string {
  if (templateId === "world-darts-festival") return "wdf-storefront"
  if (templateId === "sorfeszt") return "sorfeszt-storefront"
  return ""
}

export function tBookCopyTone(templateId: string): "entries" | "tickets" {
  return templateId === "sorfeszt" ? "tickets" : "entries"
}

/** Plugin microcopy locale. CMS page docs stay on the request locale so publish keys stay unsuffixed. */
export function tBookUiLocale(templateId: string, requestLocale?: string): string {
  if (templateId === "sorfeszt") return "hu"
  return requestLocale?.trim() || "en"
}
