import { getPublicAppBaseUrl, isLocalhostBaseUrl } from "@wse/core/lib/app-base-url"

/** Build login path preserving return URL after Google sign-in. */
export function authLoginPath(callbackUrl: string): string {
  const params = new URLSearchParams({ callbackUrl })
  return `/auth/login?${params.toString()}`
}

/**
 * Hosts that must never appear in browser redirects (Docker bind address, loopback).
 * Auth.js + `HOSTNAME=0.0.0.0` commonly produces `https://0.0.0.0:3000/...` after OAuth.
 */
export function isUnusableRedirectHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "")
  return (
    host === "0.0.0.0" ||
    host === "::" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1"
  )
}

function tryPublicBaseUrl(): string | null {
  try {
    return getPublicAppBaseUrl().replace(/\/+$/, "")
  } catch {
    return null
  }
}

function resolveBase(fallbackBaseUrl?: string): URL {
  const configured = tryPublicBaseUrl()
  const candidates = [configured, fallbackBaseUrl, "http://localhost:3000"].filter(
    (v): v is string => Boolean(v?.trim())
  )

  for (const raw of candidates) {
    try {
      const base = new URL(raw.includes("://") ? raw.replace(/\/+$/, "") : `https://${raw}`)
      if (isUnusableRedirectHost(base.hostname)) continue
      if (process.env.NODE_ENV === "production" && isLocalhostBaseUrl(base.origin) && configured) {
        continue
      }
      return base
    } catch {
      /* try next */
    }
  }

  return new URL("http://localhost:3000")
}

/**
 * Resolve Auth.js / route-handler redirects onto the configured public origin.
 * Rewrites absolute URLs that landed on `0.0.0.0` / loopback (Docker HOSTNAME bind).
 */
export function resolveAuthRedirectUrl(url: string, fallbackBaseUrl?: string): string {
  const base = resolveBase(fallbackBaseUrl)
  const trimmed = url.trim()
  if (!trimmed) return base.origin

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return `${base.origin}${trimmed}`
  }

  try {
    const parsed = new URL(trimmed)
    if (isUnusableRedirectHost(parsed.hostname)) {
      return `${base.origin}${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    if (parsed.origin === base.origin) {
      return parsed.toString()
    }
    // Auth.js may pass its inferred baseUrl origin (wrong behind Docker). If the path is
    // on that inferred origin, move it onto the public origin.
    if (fallbackBaseUrl) {
      try {
        const inferred = new URL(fallbackBaseUrl)
        if (parsed.origin === inferred.origin) {
          return `${base.origin}${parsed.pathname}${parsed.search}${parsed.hash}`
        }
      } catch {
        /* ignore */
      }
    }
    // Foreign absolute URL — do not open-redirect; send home.
    return base.origin
  } catch {
    return base.origin
  }
}

/** Absolute URL for an app path, preferring NEXT_PUBLIC_APP_URL / AUTH_URL. */
export function absoluteAppUrl(path: string, requestUrl?: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return resolveAuthRedirectUrl(normalized, requestUrl)
}
