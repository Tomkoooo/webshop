import { getRequestPageContent } from "@wse/core/lib/cached-storefront"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { extractMineshowSiteConfig, type MineshowSiteConfig } from "./site-config"

/** Loads Mineshow venue/map settings from published homepage CMS content. */
export async function loadMineshowSiteConfig(
  templateId: string
): Promise<MineshowSiteConfig | null> {
  if (templateId !== "minecraft-camp") return null
  try {
    const content = await getRequestPageContent<HomepageSnapshot>(templateId, "page:home")
    return extractMineshowSiteConfig(content)
  } catch {
    return null
  }
}
