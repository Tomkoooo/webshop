import { NextResponse } from "next/server"
import type { PluginApiContext } from "@wse/sdk/plugins/types"
import { CampService } from "../services/camp-service"
import { CampCheckoutService } from "../services/checkout-service"
import { buildCampRegistrationExcelBuffer } from "../lib/camp-registration-export"

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export async function handleCampBookingApi(context: PluginApiContext): Promise<Response> {
  const { path, request } = context
  const method = request.method.toUpperCase()
  const segment = path[0] ?? ""

  try {
    if (segment === "camps" && method === "GET" && path.length === 1) {
      const camps = await CampService.listPublishedCampsWithSessions()
      return json({ ok: true, camps })
    }

    if (segment === "sessions" && method === "GET" && path[1] && path.length === 2) {
      const detail = await CampService.getSessionForBooking(path[1])
      if (!detail) return json({ error: "Turnus nem található" }, 404)
      return json({ ok: true, ...detail })
    }

    if (segment === "checkout" && path[1] === "holds" && method === "POST") {
      const body = await request.json()
      const result = await CampCheckoutService.createHold(body)
      return json({ ok: true, ...result })
    }

    if (segment === "checkout" && path[1] === "stripe-session" && method === "POST") {
      const body = await request.json()
      const holdId = String(body?.holdId || "")
      const result = await CampCheckoutService.createStripeSession(holdId)
      return json({ ok: true, ...result })
    }

    if (segment === "checkout" && path[1] === "status" && method === "GET") {
      const url = new URL(request.url)
      const holdId = url.searchParams.get("holdId") || ""
      const sessionId = url.searchParams.get("session_id")
      const result = await CampCheckoutService.getCheckoutStatus(holdId, sessionId)
      return json({ ok: true, ...result })
    }

    if (segment === "admin") {
      const { requireAdmin } = await import("@wse/core/lib/admin-auth")
      await requireAdmin()
      return handleCampBookingAdminApi(path.slice(1), request, method)
    }

    return json({ error: "Not found", path }, 404)
  } catch (err) {
    console.error("[camp-booking]", err)
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ error: "Unauthorized" }, 401)
    }
    return json({ error: errorMessage(err, "Hiba történt") }, 400)
  }
}

