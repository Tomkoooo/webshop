import { NextResponse } from "next/server"
import { ZodError } from "zod"
import type { PluginApiContext } from "@wse/sdk/plugins/types"
import type mongoose from "mongoose"
import { TBookEventService } from "../services/event-service"
import { TBookBookingService } from "../services/booking-service"
import { TBookCheckoutService } from "../services/checkout-service"
import { extractApiKeyFromRequest, hashApiKey } from "../lib/api-key"
import { fetchPublicEventsForStorefront } from "../lib/fetch-public-events"
import { checkRateLimit, clientKeyFromRequest } from "../lib/rate-limit"
import { parseBookingFilters } from "../lib/booking-query"
import { buildBookingCsv, buildBookingExcelBuffer } from "../lib/booking-export"
import { buildTBookOpenApiSpec } from "../lib/openapi"
import { geocodeAddress } from "../lib/geocode"
import type { ITBookEventGroup } from "../models/TBookEventGroup"
import type { ITBookEvent } from "../models/TBookEvent"
import type { ITBookHotel } from "../models/TBookHotel"
import { orgIdFromAuth, resolveTBookAdminAuth } from "../lib/admin-api-auth"
import { OrgAuthError } from "../lib/org-auth"
import { handleTBookOrgApi, handleTBookSystemApi } from "./org-handlers"

function serializeGroup(g: ITBookEventGroup) {
  return {
    id: String(g._id),
    name: g.name,
    description: g.description,
    status: g.status,
    defaultBookingOptions: g.defaultBookingOptions ?? [],
    defaultPriceBasis: g.defaultPriceBasis ?? "net",
    defaultVatPercent: g.defaultVatPercent ?? 27,
    listOnTBookSite: Boolean(g.listOnTBookSite),
    listingTitle: g.listingTitle ?? "",
    listingUrl: g.listingUrl ?? "",
    listingImage: g.listingImage ?? "",
    apiKeyHint: g.apiKeyHint,
    apiKeyCreatedAt: g.apiKeyCreatedAt,
    createdAt: g.createdAt,
  }
}

function serializeEvent(e: ITBookEvent) {
  return {
    id: String(e._id),
    groupId: e.groupId ? String(e.groupId) : null,
    name: e.name,
    description: e.description,
    location: {
      address: e.location?.address ?? "",
      lat: e.location?.lat ?? null,
      lng: e.location?.lng ?? null,
      mapEmbedUrl: e.location?.mapEmbedUrl ?? "",
    },
    startDate: e.startDate,
    endDate: e.endDate,
    ticketFeeHuf: e.ticketFeeHuf,
    ticketFeeMode: e.ticketFeeMode,
    ticketPriceBasis: e.ticketPriceBasis ?? "gross",
    ticketVatPercent: e.ticketVatPercent ?? 27,
    capacity: e.capacity,
    heroImage: e.heroImage,
    attendeeFieldSchema: e.attendeeFieldSchema ?? [],
    status: e.status,
    sortOrder: e.sortOrder,
  }
}

function serializeHotel(h: ITBookHotel) {
  return {
    id: String(h._id),
    groupId: h.groupId ? String(h.groupId) : null,
    eventId: h.eventId ? String(h.eventId) : null,
    name: h.name,
    description: h.description,
    address: h.address,
    distanceFromVenueKm: h.distanceFromVenueKm ?? null,
    contactEmail: h.contactEmail,
    contactPhone: h.contactPhone,
    gallery: h.gallery,
    pricing: h.pricing,
    status: h.status,
    sortOrder: h.sortOrder,
  }
}

function json(data: unknown, status = 200, request?: Request) {
  const headers = corsHeaders(request)
  return NextResponse.json(data, { status, headers })
}

