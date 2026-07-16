import { extractApiKeyFromRequest, TBOOK_API_KEY_HEADER } from "./api-key"
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
  if (segment === "quote" && method === "POST" && path.length === 1) return true
  if (segment === "bookings" && method === "POST" && path.length === 1) return true
  if (segment === "bookings" && path[1] === "status" && method === "GET") return true
  if (segment === "checkout" && path[1] === "status" && method === "GET") return true
  if (segment === "checkout" && path[1] === "invoice" && method === "GET") return true
  if (segment === "checkout" && path[1] === "vouchers" && method === "GET") return true
  if (segment === "checkout" && path[1] === "return" && method === "GET") return true
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
  const body = await upstreamRes.text()
  const responseHeaders = new Headers()
  const upstreamContentType = upstreamRes.headers.get("content-type")
  if (upstreamContentType) responseHeaders.set("Content-Type", upstreamContentType)
  const cors = corsHeaders?.(request)
  if (cors) {
    for (const [key, value] of Object.entries(cors)) {
      if (typeof value === "string") responseHeaders.set(key, value)
    }
  }

  return new Response(body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  })
}
