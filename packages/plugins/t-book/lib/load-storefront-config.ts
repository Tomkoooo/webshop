import { getRequestPageContent } from "@wse/core/lib/cached-storefront"
import type { ChromeNavCta, ChromeNavItem } from "@wse/sdk/templates/types"
import {
  defaultNavCta,
  extractTBookHomeChrome,
  navCtaFromTBookChrome,
  navItemsFromTBookChrome,
  type TBookHomeChromeConfig,
} from "./storefront-chrome"

export type TBookStorefrontConfig = TBookHomeChromeConfig & {
  navItems: ChromeNavItem[]
  navCta: ChromeNavCta
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
      navCta: navCtaFromTBookChrome(chrome),
    }
  } catch {
    return { nav: [], navCta: defaultNavCta, tbookApiKey: "", navItems: [] }
  }
}
