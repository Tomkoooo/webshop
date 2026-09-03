import { extractApiKeyFromRequest, TBOOK_API_KEY_HEADER } from "./api-key"
import { mediaOriginFromApiBase, rewriteTBookPublicMediaPayload } from "./public-media-url"
import { resolveTBookServerApiBase, isExternalTBookUpstream } from "./tbook-api-base"

/** Remote tBook host for thin storefront sites (e.g. WDF → tbook.sironic.hu). */
export function getTBookUpstreamApiBase(): string | null {
  const base = resolveTBookServerApiBase()
  return isExternalTBookUpstream(base) ? base : null
}

export function shouldProxyPublicTBookRoute(
  segment: string,
  path: string[],
  method: string
): boolean {
  if (segment === "events" && method === "GET" && (path.length === 1 || path.length === 2)) {
    return true
  }
  if (segment === "events" && path[1] && path[2] === "entry-list" && method === "GET") return true
  if (segment === "quote" && method === "POST" && path.length === 1) return true
  if (segment === "bookings" && method === "POST" && path.length === 1) return true
  if (segment === "bookings" && path[1] === "status" && method === "GET") return true
  // Guest success-page polls + PDF downloads (no API key; booking lives upstream)
  if (segment === "checkout" && path[1] === "status" && method === "GET") return true
  if (segment === "checkout" && path[1] === "invoice" && method === "GET") return true
  if (segment === "checkout" && path[1] === "vouchers" && method === "GET") return true
  // checkout/return stays local — redirects to this host's /foglalas/siker
  return false
}

export async function proxyTBookPublicRequest(
  request: Request,
  upstreamBase: string,
  path: string[],
  corsHeaders?: (request?: Request) => HeadersInit | undefined
): Promise<Response> {
  const url = new URL(request.url)
  const target = `${upstreamBase}/${path.join("/")}${url.search}`

  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)
  const apiKey = extractApiKeyFromRequest(request)
  if (apiKey) headers.set(TBOOK_API_KEY_HEADER, apiKey)

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text()
  }

  const upstreamRes = await fetch(target, init)
  const responseHeaders = new Headers()
  const upstreamContentType = upstreamRes.headers.get("content-type")
  if (upstreamContentType) responseHeaders.set("Content-Type", upstreamContentType)
  const disposition = upstreamRes.headers.get("content-disposition")
  if (disposition) responseHeaders.set("Content-Disposition", disposition)
  const cors = corsHeaders?.(request)
  if (cors) {
    for (const [key, value] of Object.entries(cors)) {
      if (typeof value === "string") responseHeaders.set(key, value)
    }
  }

  // arrayBuffer preserves PDF/binary (invoice, vouchers) as well as JSON text
  const body = await upstreamRes.arrayBuffer()
  const mediaOrigin = mediaOriginFromApiBase(upstreamBase)
  const isJson = (upstreamContentType || "").includes("application/json")
  if (isJson && mediaOrigin) {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(body)) as unknown
      const json = rewriteTBookPublicMediaPayload(parsed, mediaOrigin)
      return new Response(JSON.stringify(json), {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        headers: responseHeaders,
      })
    } catch {
      // Keep original body if rewrite fails.
    }
  }

  return new Response(body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  })
}
