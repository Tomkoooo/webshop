import { getRequestBrandingSettings } from "@wse/core/lib/cached-storefront"

/** Browser tab title for a storefront page: `{page} | {shopName}`. */
export function withStorefrontPageTitle(pageTitle: string, shopName: string): string {
  const page = pageTitle.trim()
  const shop = shopName.trim()
  if (!page) return shop
  if (!shop || page === shop) return page
  const suffix = ` | ${shop}`
  if (page.endsWith(suffix)) return page
  return `${page}${suffix}`
}

export async function getStorefrontShopName(): Promise<string> {
  const branding = await getRequestBrandingSettings()
  return branding.brandName
}
