import { NextResponse } from "next/server"
import { ZodError } from "zod"
import type { PluginApiContext } from "@wse/sdk/plugins/types"
import type mongoose from "mongoose"
import { TBookEventService } from "../services/event-service"
import { TBookBookingService } from "../services/booking-service"
import { TBookCheckoutService } from "../services/checkout-service"
import { extractApiKeyFromRequest, hashApiKey } from "../lib/api-key"
import { probeTBookStorefrontCapabilities } from "../lib/storefront-capabilities"
import { resolveTBookServerApiBase } from "../lib/tbook-api-base"
import { checkRateLimit, clientKeyFromRequest } from "../lib/rate-limit"
import { parseBookingFilters } from "../lib/booking-query"
import { buildBookingCsv, buildBookingExcelBuffer } from "../lib/booking-export"
import { buildTBookOpenApiSpec } from "../lib/openapi"
import { geocodeAddress } from "../lib/geocode"
import type { ITBookEventGroup } from "../models/TBookEventGroup"
import type { ITBookEvent } from "../models/TBookEvent"
import type { ITBookHotel } from "../models/TBookHotel"
import { orgIdFromAuth, resolveTBookAdminAuth } from "../lib/admin-api-auth"
import { normalizeAttendeeFieldSchema } from "../lib/attendee-fields"
import { OrgAuthError } from "../lib/org-auth"
import { handleTBookOrgApi, handleTBookSystemApi } from "./org-handlers"
import {
  getTBookUpstreamApiBase,
  proxyTBookPublicRequest,
  shouldProxyPublicTBookRoute,
} from "../lib/upstream-proxy"

