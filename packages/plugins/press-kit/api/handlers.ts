import { NextResponse } from "next/server"
import type { PluginApiContext } from "@wse/sdk/plugins/types"
import { PressKitService } from "../services/press-kit-service"
import {
  clearPressSessionCookieOptions,
  createPressSessionToken,
  pressSessionCookieOptions,
  readPressSessionFromCookies,
  verifyPressSessionToken,
} from "../lib/press-session"
import { renderWatermarkTemplate } from "../lib/watermark"

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

const authAttempts = new Map<string, { count: number; resetAt: number }>()
const AUTH_LIMIT = 20
const AUTH_WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(ip: string | null): boolean {
  const key = ip || "unknown"
  const now = Date.now()
  const entry = authAttempts.get(key)
  if (!entry || entry.resetAt < now) {
    authAttempts.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS })
    return true
  }
  if (entry.count >= AUTH_LIMIT) return false
  entry.count++
  return true
}

function clientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  )
}

async function requirePressSession(request: Request) {
  const fromCookie = await readPressSessionFromCookies()
  if (fromCookie) return fromCookie

  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return verifyPressSessionToken(authHeader.slice(7))
  }
  return null
}

export async function handlePressKitApi(context: PluginApiContext): Promise<Response> {
  const { path, request } = context
  const method = request.method.toUpperCase()
  const segment = path[0] ?? ""

  try {
    if (segment === "auth" && method === "POST") {
      const ip = clientIp(request)
      if (!checkRateLimit(ip)) {
        return json({ error: "Túl sok próbálkozás. Próbáld később." }, 429)
      }

      const body = await request.json()
      const settings = await PressKitService.getOrCreateSettings()
      const contact = await PressKitService.authenticate({
        accessMode: settings.accessMode,
        email: typeof body.email === "string" ? body.email : undefined,
        password: typeof body.password === "string" ? body.password : undefined,
        token: typeof body.token === "string" ? body.token : undefined,
        sharedPasswordHash: settings.sharedPasswordHash,
      })

      if (!contact) {
        await PressKitService.recordAccess("auth_failed", null, {}, ip)
        return json({ error: "Hibás belépési adatok" }, 401)
      }

      const token = createPressSessionToken(String(contact._id))
      await PressKitService.recordAccess("portal_open", String(contact._id), {}, ip)

      const response = json({
        ok: true,
        contact: {
          id: String(contact._id),
          name: contact.name,
          outlet: contact.outlet,
          email: contact.email,
        },
      })
      response.cookies.set(pressSessionCookieOptions(token))
      return response
    }

    if (segment === "logout" && method === "POST") {
      const response = json({ ok: true })
      response.cookies.set(clearPressSessionCookieOptions())
      return response
    }

    if (segment === "session" && method === "GET") {
      const session = await requirePressSession(request)
      if (!session) return json({ ok: false }, 401)
      const contact = await PressKitService.findContactById(session.contactId)
      if (!contact?.isActive) return json({ ok: false }, 401)
      return json({
        ok: true,
        contact: {
          id: String(contact._id),
          name: contact.name,
          outlet: contact.outlet,
          email: contact.email,
        },
      })
    }

    if (segment === "content" && method === "GET") {
      const session = await requirePressSession(request)
      if (!session) return json({ error: "Unauthorized" }, 401)
      const contact = await PressKitService.findContactById(session.contactId)
      if (!contact?.isActive) return json({ error: "Unauthorized" }, 401)

      const content = await PressKitService.getPublishedContent()
      if (!content) return json({ error: "A sajtóanyagok még nem érhetők el" }, 404)

      const settings = PressKitService.serializeSettings(content)
      const watermark = renderWatermarkTemplate(settings.pdfSettings.watermarkTemplate, {
        name: contact.name,
        outlet: contact.outlet,
        email: contact.email,
      })

      await PressKitService.recordAccess("page_view", session.contactId, {}, clientIp(request))

      return json({
        ok: true,
        content: settings,
        contact: {
          id: String(contact._id),
          name: contact.name,
          outlet: contact.outlet,
          email: contact.email,
        },
        watermark,
        accessMode: content.accessMode,
      })
    }

    if (segment === "log" && method === "POST") {
      const session = await requirePressSession(request)
      if (!session) return json({ error: "Unauthorized" }, 401)
      const body = await request.json()
      const event = body.event as string
      if (!["pdf_open", "pdf_page_view"].includes(event)) {
        return json({ error: "Invalid event" }, 400)
      }
      await PressKitService.recordAccess(
        event as "pdf_open" | "pdf_page_view",
        session.contactId,
        body.metadata || {},
        clientIp(request)
      )
      return json({ ok: true })
    }

    if (segment === "pdf" && path[1] === "file" && method === "GET") {
      const session = await requirePressSession(request)
      if (!session) return new NextResponse(null, { status: 401 })

      const settings = await PressKitService.getOrCreateSettings()
      if (!settings.pdfMediaFilename) return new NextResponse(null, { status: 404 })

      const buffer = await PressKitService.getPdfBuffer(settings.pdfMediaFilename)
      if (!buffer) return new NextResponse(null, { status: 404 })

      const allowDownload = settings.pdfSettings?.allowDownload ?? false
      await PressKitService.recordAccess("pdf_open", session.contactId, {}, clientIp(request))

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": allowDownload
            ? `attachment; filename="press-preview.pdf"`
            : "inline",
          "Cache-Control": "private, no-store",
        },
      })
    }

    if (segment === "portal-config" && method === "GET") {
      const settings = await PressKitService.getOrCreateSettings()
      return json({
        ok: true,
        accessMode: settings.accessMode,
        isPublished: settings.isPublished,
      })
    }

    if (segment === "admin") {
      const { requireAdmin } = await import("@wse/core/lib/admin-auth")
      await requireAdmin()
      return handlePressKitAdminApi(path.slice(1), request, method)
    }

    return json({ error: "Not found", path }, 404)
  } catch (err) {
    console.error("[press-kit]", err)
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ error: "Unauthorized" }, 401)
    }
    return json({ error: errorMessage(err, "Hiba történt") }, 400)
  }
}

