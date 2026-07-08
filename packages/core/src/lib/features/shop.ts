import { NextResponse } from "next/server"

/**
 * When `ENABLE_SHOP` is set to the string `"false"`, storefront and shop admin
 * surfaces are disabled. Any other value (including unset) keeps the shop on
 * for backward compatibility.
 */
export function isShopEnabled(): boolean {
  return process.env.ENABLE_SHOP !== "false"
}

export function shopDisabledResponse(): NextResponse {
  return NextResponse.json(
    { error: "Shop is disabled", code: "SHOP_DISABLED" },
    { status: 404 }
  )
}

/** Early return for HTTP handlers when `ENABLE_SHOP=false`. */
export function shopCommerceBlockedResponse(): NextResponse | null {
  if (isShopEnabled()) return null
  return shopDisabledResponse()
}

/** Public URL prefixes blocked when the shop is disabled. */
export const SHOP_DISABLED_PUBLIC_PREFIXES = [
  "/shop",
  "/products",
  "/cart",
  "/checkout",
  "/profile",
] as const

/**
 * Admin URL prefixes blocked when the product catalog / cart is off.
 * Payment methods, coupons, Számlázz (feature flag), and emails stay available for camp/plugin checkout.
 * `/admin/users` stays available so camp-only deployments can manage ADMIN roles (see admin layout).
 */
export const SHOP_DISABLED_ADMIN_PREFIXES = [
  "/admin/orders",
  "/admin/stats",
  "/admin/reviews",
  "/admin/products",
  "/admin/categories",
  "/admin/shipping",
  "/admin/shop",
] as const

export function isShopPublicPath(pathname: string): boolean {
  return SHOP_DISABLED_PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

export function isShopAdminPath(pathname: string): boolean {
  return SHOP_DISABLED_ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

