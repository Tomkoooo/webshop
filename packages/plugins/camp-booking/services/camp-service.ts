import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import Camp from "../models/Camp"
import CampSession from "../models/CampSession"
import CampTicketType, { type ICampTicketType } from "../models/CampTicketType"
import CampRegistration from "../models/CampRegistration"
import { formatSessionLabel } from "../lib/session-label"
import {
  filterStorefrontBaseTickets,
  isAddonTicketType,
  seatsRequiredForBooking,
} from "../lib/pricing"
import { serializeTicketTypeForApi } from "../lib/serialize-ticket"
import type { CampPricingSettings } from "../models/Camp"

function spotsLeft(session: { capacity: number; soldCount: number; reservedCount: number }) {
  return Math.max(0, session.capacity - session.soldCount - session.reservedCount)
}

export class CampService {
  static async listPublishedCampsWithSessions() {
    await dbConnect()
    const camps = await Camp.find({ isPublished: true }).sort({ sortOrder: 1, title: 1 }).lean()
    const campIds = camps.map((c) => c._id)
    const sessions = await CampSession.find({
      campId: { $in: campIds },
      isPublished: true,
    })
      .sort({ startDate: 1 })
      .lean()
    const sessionIds = sessions.map((s) => s._id)
    const ticketTypes = await CampTicketType.find({
      sessionId: { $in: sessionIds },
      isActive: true,
    })
      .sort({ sortOrder: 1 })
      .lean()

    const ticketsBySession = new Map<string, typeof ticketTypes>()
    for (const t of ticketTypes) {
      const key = String(t.sessionId)
      if (!ticketsBySession.has(key)) ticketsBySession.set(key, [])
      ticketsBySession.get(key)!.push(t)
    }

    const sessionsByCamp = new Map<string, typeof sessions>()
    for (const s of sessions) {
      const key = String(s.campId)
      if (!sessionsByCamp.has(key)) sessionsByCamp.set(key, [])
      sessionsByCamp.get(key)!.push(s)
    }

    return camps.map((camp) => ({
      id: String(camp._id),
      slug: camp.slug,
      title: camp.title,
      description: camp.description || "",
      heroImage: camp.heroImage || "",
      sessions: (sessionsByCamp.get(String(camp._id)) || []).map((session) => ({
        id: String(session._id),
        label: session.label,
        imageUrl: session.imageUrl || "",
        startDate: session.startDate,
        endDate: session.endDate,
        capacity: session.capacity,
        spotsLeft: spotsLeft(session),
        sessionLabel: formatSessionLabel(session.label, session.startDate, session.endDate),
        ticketTypes: filterStorefrontBaseTickets(
          (ticketsBySession.get(String(session._id)) || []).filter(
            (tt) => !isAddonTicketType({ kind: tt.kind, name: tt.name })
          )
        ).map((tt) => serializeTicketTypeForApi(tt)),
        addonTickets: (ticketsBySession.get(String(session._id)) || [])
          .filter((tt) => isAddonTicketType({ kind: tt.kind, name: tt.name }))
          .map((tt) => serializeTicketTypeForApi(tt)),
        laptopTicket: (() => {
          const lt = (ticketsBySession.get(String(session._id)) || []).find((tt) =>
            isAddonTicketType({ kind: tt.kind, name: tt.name })
          )
          return lt ? serializeTicketTypeForApi(lt) : null
        })(),
      })),
    }))
  }