/** Allowed browser origins for the public API (split tester UI vs admin API host). */
function corsHeaders(request?: Request): HeadersInit | undefined {
  const raw = process.env.TBOOK_API_CORS_ORIGINS?.trim()
  if (!raw || !request) return undefined
  const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean)
  const origin = request.headers.get("origin")
  if (!origin || !allowed.includes(origin)) return undefined
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-TBook-Api-Key, Authorization",
    Vary: "Origin",
  }
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ZodError) {
    return err.issues.map((i) => i.message).join(" ")
  }
  return err instanceof Error ? err.message : fallback
}

/** Resolves the event-group scope from the request API key (public routes). */
async function requireApiKeyGroup(request: Request): Promise<{ groupId: mongoose.Types.ObjectId }> {
  const key = extractApiKeyFromRequest(request)
  if (!key) {
    throw Object.assign(new Error("Hiányzó API kulcs."), { statusCode: 401 })
  }
  const group = await TBookEventService.findGroupByApiKeyHash(hashApiKey(key))
  if (!group) {
    throw Object.assign(new Error("Érvénytelen vagy visszavont API kulcs."), { statusCode: 401 })
  }
  return { groupId: group._id as mongoose.Types.ObjectId }
}

function enforceRateLimit(request: Request, scope: string, limit: number) {
  const result = checkRateLimit(clientKeyFromRequest(request, scope), limit, 60_000)
  if (!result.allowed) {
    throw Object.assign(new Error("Túl sok kérés — próbáld újra kicsit később."), {
      statusCode: 429,
    })
  }
}

export async function handleTBookApi(context: PluginApiContext): Promise<Response> {
  const { path, request } = context
  const method = request.method.toUpperCase()
  const segment = path[0] ?? ""

  if (method === "OPTIONS" && segment !== "admin") {
    const headers = corsHeaders(request)
    if (headers) return new NextResponse(null, { status: 204, headers })
  }

  try {
    // ---- Docs (public) ----------------------------------------------------
    if (segment === "openapi" && method === "GET") {
      const { getPublicAppBaseUrl } = await import("@wse/core/lib/app-base-url")
      return json(buildTBookOpenApiSpec(getPublicAppBaseUrl()), 200, request)
    }

    // ---- Stripe success/cancel landing (no key: it's a browser redirect) ---
    if (segment === "checkout" && path[1] === "return" && method === "GET") {
      return handleCheckoutReturn(request)
    }

    // ---- Public directory (no API key) ------------------------------------
    if (segment === "directory" && method === "GET" && path.length === 1) {
      const listings = await TBookEventService.listPublicDirectory()
      return json({ ok: true, listings }, 200, request)
    }

    // ---- Public, API-key protected ----------------------------------------
    if (segment === "events" && method === "GET" && path.length === 1) {
      const { groupId } = await requireApiKeyGroup(request)
      const [events, currency] = await Promise.all([
        TBookEventService.listPublicEventsForGroup(groupId),
        TBookEventService.getOrganizationCurrencyForGroup(groupId),
      ])
      return json({ ok: true, events, currency }, 200, request)
    }

    if (segment === "events" && path[1] && method === "GET" && path.length === 2) {
      const { groupId } = await requireApiKeyGroup(request)
      const detail = await TBookEventService.getPublicEventDetail(groupId, path[1])
      if (!detail) return json({ error: "Esemény nem található" }, 404, request)
      return json({ ok: true, ...detail }, 200, request)
    }

    if (segment === "quote" && method === "POST" && path.length === 1) {
      const { groupId } = await requireApiKeyGroup(request)
      enforceRateLimit(request, "t-book:quote", 120)
      const body = await request.json()
      const { quote } = await TBookBookingService.quote(body, { groupId })
      return json({ ok: true, quote }, 200, request)
    }

    if (segment === "bookings" && method === "POST" && path.length === 1) {
      const { groupId } = await requireApiKeyGroup(request)
      enforceRateLimit(request, "t-book:bookings", 20)
      const body = await request.json()
      const result = await TBookCheckoutService.createBookingWithCheckout(body, { groupId })
      return json({ ok: true, ...result }, 200, request)
    }

    if (segment === "bookings" && path[1] === "status" && method === "GET") {
      await requireApiKeyGroup(request)
      const url = new URL(request.url)
      const bookingId = url.searchParams.get("bookingId") || ""
      const sessionId = url.searchParams.get("session_id")
      const result = await TBookCheckoutService.getCheckoutStatus(bookingId, sessionId)
      return json({ ok: true, ...result }, 200, request)
    }

    // ---- Org & system (multi-tenant) --------------------------------------
    if (segment === "org") {
      return handleTBookOrgApi(path.slice(1), request, method)
    }

    if (segment === "system") {
      return handleTBookSystemApi(path.slice(1), request, method)
    }

    // ---- Admin (session auth) ---------------------------------------------
    if (segment === "admin") {
      return handleTBookAdminApi(path.slice(1), request, method)
    }

    return json({ error: "Not found", path }, 404, request)
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode) return json({ error: errorMessage(err, "Hiba történt") }, statusCode, request)
    console.error("[t-book]", err)
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ error: "Unauthorized" }, 401, request)
    }
    if (err instanceof OrgAuthError) {
      return json({ error: err.message }, err.statusCode, request)
    }
    return json({ error: errorMessage(err, "Hiba történt") }, 400, request)
  }
}