async function handleCampBookingAdminApi(
  path: string[],
  request: Request,
  method: string
): Promise<Response> {
  const segment = path[0] ?? ""

  if (segment === "dashboard" && method === "GET" && path.length === 1) {
    const stats = await CampService.getDashboardStats()
    return json({
      ok: true,
      stats: {
        ...stats,
        recentRegistrations: stats.recentRegistrations.map((r) => ({
          ...r,
          paidAt: r.paidAt instanceof Date ? r.paidAt.toISOString() : r.paidAt,
        })),
      },
    })
  }

  if (segment === "camps" && method === "GET" && path.length === 1) {
    const camps = await CampService.listCampsAdmin()
    return json({
      ok: true,
      camps: camps.map((c) => ({
        id: String(c._id),
        slug: c.slug,
        title: c.title,
        description: c.description,
        heroImage: c.heroImage,
        sortOrder: c.sortOrder,
        isPublished: c.isPublished,
        pricingSettings: c.pricingSettings,
      })),
    })
  }

  if (segment === "camps" && path[1] && method === "GET" && path.length === 2) {
    const camp = await CampService.getCampAdmin(path[1])
    if (!camp) return json({ error: "Tábor nem található" }, 404)
    return json({
      ok: true,
      camp: {
        id: String(camp._id),
        slug: camp.slug,
        title: camp.title,
        description: camp.description,
        heroImage: camp.heroImage,
        sortOrder: camp.sortOrder,
        isPublished: camp.isPublished,
        pricingSettings: camp.pricingSettings,
      },
    })
  }

  if (segment === "camps" && method === "POST" && path.length === 1) {
    const body = await request.json()
    const camp = await CampService.createCamp(body)
    return json({ ok: true, id: String(camp._id) })
  }

  if (segment === "camps" && path[1] && method === "PUT" && path.length === 2) {
    const body = await request.json()
    await CampService.updateCamp(path[1], body)
    return json({ ok: true })
  }

  if (segment === "camps" && path[1] && method === "DELETE" && path.length === 2) {
    await CampService.deleteCamp(path[1])
    return json({ ok: true })
  }

  if (segment === "camps" && path[2] === "sessions" && method === "GET" && path.length === 3) {
    const sessions = await CampService.listSessionsAdmin(path[1])
    return json({
      ok: true,
      sessions: sessions.map((s) => ({
        id: String(s._id),
        campId: String(s.campId),
        label: s.label,
        startDate: s.startDate,
        endDate: s.endDate,
        capacity: s.capacity,
        soldCount: s.soldCount,
        reservedCount: s.reservedCount,
        isPublished: s.isPublished,
        imageUrl: s.imageUrl ?? "",
      })),
    })
  }

  if (segment === "camps" && path[2] === "sessions" && method === "POST" && path.length === 3) {
    const body = await request.json()
    const session = await CampService.createSession(path[1], {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    })
    return json({ ok: true, id: String(session._id) })
  }

  if (segment === "sessions" && path[1] && method === "GET" && path.length === 2) {
    const session = await CampService.getSessionAdmin(path[1])
    if (!session) return json({ error: "Turnus nem található" }, 404)
    return json({
      ok: true,
      session: {
        id: String(session._id),
        campId: String(session.campId),
        label: session.label,
        startDate: session.startDate,
        endDate: session.endDate,
        capacity: session.capacity,
        soldCount: session.soldCount,
        reservedCount: session.reservedCount,
        isPublished: session.isPublished,
        imageUrl: session.imageUrl ?? "",
      },
    })
  }

  if (segment === "sessions" && path[1] && method === "PUT" && path.length === 2) {
    const body = await request.json()
    const patch = { ...body }
    if (body.startDate) patch.startDate = new Date(body.startDate)
    if (body.endDate) patch.endDate = new Date(body.endDate)
    await CampService.updateSession(path[1], patch)
    return json({ ok: true })
  }

  if (segment === "sessions" && path[2] === "ticket-types" && method === "GET" && path.length === 3) {
    const types = await CampService.listTicketTypesAdmin(path[1])
    return json({
      ok: true,
      ticketTypes: types.map((t) => ({
        id: String(t._id),
        sessionId: String(t.sessionId),
        name: t.name,
        description: t.description ?? "",
        priceHuf: t.priceHuf,
        pricingMode: t.pricingMode,
        kind: t.kind ?? "base",
        earlyBirdEndsAt: t.earlyBirdEndsAt?.toISOString() ?? null,
        earlyBirdPriceHuf: t.earlyBirdPriceHuf ?? null,
        earlyBirdDiscountPercent: t.earlyBirdDiscountPercent ?? null,
        isActive: t.isActive,
        sortOrder: t.sortOrder,
      })),
    })
  }

  if (segment === "sessions" && path[2] === "ticket-types" && method === "POST" && path.length === 3) {
    const body = await request.json()
    const tt = await CampService.createTicketType(path[1], body)
    return json({ ok: true, id: String(tt._id) })
  }

  if (segment === "ticket-types" && path[1] && method === "PUT" && path.length === 2) {
    const body = await request.json()
    await CampService.updateTicketType(path[1], body)
    return json({ ok: true })
  }

  if (
    segment === "sessions" &&
    path[2] === "registrations" &&
    method === "GET" &&
    path.length === 3
  ) {
    const regs = await CampService.listRegistrationsForSession(path[1])
    return json({
      ok: true,
      registrations: regs.map((r) => ({
        id: String(r._id),
        buyerName: r.buyerName,
        buyerEmail: r.buyerEmail,
        buyerPhone: r.buyerPhone,
        childCount: r.childCount,
        totalHuf: r.totalHuf,
        ticketTypeName: r.ticketTypeName,
        paidAt: r.paidAt,
        children: r.children,
      })),
    })
  }

  if (
    segment === "sessions" &&
    path[2] === "export" &&
    method === "GET" &&
    path.length === 3
  ) {
    const ctx = await CampService.getSessionExportContext(path[1])
    if (!ctx) return json({ error: "Turnus nem található" }, 404)
    const buffer = await buildCampRegistrationExcelBuffer(ctx.registrations, {
      sessionLabel: ctx.sessionLabel,
      campTitle: ctx.camp?.title || "",
    })
    const filename = `turnus-${path[1]}.xlsx`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  return json({ error: "Admin route not found", path }, 404)
}