  static async getSessionForBooking(sessionId: string) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) return null
    await dbConnect()
    const session = await CampSession.findOne({
      _id: sessionId,
      isPublished: true,
    }).lean()
    if (!session) return null
    const camp = await Camp.findById(session.campId).lean()
    if (!camp?.isPublished) return null
    const ticketTypes = await CampTicketType.find({ sessionId, isActive: true })
      .sort({ sortOrder: 1 })
      .lean()
    const pricingSettings = camp.pricingSettings ?? {
      multiChildDiscountPercent: 0,
      multiChildMinCount: 2,
      siblingDiscountPercent: 0,
      siblingMatchByLastName: true,
    }

    return {
      camp: {
        id: String(camp._id),
        title: camp.title,
        slug: camp.slug,
        heroImage: camp.heroImage || "",
        pricingSettings,
      },
      session: {
        id: String(session._id),
        label: session.label,
        startDate: session.startDate,
        endDate: session.endDate,
        capacity: session.capacity,
        spotsLeft: spotsLeft(session),
        sessionLabel: formatSessionLabel(session.label, session.startDate, session.endDate),
      },
      pricingSettings,
      ticketTypes: filterStorefrontBaseTickets(
        ticketTypes.filter((tt) => !isAddonTicketType({ kind: tt.kind, name: tt.name }))
      ).map((tt) => serializeTicketTypeForApi(tt)),
      addonTickets: ticketTypes
        .filter((tt) => isAddonTicketType({ kind: tt.kind, name: tt.name }))
        .map((tt) => serializeTicketTypeForApi(tt)),
      laptopTicket: (() => {
        const lt = ticketTypes.find((tt) =>
          isAddonTicketType({ kind: tt.kind, name: tt.name })
        )
        return lt ? serializeTicketTypeForApi(lt) : null
      })(),
    }
  }

  static async reserveSessionSeats(sessionId: mongoose.Types.ObjectId, seats: number) {
    const updated = await CampSession.findOneAndUpdate(
      {
        _id: sessionId,
        $expr: {
          $lte: [{ $add: ["$soldCount", "$reservedCount", seats] }, "$capacity"],
        },
      },
      { $inc: { reservedCount: seats } },
      { new: true }
    )
    if (!updated) {
      throw new Error("Nincs elég szabad hely ezen a turnuson.")
    }
    return updated
  }

  static async releaseSessionSeats(sessionId: mongoose.Types.ObjectId, seats: number) {
    await CampSession.findByIdAndUpdate(sessionId, {
      $inc: { reservedCount: -seats },
    })
  }

  static async confirmSessionSeats(sessionId: mongoose.Types.ObjectId, seats: number) {
    const updated = await CampSession.findOneAndUpdate(
      { _id: sessionId, reservedCount: { $gte: seats } },
      { $inc: { reservedCount: -seats, soldCount: seats } },
      { new: true }
    )
    if (!updated) {
      throw new Error("Foglalás megerősítése sikertelen (helyek).")
    }
    return updated
  }

  static seatsRequired = seatsRequiredForBooking

  // --- Admin ---

  static async listCampsAdmin() {
    await dbConnect()
    return Camp.find().sort({ sortOrder: 1, title: 1 }).lean()
  }

  static async createCamp(data: {
    slug: string
    title: string
    description?: string
    heroImage?: string
    sortOrder?: number
    isPublished?: boolean
  }) {
    await dbConnect()
    return Camp.create(data)
  }

  static async updateCamp(
    id: string,
    data: Partial<{
      slug: string
      title: string
      description: string
      heroImage: string
      sortOrder: number
      isPublished: boolean
      pricingSettings: CampPricingSettings
    }>
  ) {
    await dbConnect()
    return Camp.findByIdAndUpdate(id, { $set: data }, { new: true })
  }

  static async getCampAdmin(id: string) {
    await dbConnect()
    return Camp.findById(id).lean()
  }

  static async deleteCamp(id: string) {
    await dbConnect()
    const sessions = await CampSession.find({ campId: id }).select("_id").lean()
    const sessionIds = sessions.map((s) => s._id)
    await CampTicketType.deleteMany({ sessionId: { $in: sessionIds } })
    await CampRegistration.deleteMany({ campId: id })
    await CampSession.deleteMany({ campId: id })
    return Camp.findByIdAndDelete(id)
  }

  static async listSessionsAdmin(campId: string) {
    await dbConnect()
    return CampSession.find({ campId }).sort({ startDate: 1 }).lean()
  }

  static async getSessionAdmin(id: string) {
    await dbConnect()
    return CampSession.findById(id).lean()
  }

  static async createSession(
    campId: string,
    data: {
      label: string
      startDate: Date
      endDate: Date
      capacity: number
      isPublished?: boolean
      imageUrl?: string
    }
  ) {
    await dbConnect()
    return CampSession.create({
      campId,
      soldCount: 0,
      reservedCount: 0,
      ...data,
    })
  }

  static async updateSession(
    id: string,
    data: Partial<{
      label: string
      startDate: Date
      endDate: Date
      capacity: number
      isPublished: boolean
      imageUrl: string | null
    }>
  ) {
    await dbConnect()
    return CampSession.findByIdAndUpdate(id, { $set: data }, { new: true })
  }

  static async listTicketTypesAdmin(sessionId: string) {
    await dbConnect()
    return CampTicketType.find({ sessionId }).sort({ sortOrder: 1 }).lean()
  }

  static async createTicketType(
    sessionId: string,
    data: {
      name: string
      description?: string
      priceHuf: number
      pricingMode: "per_child" | "flat"
      kind?: "base" | "addon"
      earlyBirdEndsAt?: Date | string | null
      earlyBirdPriceHuf?: number | null
      earlyBirdDiscountPercent?: number | null
      isActive?: boolean
      sortOrder?: number
    }
  ): Promise<ICampTicketType> {
    await dbConnect()
    const { earlyBirdEndsAt, ...rest } = data
    const doc: Record<string, unknown> = { sessionId, ...rest }
    if (earlyBirdEndsAt) {
      doc.earlyBirdEndsAt = new Date(earlyBirdEndsAt)
    }
    return CampTicketType.create(doc)
  }

  static async updateTicketType(
    id: string,
    data: Partial<{
      name: string
      description: string
      priceHuf: number
      pricingMode: "per_child" | "flat"
      kind: "base" | "addon"
      earlyBirdEndsAt: Date | string | null
      earlyBirdPriceHuf: number | null
      earlyBirdDiscountPercent: number | null
      isActive: boolean
      sortOrder: number
    }>
  ) {
    await dbConnect()
    const patch = { ...data } as Record<string, unknown>
    if (data.earlyBirdEndsAt === null || data.earlyBirdEndsAt === "") {
      patch.earlyBirdEndsAt = undefined
    } else if (data.earlyBirdEndsAt) {
      patch.earlyBirdEndsAt = new Date(data.earlyBirdEndsAt)
    }
    return CampTicketType.findByIdAndUpdate(id, { $set: patch }, { new: true })
  }

  static async listRegistrationsForSession(sessionId: string) {
    await dbConnect()
    return CampRegistration.find({ sessionId, status: "paid" })
      .sort({ paidAt: -1 })
      .lean()
  }

  static async getSessionExportContext(sessionId: string) {
    await dbConnect()
    const session = await CampSession.findById(sessionId).lean()
    if (!session) return null
    const camp = await Camp.findById(session.campId).lean()
    const registrations = await CampRegistration.find({ sessionId, status: "paid" }).lean()
    return {
      session,
      camp,
      registrations,
      sessionLabel: formatSessionLabel(session.label, session.startDate, session.endDate),
    }
  }

  static async getDashboardStats() {
    await dbConnect()
    const now = new Date()

    const [paidAgg] = await CampRegistration.aggregate<{
      revenueHuf: number
      registrationCount: number
      childCount: number
    }>([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          revenueHuf: { $sum: "$totalHuf" },
          registrationCount: { $sum: 1 },
          childCount: { $sum: "$childCount" },
        },
      },
    ])

    const publishedCamps = await Camp.countDocuments({ isPublished: true })
    const publishedSessions = await CampSession.find({ isPublished: true })
      .select("capacity soldCount reservedCount startDate")
      .lean()

    let totalSpotsLeft = 0
    let upcomingSessions = 0
    for (const s of publishedSessions) {
      totalSpotsLeft += spotsLeft(s)
      if (new Date(s.startDate) >= now) upcomingSessions += 1
    }

    const activeHolds = await import("../models/CampCheckoutHold").then((m) =>
      m.default.countDocuments({
        status: { $in: ["created", "checkout_started"] },
        expiresAt: { $gt: now },
      })
    )

    const recentRegistrations = await CampRegistration.find({ status: "paid" })
      .sort({ paidAt: -1 })
      .limit(8)
      .select("buyerName sessionLabel campTitle totalHuf childCount paidAt")
      .lean()

    return {
      revenueHuf: paidAgg?.revenueHuf ?? 0,
      registrationCount: paidAgg?.registrationCount ?? 0,
      childCount: paidAgg?.childCount ?? 0,
      publishedCamps,
      publishedSessions: publishedSessions.length,
      upcomingSessions,
      spotsLeft: totalSpotsLeft,
      activeHolds,
      recentRegistrations: recentRegistrations.map((r) => ({
        buyerName: r.buyerName,
        sessionLabel: r.sessionLabel,
        campTitle: r.campTitle,
        totalHuf: r.totalHuf,
        childCount: r.childCount,
        paidAt: r.paidAt,
      })),
    }
  }
}