function serializeGroup(g: ITBookEventGroup) {
  return {
    id: String(g._id),
    name: g.name,
    description: g.description,
    status: g.status,
    defaultBookingOptions: g.defaultBookingOptions ?? [],
    defaultAttendeeFieldSchema: normalizeAttendeeFieldSchema(g.defaultAttendeeFieldSchema ?? []),
    defaultPriceBasis: g.defaultPriceBasis ?? "net",
    defaultVatPercent: g.defaultVatPercent ?? 27,
    listOnTBookSite: Boolean(g.listOnTBookSite),
    listingTitle: g.listingTitle ?? "",
    listingUrl: g.listingUrl ?? "",
    listingImage: g.listingImage ?? "",
    defaultHeroImage: g.defaultHeroImage ?? "",
    voucherHeaderImage: g.voucherHeaderImage ?? "",
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
    startTime: e.startTime ?? null,
    endTime: e.endTime ?? null,
    ticketFeeHuf: e.ticketFeeHuf,
    ticketFeeMode: e.ticketFeeMode,
    registrationUnit: e.registrationUnit ?? "person",
    playersPerTicket: e.playersPerTicket ?? 1,
    teamMemberLimit: e.teamMemberLimit ?? null,
    teamMemberFieldSchema: e.teamMemberFieldSchema ?? [],
    ticketPriceBasis: e.ticketPriceBasis ?? "gross",
    ticketVatPercent: e.ticketVatPercent ?? 27,
    currency: e.currency ?? "HUF",
    capacity: e.capacity,
    heroImage: e.heroImage,
    voucherHeaderImage: e.voucherHeaderImage ?? "",
    vouchersEnabled: e.vouchersEnabled !== false,
    attendeeFieldSchema: e.attendeeFieldSchema ?? [],
    attendeeFieldSchemaMode: e.attendeeFieldSchemaMode ?? "extend",
    eligibilityPreset: e.eligibilityPreset ?? "none",
    eligibilityMinAge: e.eligibilityMinAge ?? null,
    eligibilityMaxAge: e.eligibilityMaxAge ?? null,
    eligibilityAllowedGenders: e.eligibilityAllowedGenders ?? [],
    eligibilityBirthDateFieldKey: e.eligibilityBirthDateFieldKey ?? null,
    eligibilityGenderFieldKey: e.eligibilityGenderFieldKey ?? null,
    eligibilityFormRules: e.eligibilityFormRules ?? null,
    pricingRules: e.pricingRules ?? [],
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
    currency: h.currency ?? "HUF",
    registrationFieldSchema: h.registrationFieldSchema ?? [],
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

    // ---- Legacy Stripe return: always redirect to this host's success page ---
    // (Finalize + email happen via /checkout/status poll — proxied when upstream.)
    if (segment === "checkout" && path[1] === "return" && method === "GET") {
      return handleCheckoutReturn(request)
    }

    // ---- Public directory (no API key) ------------------------------------
    if (segment === "directory" && method === "GET" && path.length === 1) {
      const listings = await TBookEventService.listPublicDirectory()
      return json({ ok: true, listings }, 200, request)
    }

    // ---- Thin storefronts (WDF): proxy booking/checkout to upstream tBook ----
    // Must run before local checkout handlers — bookings live on the upstream DB.
    const upstreamBase = getTBookUpstreamApiBase()
    if (upstreamBase && shouldProxyPublicTBookRoute(segment, path, method)) {
      return proxyTBookPublicRequest(request, upstreamBase, path, corsHeaders)
    }

    // ---- Stripe success polling + guest PDF downloads (local / primary host) ---
    if (segment === "checkout" && path[1] === "status" && method === "GET" && path.length === 2) {
      const url = new URL(request.url)
      const bookingId = url.searchParams.get("bookingId") || ""
      const sessionId = url.searchParams.get("session_id")
      if (!sessionId) {
        return json({ error: "session_id kötelező" }, 400, request)
      }
      try {
        const result = await TBookCheckoutService.getCheckoutStatus(bookingId, sessionId)
        return json({ ok: true, ...result }, 200, request)
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode ?? 400
        return json({ error: errorMessage(err, "Hiba") }, statusCode, request)
      }
    }

    if (segment === "checkout" && path[1] === "invoice" && method === "GET" && path.length === 2) {
      const url = new URL(request.url)
      const bookingId = url.searchParams.get("bookingId") || ""
      const sessionId = url.searchParams.get("session_id")
      try {
        const pdf = await TBookCheckoutService.downloadInvoiceForGuestCheckout(bookingId, sessionId)
        if (!pdf) return json({ error: "Számla PDF nem érhető el" }, 404, request)
        return new NextResponse(new Uint8Array(pdf), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="szamla-${bookingId.slice(-8)}.pdf"`,
          },
        })
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode ?? 400
        return json({ error: errorMessage(err, "Hiba") }, statusCode, request)
      }
    }

    if (segment === "checkout" && path[1] === "vouchers" && method === "GET" && path.length === 2) {
      const url = new URL(request.url)
      const bookingId = url.searchParams.get("bookingId") || ""
      const sessionId = url.searchParams.get("session_id")
      try {
        const pdf = await TBookCheckoutService.downloadVouchersForGuestCheckout(bookingId, sessionId)
        if (!pdf) return json({ error: "Jegy PDF nem érhető el" }, 404, request)
        return new NextResponse(new Uint8Array(pdf), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="jegy-${bookingId.slice(-8)}.pdf"`,
          },
        })
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode ?? 400
        return json({ error: errorMessage(err, "Hiba") }, statusCode, request)
      }
    }

    // ---- Public, API-key protected (local) ---------------------------------

    if (segment === "events" && method === "GET" && path.length === 1) {
      const { groupId } = await requireApiKeyGroup(request)
      const events = await TBookEventService.listPublicEventsForGroup(groupId)
      return json({ ok: true, events }, 200, request)
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
      if (Array.isArray(body?.entries)) {
        const result = await TBookBookingService.quoteMulti(body, { groupId })
        return json({ ok: true, ...result }, 200, request)
      }
      const { quote } = await TBookBookingService.quote(body, { groupId })
      return json({ ok: true, quote }, 200, request)
    }

    if (segment === "bookings" && method === "POST" && path.length === 1) {
      const { groupId } = await requireApiKeyGroup(request)
      enforceRateLimit(request, "t-book:bookings", 20)
      const body = await request.json()
      if (Array.isArray(body?.entries)) {
        const result = await TBookCheckoutService.createMultiBookingWithCheckout(body, {
          groupId,
        })
        return json({ ok: true, ...result }, 200, request)
      }
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

/** Legacy Stripe return URL — redirect to the storefront success page. */
async function handleCheckoutReturn(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const bookingId = url.searchParams.get("bookingId") || ""
  const sessionId = url.searchParams.get("session_id")
  const cancelled = url.searchParams.get("cancelled") === "1"

  if (!cancelled && bookingId && sessionId) {
    try {
      await TBookCheckoutService.getCheckoutStatus(bookingId, sessionId)
    } catch {
      // Still redirect — success page will poll / show error state.
    }
  }

  const target = new URL("/foglalas/siker", url.origin)
  if (bookingId) target.searchParams.set("bookingId", bookingId)
  if (sessionId) target.searchParams.set("session_id", sessionId)
  if (cancelled) target.searchParams.set("cancelled", "1")
  return NextResponse.redirect(target, 302)
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
        : resolveTBookServerApiBase()
    const { capabilities, error } = await probeTBookStorefrontCapabilities(
      apiKey,
      apiBaseOverride || undefined
    )
    if (error || !capabilities) {
      return json({ ok: false, error: error ?? "Kapcsolat teszt sikertelen.", eventCount: 0 })
    }
    return json({
      ok: true,
      eventCount: capabilities.eventCount,
      capabilities,
    })
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
        currency: b.currency ?? "HUF",
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
        currency: booking.currency ?? "HUF",
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

  // ---- Vouchers (accreditation / check-in) -----------------------------------
  if (segment === "vouchers" && path[1] === "scan" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("voucher:scan")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    const { scanVoucher } = await import("../services/voucher-service")
    const { getSessionUserId } = await import("../lib/org-auth")
    const userId = authResult.mode === "org" ? authResult.ctx.userId : await getSessionUserId()
    const result = await scanVoucher(body.token ?? body.qr ?? "", {
      eventId: body.eventId || undefined,
      organizationId: orgId,
      userId: userId ?? undefined,
      mode: body.mode === "lookup" ? "lookup" : "check_in",
    })
    return json({ ok: true, ...result })
  }

  if (segment === "vouchers" && path[1] === "stats" && method === "GET") {
    const authResult = await resolveTBookAdminAuth("voucher:read")
    const orgId = orgIdFromAuth(authResult)
    const eventId = url.searchParams.get("eventId")
    if (!eventId) return json({ error: "eventId kötelező" }, 400)
    const { getVoucherStats } = await import("../services/voucher-service")
    const stats = await getVoucherStats(eventId, orgId)
    return json({ ok: true, stats })
  }

  if (segment === "vouchers" && path[1] === "resend" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("voucher:manage")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    if (!body.bookingId) return json({ error: "bookingId kötelező" }, 400)
    const { resendVoucherEmail } = await import("../services/voucher-service")
    await resendVoucherEmail(body.bookingId, orgId, {
      email: body.email,
      recipientName: body.recipientName,
    })
    return json({ ok: true })
  }

  if (segment === "vouchers" && path[1] === "send" && method === "POST") {
    const authResult = await resolveTBookAdminAuth("voucher:manage")
    const orgId = orgIdFromAuth(authResult)
    const body = await request.json()
    const { sendVoucherById, sendBookingVouchers } = await import("../services/voucher-service")
    if (body.voucherId) {
      await sendVoucherById(body.voucherId, {
        email: body.email,
        recipientName: body.recipientName,
      }, orgId)
    } else if (body.bookingId) {
      await sendBookingVouchers(body.bookingId, {
        email: body.email,
        recipientName: body.recipientName,
      }, orgId)
    } else {
      return json({ error: "voucherId vagy bookingId kötelező" }, 400)
    }
    return json({ ok: true })
  }

  if (segment === "vouchers" && path[1] && path[2] === "pdf" && method === "GET" && path.length === 3) {
    const authResult = await resolveTBookAdminAuth("voucher:read")
    const orgId = orgIdFromAuth(authResult)
    const { getVoucherPdfById } = await import("../services/voucher-service")
    const pdf = await getVoucherPdfById(path[1], orgId)
    if (!pdf) return json({ error: "Jegy PDF nem érhető el" }, 404)
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="jegy-${path[1]}.pdf"`,
      },
    })
  }

  if (segment === "vouchers" && path[1] === "bookings" && path[2] && path[3] === "pdf" && method === "GET") {
    const authResult = await resolveTBookAdminAuth("voucher:read")
    const orgId = orgIdFromAuth(authResult)
    const { getVoucherPdfForBooking } = await import("../services/voucher-service")
    const pdf = await getVoucherPdfForBooking(path[2], orgId)
    if (!pdf) return json({ error: "Jegy PDF nem érhető el" }, 404)
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="jegy-${path[2]}.pdf"`,
      },
    })
  }

  if (segment === "vouchers" && path[1] === "bookings" && path[2] && method === "GET" && path.length === 3) {
    const authResult = await resolveTBookAdminAuth("voucher:read")
    const orgId = orgIdFromAuth(authResult)
    const { listVouchersForBooking } = await import("../services/voucher-service")
    const vouchers = await listVouchersForBooking(path[2], orgId)
    return json({ ok: true, vouchers })
  }

  if (segment === "vouchers" && method === "GET" && path.length === 1) {
    const authResult = await resolveTBookAdminAuth("voucher:read")
    const orgId = orgIdFromAuth(authResult)
    const eventId = url.searchParams.get("eventId")
    if (!eventId) return json({ error: "eventId kötelező" }, 400)
    const { listVouchersByEvent, getVoucherStats } = await import("../services/voucher-service")
    const result = await listVouchersByEvent(eventId, orgId, {
      status: url.searchParams.get("status") || undefined,
      search: url.searchParams.get("search") || undefined,
      page: Number(url.searchParams.get("page") || 1),
      pageSize: Number(url.searchParams.get("pageSize") || 50),
    })
    const stats = await getVoucherStats(eventId, orgId)
    return json({ ok: true, stats, ...result })
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
