import { getRequestPageContent } from "@wse/core/lib/cached-storefront"
import type { ChromeNavItem } from "@wse/sdk/templates/types"
import {
  extractTBookHomeChrome,
  navItemsFromTBookChrome,
  type TBookHomeChromeConfig,
} from "./storefront-chrome"

export type TBookStorefrontConfig = TBookHomeChromeConfig & {
  navItems: ChromeNavItem[]
}

/** Reads tBook API key + CMS nav from published home content (`chrome` block). */
export async function loadTBookStorefrontConfig(
  templateId: string
): Promise<TBookStorefrontConfig> {
  try {
    const content = await getRequestPageContent(templateId, "page:home")
    const chrome = extractTBookHomeChrome(content)
    return {
      ...chrome,
      navItems: navItemsFromTBookChrome(chrome),
    }
  } catch {
    return { nav: [], tbookApiKey: "", navItems: [] }
  }
}
