import NextAuth from "next-auth"
import { authConfig } from "@wse/core/auth.config"
import { NextResponse } from "next/server"
import { isShopAdminPath, isShopEnabled, isShopPublicPath } from "@wse/core/lib/features/shop"
import { isPluginAdminPath, parsePluginAdminPath } from "@wse/core/lib/features/plugins"
import { isPluginAllowlistedForDeployment } from "@wse/core/config/deployments-registry"
import { getSiteLocaleConfig } from "@wse/core/lib/site-features"
import { LOCALE_HEADER, stripLocalePrefix } from "@wse/core/lib/locale"
import { LOCALE_COOKIE } from "@wse/sdk/i18n/constants"
import { isCampOnlyBlockedPath, isCampOnlyStorefront } from "@wse/core/lib/features/camp-storefront"
import {
  isPressKitPathForDeployment,
  isPressKitPluginAllowlisted,
} from "@wse/core/lib/features/press-kit-storefront"

const { auth } = NextAuth(authConfig)
const PUBLIC_FILE_REGEX = /\.[^/]+$/

const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
}

function nextWithPathname(req: Parameters<Parameters<typeof auth>[0]>[0]) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", req.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

/**
 * Builds an absolute same-origin URL from the actual incoming Host header rather than
 * `req.nextUrl.clone()` — in some dev/deploy setups `nextUrl`'s origin can pick up an
 * unrelated canonical URL (e.g. a mismatched AUTH_URL), which turns a rewrite or redirect
 * into an accidental cross-origin hop instead of staying on the real serving origin.
 */
function sameOriginUrl(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  pathname: string,
  search?: string
): URL {
  const host = req.headers.get("host") ?? req.nextUrl.host
  const url = new URL(pathname, `${req.nextUrl.protocol}//${host}`)
  if (search) url.search = search
  return url
}

function isConfiguredMaintenanceEnabled(): boolean {
  const raw = process.env.MAINTENANCE_MODE ?? process.env.NEXT_PUBLIC_MAINTENANCE_MODE
  return raw === "1" || raw?.toLowerCase() === "true"
}

/** Site apps wrap this in their own `middleware.ts` (see `wse sync` stub). */
export const storefrontMiddleware = auth(async (req) => {
  const pathname = req.nextUrl.pathname
  const isGoogleCallback = pathname.startsWith("/api/auth/callback/google")
  const isAuthRoute = pathname.startsWith("/api/auth")
  const isMaintenancePath = pathname === "/maintenance"
  const isNextInternal = pathname.startsWith("/_next")
  const isStaticAsset = pathname === "/favicon.ico" || PUBLIC_FILE_REGEX.test(pathname)

  if (isGoogleCallback) {
    const host = req.headers.get("host")
    const forwardedHost = req.headers.get("x-forwarded-host")
    const forwardedProto = req.headers.get("x-forwarded-proto")
    console.info("[auth][diagnostic] Google callback request", {
      pathname,
      host,
      forwardedHost,
      forwardedProto,
      nextUrlOrigin: req.nextUrl.origin,
    })
  }

  if (isAuthRoute || isMaintenancePath || isNextInternal || isStaticAsset) {
    return nextWithPathname(req)
  }

  const maintenanceEnabled = isConfiguredMaintenanceEnabled()
  const isAdminUser = req.auth?.user?.role === "ADMIN"
  if (maintenanceEnabled && !isAdminUser) {
    return NextResponse.redirect(new URL("/maintenance", req.nextUrl))
  }

  const isLoggedIn = !!req.auth
  const isAdminPath = pathname.startsWith("/admin")

  if (isAdminPath && !isLoggedIn) {
    const signInUrl = new URL("/auth/admin-login", req.nextUrl)
    signInUrl.searchParams.set("callbackUrl", "/admin")
    return NextResponse.redirect(signInUrl)
  }

  if (!isShopEnabled()) {
    if (isShopPublicPath(pathname)) {
      return new NextResponse(null, { status: 404 })
    }
    if (isAdminUser && isShopAdminPath(pathname)) {
      return new NextResponse(null, { status: 404 })
    }
  }

  const host = req.headers.get("host")
  if (isCampOnlyStorefront(host) && isCampOnlyBlockedPath(pathname)) {
    return new NextResponse(null, { status: 404 })
  }

  if (isPluginAdminPath(pathname)) {
    const parsed = parsePluginAdminPath(pathname)
    if (!parsed || !isPluginAllowlistedForDeployment(parsed.pluginId, host)) {
      return new NextResponse(null, { status: 404 })
    }
  }

  if (isPressKitPathForDeployment(pathname, host) && !isPressKitPluginAllowlisted(host)) {
    return new NextResponse(null, { status: 404 })
  }

  const previewCookie = req.cookies.get("wse_template_preview")
  if (previewCookie && !isAdminUser) {
    const response = nextWithPathname(req)
    response.cookies.delete("wse_template_preview")
    return response
  }

  /**
   * Opt-in locale routing: only sites that bake a `locales` config into `WSE_SITE_CONFIG_JSON`
   * (see `getSiteLocaleConfig`) reach this block. `/hu/...` is rewritten to the existing
   * `/...` route tree (no new route files anywhere) while the browser URL stays `/hu/...`;
   * the resolved locale travels downstream via the `x-wse-locale` header. The default locale
   * keeps its unprefixed URL, so existing links/bookmarks are untouched.
   *
   * A `wse_locale` cookie remembers the visitor's last-resolved locale so new tabs, bookmarks,
   * and typed URLs to the unprefixed site don't reset to the default language: an explicit
   * URL prefix always wins and re-syncs the cookie; an unprefixed request instead redirects
   * to the cookie's locale when it differs from the default.
   */
  const localeConfig = getSiteLocaleConfig()
  if (localeConfig) {
    const match = stripLocalePrefix(pathname, localeConfig.supported)
    // Admin/auth must stay unprefixed and must not rewrite the visitor's language cookie.
    const skipStorefrontLocale = isAdminPath || pathname.startsWith("/auth")

    if (match && match.locale !== localeConfig.default) {
      const url = sameOriginUrl(req, match.rest, req.nextUrl.search)
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-pathname", pathname)
      requestHeaders.set(LOCALE_HEADER, match.locale)
      const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      res.cookies.set(LOCALE_COOKIE, match.locale, LOCALE_COOKIE_OPTIONS)
      return res
    }

    // `/en/...` when `en` is the default — canonicalize to the unprefixed URL and sync cookie.
    if (match && match.locale === localeConfig.default) {
      const target = sameOriginUrl(
        req,
        match.rest,
        req.nextUrl.search
      )
      const res = NextResponse.redirect(target)
      res.cookies.set(LOCALE_COOKIE, localeConfig.default, LOCALE_COOKIE_OPTIONS)
      return res
    }

    if (!match && !skipStorefrontLocale) {
      const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value
      if (
        cookieLocale &&
        cookieLocale !== localeConfig.default &&
        localeConfig.supported.includes(cookieLocale)
      ) {
        const target = sameOriginUrl(
          req,
          `/${cookieLocale}${pathname === "/" ? "" : pathname}`,
          req.nextUrl.search
        )
        return NextResponse.redirect(target)
      }

      const res = nextWithPathname(req)
      res.cookies.set(LOCALE_COOKIE, localeConfig.default, LOCALE_COOKIE_OPTIONS)
      return res
    }
  }

  return nextWithPathname(req)
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
