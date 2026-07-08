import { getCachedFeatureFlag, getCachedLegalLinks } from "@wse/core/lib/cached-storefront"
import type { StorefrontLegalLink } from "@wse/core/lib/cached-storefront"

export type StorefrontFooterHydrationProps = {
  newsletterEnabled: boolean
  legalLinks: StorefrontLegalLink[]
}

export async function getStorefrontFooterHydrationProps(): Promise<StorefrontFooterHydrationProps> {
  const [newsletterEnabled, legalLinks] = await Promise.all([
    getCachedFeatureFlag("newsletter", false),
    getCachedLegalLinks(),
  ])
  return { newsletterEnabled, legalLinks }
}
