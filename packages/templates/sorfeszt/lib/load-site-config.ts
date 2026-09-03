import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"

export async function loadSorfesztSiteConfig(templateId: string) {
  if (templateId !== "sorfeszt") return null
  return loadTBookStorefrontConfig(templateId)
}