async function handlePressKitAdminApi(
  path: string[],
  request: Request,
  method: string
): Promise<Response> {
  const segment = path[0] ?? ""

  if (segment === "overview" && method === "GET") {
    const stats = await PressKitService.getOverviewStats()
    const settings = await PressKitService.getOrCreateSettings()
    return json({
      ok: true,
      stats,
      settings: PressKitService.serializeSettings(settings),
    })
  }

  if (segment === "settings" && method === "GET") {
    const settings = await PressKitService.getOrCreateSettings()
    return json({ ok: true, settings: PressKitService.serializeSettings(settings) })
  }

  if (segment === "settings" && method === "PUT") {
    const body = await request.json()
    const settings = await PressKitService.updateSettings(body)
    return json({ ok: true, settings: PressKitService.serializeSettings(settings) })
  }

  if (segment === "contacts" && method === "GET" && path.length === 1) {
    const contacts = await PressKitService.listContacts()
    return json({ ok: true, contacts })
  }

  if (segment === "contacts" && method === "POST" && path.length === 1) {
    const body = await request.json()
    const result = await PressKitService.createContact(body)
    return json({ ok: true, ...result })
  }

  if (segment === "contacts" && path[1] && method === "PUT" && path.length === 2) {
    const body = await request.json()
    const result = await PressKitService.updateContact(path[1], body)
    return json({ ok: true, ...result })
  }

  if (segment === "contacts" && path[1] && method === "DELETE" && path.length === 2) {
    await PressKitService.deleteContact(path[1])
    return json({ ok: true })
  }

  if (segment === "invite" && method === "POST") {
    const body = await request.json()
    const origin = new URL(request.url).origin
    const host = request.headers.get("host")
    const result = await PressKitService.sendInvites({
      contactIds: Array.isArray(body.contactIds) ? body.contactIds : [],
      origin,
      host,
    })
    return json({ ok: true, ...result })
  }

  if (segment === "stats" && method === "GET") {
    const url = new URL(request.url)
    const fromRaw = url.searchParams.get("from")
    const toRaw = url.searchParams.get("to")
    const from = fromRaw ? new Date(fromRaw) : undefined
    const to = toRaw ? new Date(toRaw) : undefined
    const rows = await PressKitService.getStats(from, to)
    return json({ ok: true, rows })
  }

  return json({ error: "Not found" }, 404)
}