/** Minimal HTML landing after Stripe redirect; also a webhook fallback. */
async function handleCheckoutReturn(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const bookingId = url.searchParams.get("bookingId") || ""
  const sessionId = url.searchParams.get("session_id")
  const cancelled = url.searchParams.get("cancelled") === "1"

  let status = "unknown"
  if (!cancelled && bookingId) {
    try {
      const result = await TBookCheckoutService.getCheckoutStatus(bookingId, sessionId)
      status = result.status
    } catch {
      status = "unknown"
    }
  }

  const paid = status === "paid" || status === "confirmed"
  const title = cancelled
    ? "Fizetés megszakítva"
    : paid
      ? "Sikeres fizetés!"
      : "Fizetés feldolgozás alatt"
  const body = cancelled
    ? "A fizetést megszakítottad. A foglalásod nem jött létre véglegesen."
    : paid
      ? "Köszönjük a foglalást! A visszaigazolást és a számlát e-mailben küldjük."
      : "A fizetés feldolgozása folyamatban van. Hamarosan e-mailt küldünk a visszaigazolásról."

  return new NextResponse(
    `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff}main{max-width:28rem;padding:2rem;text-align:center}h1{font-size:1.5rem}p{color:#a3a3a3;line-height:1.6}code{color:#737373;font-size:.75rem}</style></head>
<body><main><h1>${title}</h1><p>${body}</p><code>Foglalás: ${bookingId}</code></main></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}

async function handleTBookAdminApi(
  path: string[],
  request: Request,
  method: string
): Promise<Response> {
  const segment = path[0] ?? ""
  const url = new URL(request.url)

  try {
  // ---- Dashboard ----------------------------------------------------------
  if (segment === "dashboard" && method === "GET" && path.length === 1) {
    const authResult = await resolveTBookAdminAuth("stats:read")
    const orgId = orgIdFromAuth(authResult)
    const stats = await TBookEventService.getDashboardStats(orgId)
    return json({ ok: true, stats })
  }

  if (segment === "connection-test" && method === "POST" && path.length === 1) {
    await resolveTBookAdminAuth("group:read")
    const body = await request.json()
    const apiKey = String(body.apiKey ?? "")
    const apiBaseOverride =
      typeof body.apiBase === "string" && body.apiBase.trim()
        ? body.apiBase.trim()
        : process.env.NEXT_PUBLIC_TBOOK_API_BASE
    const { events, error } = await fetchPublicEventsForStorefront(apiKey, apiBaseOverride || undefined)
    if (error) {
      return json({ ok: false, error, eventCount: 0 })
    }
    return json({ ok: true, eventCount: events.length })
  }

  if (segment === "geocode" && method === "POST" && path.length === 1) {
    await resolveTBookAdminAuth("event:write")
    const body = await request.json()
    const result = await geocodeAddress(String(body.address ?? ""))
    return json({ ok: true, ...result })
  }

  // ---- Event groups --------------------------------------------------------
  if (segment === "groups" && method === "GET" && path.length === 1) {
    const authResult = await resolveTBookAdminAuth("group:read")
    const orgId = orgIdFromAuth(authResult)
    const groups = await TBookEventService.listGroups(orgId)
    return json({
      ok: true,
      groups: groups.map(serializeGroup),
    })
  }

  if (segment === "groups" && path[1] && method === "GET" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("group:read")
    const orgId = orgIdFromAuth(authResult)
    const group = await TBookEventService.getGroup(path[1], orgId)
    if (!group) return json({ error: "Csoport nem található" }, 404)
    return json({ ok: true, group: serializeGroup(group) })
  }

  if (segment === "groups" && method === "POST" && path.length === 1) {
    const authResult = await resolveTBookAdminAuth("group:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    const { group, apiKey } = await TBookEventService.createGroup(body, orgId)
    return json({ ok: true, id: String(group._id), apiKey })
  }

  if (segment === "groups" && path[1] && method === "PUT" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("group:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    await TBookEventService.updateGroup(path[1], body, orgId)
    return json({ ok: true })
  }

  if (segment === "groups" && path[1] && method === "DELETE" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("group:write")
    const orgId = orgIdFromAuth(authResult)
    await TBookEventService.deleteGroup(path[1], orgId)
    return json({ ok: true })
  }

  if (segment === "groups" && path[1] && path[2] === "rotate-key" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("group:apiKey")
    const orgId = orgIdFromAuth(authResult)
    const apiKey = await TBookEventService.rotateGroupApiKey(path[1], orgId)
    return json({ ok: true, apiKey })
  }

  // ---- Events --------------------------------------------------------------
  if (segment === "events" && method === "GET" && path.length === 1) {
    const authResult = await resolveTBookAdminAuth("event:read")
    const orgId = orgIdFromAuth(authResult)
    const groupId = url.searchParams.get("groupId") || undefined
    const events = await TBookEventService.listEvents({ groupId, organizationId: orgId })
    return json({
      ok: true,
      events: events.map(serializeEvent),
    })
  }

  if (segment === "events" && method === "POST" && path.length === 1) {
    const authResult = await resolveTBookAdminAuth("event:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    const event = await TBookEventService.createEvent(body, orgId)
    return json({ ok: true, id: String(event._id) })
  }

  if (segment === "events" && path[1] === "reorder" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("event:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    await TBookEventService.reorderEvents(body.orderedIds ?? [], orgId)
    return json({ ok: true })
  }

  if (segment === "events" && path[1] && method === "GET" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("event:read")
    const orgId = orgIdFromAuth(authResult)
    const event = await TBookEventService.getEvent(path[1], orgId)
    if (!event) return json({ error: "Esemény nem található" }, 404)
    return json({
      ok: true,
      event: serializeEvent(event),
    })
  }

  if (segment === "events" && path[1] && method === "PUT" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("event:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    await TBookEventService.updateEvent(path[1], body, orgId)
    return json({ ok: true })
  }

  if (segment === "events" && path[1] && method === "DELETE" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("event:write")
    const orgId = orgIdFromAuth(authResult)
    await TBookEventService.deleteEvent(path[1], orgId)
    return json({ ok: true })
  }

  if (segment === "groups" && path[1] && path[2] === "hotels" && method === "GET") {
    const authResult = await resolveTBookAdminAuth("hotel:read")
    const orgId = orgIdFromAuth(authResult)
    const hotels = await TBookEventService.listHotelsForGroup(path[1], orgId)
    return json({
      ok: true,
      hotels: hotels.map(serializeHotel),
    })
  }

  if (segment === "groups" && path[1] && path[2] === "hotels" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("hotel:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    const hotel = await TBookEventService.createHotel({ ...body, groupId: path[1] }, orgId)
    return json({ ok: true, id: String(hotel._id) })
  }

  // ---- Hotels (legacy event-scoped + by id) --------------------------------
  if (segment === "events" && path[1] && path[2] === "hotels" && method === "GET") {
    const authResult = await resolveTBookAdminAuth("hotel:read")
    const orgId = orgIdFromAuth(authResult)
    const hotels = await TBookEventService.listHotels(path[1], orgId)
    return json({
      ok: true,
      hotels: hotels.map(serializeHotel),
    })
  }

  if (segment === "events" && path[1] && path[2] === "hotels" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("hotel:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    const hotel = await TBookEventService.createHotel({ ...body, eventId: path[1] }, orgId)
    return json({ ok: true, id: String(hotel._id) })
  }

  if (segment === "hotels" && path[1] && method === "GET" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("hotel:read")
    const orgId = orgIdFromAuth(authResult)
    const hotel = await TBookEventService.getHotel(path[1], orgId)
    if (!hotel) return json({ error: "Szállás nem található" }, 404)
    return json({ ok: true, hotel: serializeHotel(hotel) })
  }

  if (segment === "hotels" && path[1] && method === "PUT" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("hotel:write")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    await TBookEventService.updateHotel(path[1], body, orgId)
    return json({ ok: true })
  }

  if (segment === "hotels" && path[1] && method === "DELETE" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("hotel:write")
    const orgId = orgIdFromAuth(authResult)
    await TBookEventService.deleteHotel(path[1], orgId)
    return json({ ok: true })
  }

  // ---- Live pricing preview -------------------------------------------------
  if (segment === "quote" && method === "POST" && path.length === 1) {
    await resolveTBookAdminAuth("event:read")
    const body = await request.json()
    const { quote } = await TBookBookingService.quote(body)
    return json({ ok: true, quote })
  }

  // ---- Bookings ---------------------------------------------------------------
  if (segment === "bookings" && method === "GET" && path.length === 1) {
    const authResult = await resolveTBookAdminAuth("booking:read")
    const orgId = orgIdFromAuth(authResult)
    const filters = parseBookingFilters(url.searchParams)
    if (orgId) filters.organizationId = orgId
    const result = await TBookBookingService.listBookingsAdmin(filters)
    return json({
      ok: true,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      filteredRevenueHuf: result.filteredRevenueHuf,
      filteredGuests: result.filteredGuests,
      bookings: result.items.map((b) => ({
        id: String(b._id),
        eventName: b.eventName,
        groupName: b.groupName,
        hotelName: b.hotelName,
        customer: b.customer,
        attendeeFieldSchema: b.attendeeFieldSchema ?? [],
        attendees: b.attendees ?? [],
        guests: b.guests,
        attendeeCount: b.attendees?.length ?? 0,
        nights: b.nights,
        selections: b.selections,
        totalHuf: b.totalHuf,
        status: b.status,
        invoiceStatus: b.invoiceStatus,
        invoiceId: b.invoiceId,
        paidAt: b.paidAt,
        createdAt: b.createdAt,
      })),
    })
  }

  if (segment === "bookings" && path[1] === "facets" && method === "GET") {
    const authResult = await resolveTBookAdminAuth("booking:read")
    const orgId = orgIdFromAuth(authResult)
    const eventId = url.searchParams.get("eventId") || undefined
    const facets = await TBookBookingService.listSelectionFacets(eventId, orgId)
    return json({ ok: true, facets })
  }

  if (segment === "bookings" && path[1] === "export" && method === "GET") {
    const authResult = await resolveTBookAdminAuth("booking:export")
    const orgId = orgIdFromAuth(authResult)
    const filters = parseBookingFilters(url.searchParams)
    if (orgId) filters.organizationId = orgId
    const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx"
    const bookings = await TBookBookingService.listBookingsForExport(filters)

    if (format === "csv") {
      const csv = buildBookingCsv(bookings)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tbook-foglalasok.csv"`,
        },
      })
    }

    const buffer = await buildBookingExcelBuffer(bookings, {
      title: url.search.replace(/^\?/, "") || "összes foglalás",
    })
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="tbook-foglalasok.xlsx"`,
      },
    })
  }

  if (segment === "bookings" && path[1] && method === "GET" && path.length === 2) {
    const authResult = await resolveTBookAdminAuth("booking:read")
    const orgId = orgIdFromAuth(authResult)
    const booking = await TBookBookingService.getBookingAdmin(path[1], orgId)
    if (!booking) return json({ error: "Foglalás nem található" }, 404)
    return json({
      ok: true,
      booking: {
        id: String(booking._id),
        groupId: booking.groupId ? String(booking.groupId) : null,
        eventId: String(booking.eventId),
        hotelId: booking.hotelId ? String(booking.hotelId) : null,
        eventName: booking.eventName,
        groupName: booking.groupName,
        hotelName: booking.hotelName,
        customer: booking.customer,
        billing: booking.billing,
        attendeeFieldSchema: booking.attendeeFieldSchema ?? [],
        attendees: booking.attendees ?? [],
        guests: booking.guests,
        nights: booking.nights,
        selections: booking.selections,
        quote: booking.quote,
        totalHuf: booking.totalHuf,
        status: booking.status,
        stripeSessionId: booking.stripeSessionId,
        paidAt: booking.paidAt,
        invoiceStatus: booking.invoiceStatus,
        invoiceId: booking.invoiceId,
        invoiceError: booking.invoiceError,
        createdAt: booking.createdAt,
      },
    })
  }

  if (segment === "bookings" && path[1] && path[2] === "status" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("booking:manage")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    await TBookBookingService.updateStatus(path[1], body.status, orgId)
    return json({ ok: true })
  }

  if (segment === "bookings" && path[1] && path[2] === "invoice" && method === "POST" && path.length === 3) {
    const authResult = await resolveTBookAdminAuth("booking:manage")
    const orgId = orgIdFromAuth(authResult)
    const { issueBookingInvoice } = await import("../services/invoice-service")
    await issueBookingInvoice(path[1], orgId)
    const booking = await TBookBookingService.getBookingAdmin(path[1], orgId)
    return json({
      ok: true,
      invoiceStatus: booking?.invoiceStatus ?? "none",
      invoiceError: booking?.invoiceError ?? null,
    })
  }

  if (segment === "bookings" && path[1] && path[2] === "invoice" && path[3] === "reverse" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("booking:manage")
    const orgId = orgIdFromAuth(authResult)
    const { reverseBookingInvoice } = await import("../services/invoice-service")
    await reverseBookingInvoice(path[1], orgId)
    return json({ ok: true })
  }

  if (segment === "bookings" && path[1] && path[2] === "invoice" && path[3] === "pdf" && method === "GET") {
    const authResult = await resolveTBookAdminAuth("booking:read")
    const orgId = orgIdFromAuth(authResult)
    const { downloadBookingInvoicePdf } = await import("../services/invoice-service")
    const pdf = await downloadBookingInvoicePdf(path[1], orgId)
    if (!pdf) return json({ error: "Számla PDF nem érhető el" }, 404)
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="szamla-${path[1]}.pdf"`,
      },
    })
  }

  return json({ error: "Admin route not found", path }, 404)
  } catch (err) {
    if (err instanceof OrgAuthError) {
      return json({ error: err.message }, err.statusCode)
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ error: "Unauthorized" }, 401)
    }
    throw err
  }
}
