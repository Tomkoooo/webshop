import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"

export async function loadWdfSiteConfig(templateId: string) {
  if (templateId !== "world-darts-festival") return null
  return loadTBookStorefrontConfig(templateId)
}
