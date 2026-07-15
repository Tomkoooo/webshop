/** Storefront main wrapper classes for tBook plugin routes. */
export function tBookMainClassName(templateId: string): string {
  if (templateId === "world-darts-festival") {
    return "wdf-tbook-page min-h-[70vh] px-4 py-10"
  }
  return "min-h-[70vh] bg-background px-4 py-10"
}

export function tBookListVariant(templateId: string): "default" | "wdf" {
  return templateId === "world-darts-festival" ? "wdf" : "default"
}
