import "server-only"

import mongoose from "mongoose"
import { randomUUID } from "crypto"
import { PDFDocument } from "pdf-lib"
import dbConnect from "@wse/core/lib/db"
import { MediaService } from "@wse/core/services/media"
import TBookBooking from "../models/TBookBooking"
import TBookEvent from "../models/TBookEvent"
import TBookEventGroup from "../models/TBookEventGroup"
import TBookVoucher from "../models/TBookVoucher"
import type { ITBookVoucher, TBookVoucherEventSnapshot } from "../models/TBookVoucher"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"
import { attendeeFieldLabelMap } from "../lib/attendee-fields"
import { buildVoucherPdf } from "../lib/voucher-pdf"
import { resolveVoucherHeaderImage } from "../lib/voucher-header"
import { sendVoucherEmail } from "../lib/send-voucher-email"

export type VoucherScanResult =
  | "valid"
  | "duplicate"
  | "invalid"
  | "wrong_event"

export type VoucherScanResponse = {
  result: VoucherScanResult
  voucher?: {
    id: string
    token: string
    status: string
    displayName: string
    attendeeIndex: number
    attendeeFields: Record<string, string | number>
    eventSnapshot: TBookVoucherEventSnapshot
    bookingId: string
    checkedInAt: string | null
  }
  message?: string
}

function oid(id: string) {
  return new mongoose.Types.ObjectId(id)
}

/** Resolve display name from attendee fields or customer name. */
export function resolveAttendeeDisplayName(
  attendeeIndex: number,
  attendees: { fields: Record<string, string | number> }[],
  attendeeFieldSchema: TBookAttendeeFieldDef[],
  customerName: string,
  guests: number
): string {
  const attendee = attendees[attendeeIndex]
  const fields = attendee?.fields ?? {}

  const nameField = attendeeFieldSchema.find(
    (f) =>
      f.type === "text" &&
      (/név|name/i.test(f.label) || /név|name/i.test(f.key))
  )
  if (nameField && fields[nameField.key]) {
    return String(fields[nameField.key]).trim()
  }

  const firstTextField = attendeeFieldSchema.find((f) => f.type === "text" && fields[f.key])
  if (firstTextField && fields[firstTextField.key]) {
    return String(fields[firstTextField.key]).trim()
  }

  if (guests === 1) return customerName.trim()
  return `${customerName.trim()} (${attendeeIndex + 1}. vendég)`
}

function eventSnapshotFromEvent(event: {
  name: string
  startDate: Date
  endDate: Date
  startTime?: string | null
  endTime?: string | null
  location?: { address?: string }
}): TBookVoucherEventSnapshot {
  return {
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime ?? null,
    endTime: event.endTime ?? null,
    locationAddress: event.location?.address ?? "",
  }
}

export async function issueVouchersForBooking(bookingId: string): Promise<string | null> {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return null
  await dbConnect()

  const existing = await TBookVoucher.findOne({ bookingId: oid(bookingId) }).lean()
  if (existing) return existing.pdfFileName

  const booking = await TBookBooking.findById(bookingId)
  if (!booking) return null
  if (!["paid", "confirmed"].includes(booking.status)) return null

  const event = await TBookEvent.findById(booking.eventId).lean()
  if (!event || !event.vouchersEnabled) return null

  const group = event.groupId
    ? await TBookEventGroup.findById(event.groupId)
        .select("voucherHeaderImage defaultHeroImage")
        .lean()
    : null
  const headerImage = resolveVoucherHeaderImage(event, group)
  const eventSnapshot = eventSnapshotFromEvent(event)
  const schema = booking.attendeeFieldSchema ?? []

  const tokens: { attendeeIndex: number; token: string; displayName: string; fields: Record<string, string | number> }[] = []

  for (let i = 0; i < booking.guests; i += 1) {
    const token = randomUUID()
    const displayName = resolveAttendeeDisplayName(
      i,
      booking.attendees ?? [],
      schema,
      booking.customer.name,
      booking.guests
    )
    const fields = booking.attendees?.[i]?.fields ?? {}
    tokens.push({ attendeeIndex: i, token, displayName, fields })
  }

  const pdfPages = tokens.map((t) => ({
    token: t.token,
    displayName: t.displayName,
    attendeeFields: t.fields,
    attendeeFieldSchema: schema,
    eventName: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime ?? null,
    endTime: event.endTime ?? null,
    locationAddress: eventSnapshot.locationAddress,
    bookingId,
    pageIndex: t.attendeeIndex + 1,
    pageCount: tokens.length,
  }))

  const pdfBytes = await buildVoucherPdf({ headerImage, pages: pdfPages })
  const pdfFileName = await MediaService.processUpload(
    Buffer.from(pdfBytes),
    `voucher-${bookingId}.pdf`,
    "application/pdf"
  )
  await MediaService.incrementUsage(pdfFileName)

  const voucherDocs = tokens.map((t) => ({
    organizationId: booking.organizationId ?? null,
    eventId: booking.eventId,
    bookingId: booking._id,
    attendeeIndex: t.attendeeIndex,
    token: t.token,
    status: "active" as const,
    displayName: t.displayName,
    attendeeFields: t.fields,
    eventSnapshot,
    pdfFileName,
    emailedAt: null,
    checkedInAt: null,
    checkedInByUserId: null,
  }))

  await TBookVoucher.insertMany(voucherDocs)

  const pdfBuffer = Buffer.from(pdfBytes)
  await sendVoucherEmail({
    to: booking.customer.email,
    recipientName: booking.customer.name,
    eventName: booking.eventName,
    bookingId,
    voucherCount: tokens.length,
    guests: booking.guests,
    pdfBuffer,
    pdfFilename: `jegy-${bookingId.slice(-8)}.pdf`,
  })
  const now = new Date()
  await TBookVoucher.updateMany(
    { bookingId: booking._id },
    {
      $set: {
        emailedAt: now,
        lastSentToEmail: booking.customer.email,
        lastSentToName: booking.customer.name,
      },
    }
  )

  return pdfFileName
}

export async function voidVouchersForBooking(bookingId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return
  await dbConnect()
  await TBookVoucher.updateMany(
    { bookingId: oid(bookingId), status: { $ne: "void" } },
    { $set: { status: "void" } }
  )
}

export async function resendVoucherEmail(
  bookingId: string,
  organizationId?: string,
  opts?: { email?: string; recipientName?: string }
): Promise<void> {
  await sendBookingVouchers(
    bookingId,
    { email: opts?.email, recipientName: opts?.recipientName },
    organizationId
  )
}

export async function getVoucherPdfForBooking(
  bookingId: string,
  organizationId?: string
): Promise<Buffer | null> {
  await dbConnect()
  const booking = await TBookBooking.findById(bookingId).lean()
  if (!booking) return null
  if (organizationId && booking.organizationId && String(booking.organizationId) !== organizationId) {
    return null
  }

  const voucher = await TBookVoucher.findOne({ bookingId: oid(bookingId) }).lean()
  if (!voucher?.pdfFileName) return null

  const payload = await MediaService.getFilePayload(voucher.pdfFileName)
  return payload?.buffer ?? null
}

export async function listVouchersForBooking(
  bookingId: string,
  organizationId?: string
) {
  await dbConnect()
  const booking = await TBookBooking.findById(bookingId).lean()
  if (!booking) return []
  if (organizationId && booking.organizationId && String(booking.organizationId) !== organizationId) {
    return []
  }

  const vouchers = await TBookVoucher.find({ bookingId: oid(bookingId) })
    .sort({ attendeeIndex: 1 })
    .lean()

  return vouchers.map(serializeVoucher)
}

export async function getVoucherStats(eventId: string, organizationId?: string) {
  await dbConnect()
  const match: Record<string, unknown> = { eventId: oid(eventId) }
  if (organizationId) match.organizationId = oid(organizationId)

  const [totals] = await TBookVoucher.aggregate<{ total: number; checkedIn: number; active: number; voided: number }>([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        checkedIn: { $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        voided: { $sum: { $cond: [{ $eq: ["$status", "void"] }, 1, 0] } },
      },
    },
  ])

  return {
    total: totals?.total ?? 0,
    checkedIn: totals?.checkedIn ?? 0,
    active: totals?.active ?? 0,
    voided: totals?.voided ?? 0,
  }
}

function serializeVoucher(v: ITBookVoucher | Record<string, unknown>) {
  const doc = v as ITBookVoucher & {
    bookingCustomer?: { name?: string; email?: string; phone?: string }
    bookingStatus?: string
    createdAt?: Date
    updatedAt?: Date
  }
  return {
    id: String(doc._id),
    token: doc.token,
    status: doc.status,
    displayName: doc.displayName,
    attendeeIndex: doc.attendeeIndex,
    attendeeFields: doc.attendeeFields ?? {},
    eventSnapshot: doc.eventSnapshot,
    eventId: doc.eventId ? String(doc.eventId) : undefined,
    bookingId: String(doc.bookingId),
    pdfFileName: doc.pdfFileName,
    emailedAt: doc.emailedAt,
    lastSentToEmail: doc.lastSentToEmail ?? null,
    lastSentToName: doc.lastSentToName ?? null,
    checkedInAt: doc.checkedInAt
      ? doc.checkedInAt instanceof Date
        ? doc.checkedInAt.toISOString()
        : String(doc.checkedInAt)
      : null,
    checkedInByUserId: doc.checkedInByUserId ? String(doc.checkedInByUserId) : null,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
    bookingCustomer: doc.bookingCustomer,
    bookingStatus: doc.bookingStatus,
  }
}

async function loadBookingPdfBuffer(pdfFileName: string): Promise<Buffer> {
  const payload = await MediaService.getFilePayload(pdfFileName)
  if (!payload?.buffer) throw new Error("Jegy PDF nem található.")
  return payload.buffer
}

/** Extract a single guest page from the stored multi-page booking PDF. */
export async function extractVoucherPagePdf(
  pdfFileName: string,
  attendeeIndex: number
): Promise<Buffer> {
  const sourceBuffer = await loadBookingPdfBuffer(pdfFileName)
  const source = await PDFDocument.load(sourceBuffer)
  if (attendeeIndex < 0 || attendeeIndex >= source.getPageCount()) {
    throw new Error("Érvénytelen jegy oldal.")
  }
  const target = await PDFDocument.create()
  const [page] = await target.copyPages(source, [attendeeIndex])
  target.addPage(page)
  return Buffer.from(await target.save())
}

async function markVoucherSent(
  voucherIds: mongoose.Types.ObjectId[],
  email: string,
  name: string
) {
  const now = new Date()
  await TBookVoucher.updateMany(
    { _id: { $in: voucherIds } },
    {
      $set: {
        emailedAt: now,
        lastSentToEmail: email.trim(),
        lastSentToName: name.trim(),
      },
    }
  )
}

export async function sendVoucherById(
  voucherId: string,
  input: { email: string; recipientName: string },
  organizationId?: string
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(voucherId)) {
    throw new Error("Érvénytelen jegy azonosító.")
  }
  const email = input.email.trim()
  const recipientName = input.recipientName.trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Érvénytelen e-mail cím.")
  }
  if (!recipientName) throw new Error("A címzett neve kötelező.")

  await dbConnect()
  const voucher = await TBookVoucher.findById(voucherId)
  if (!voucher) throw new Error("Jegy nem található.")
  if (organizationId && voucher.organizationId && String(voucher.organizationId) !== organizationId) {
    throw new Error("A jegy nem tartozik ehhez a szervezethez.")
  }
  if (voucher.status === "void") throw new Error("A jegy érvénytelen.")
  if (!voucher.pdfFileName) throw new Error("Jegy PDF nem elérhető.")

  const booking = await TBookBooking.findById(voucher.bookingId).lean()
  if (!booking) throw new Error("Foglalás nem található.")

  const pdfBuffer = await extractVoucherPagePdf(voucher.pdfFileName, voucher.attendeeIndex)
  const bookingId = String(booking._id)

  await sendVoucherEmail({
    to: email,
    recipientName,
    eventName: booking.eventName,
    bookingId,
    voucherCount: 1,
    guests: booking.guests,
    pdfBuffer,
    pdfFilename: `jegy-${voucher.displayName.replace(/\s+/g, "-").slice(0, 24)}.pdf`,
    logContext: { voucherId, manualSend: true },
  })

  await markVoucherSent([voucher._id], email, recipientName)
}

export async function sendBookingVouchers(
  bookingId: string,
  input: { email?: string; recipientName?: string },
  organizationId?: string
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("Érvénytelen foglalás.")
  }
  await dbConnect()
  const booking = await TBookBooking.findById(bookingId)
  if (!booking) throw new Error("Foglalás nem található.")
  if (organizationId && booking.organizationId && String(booking.organizationId) !== organizationId) {
    throw new Error("A foglalás nem tartozik ehhez a szervezethez.")
  }
  if (!["paid", "confirmed"].includes(booking.status)) {
    throw new Error("Csak fizetett foglaláshoz küldhető jegy.")
  }

  const email = (input.email ?? booking.customer.email).trim()
  const recipientName = (input.recipientName ?? booking.customer.name).trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Érvénytelen e-mail cím.")
  }
  if (!recipientName) throw new Error("A címzett neve kötelező.")

  let voucher = await TBookVoucher.findOne({ bookingId: booking._id }).lean()
  if (!voucher?.pdfFileName) {
    await issueVouchersForBooking(bookingId)
    voucher = await TBookVoucher.findOne({ bookingId: booking._id }).lean()
  }
  if (!voucher?.pdfFileName) throw new Error("Jegy PDF nem elérhető.")

  const count = await TBookVoucher.countDocuments({ bookingId: booking._id })
  const pdfBuffer = await loadBookingPdfBuffer(voucher.pdfFileName)

  await sendVoucherEmail({
    to: email,
    recipientName,
    eventName: booking.eventName,
    bookingId,
    voucherCount: count,
    guests: booking.guests,
    pdfBuffer,
    pdfFilename: `jegy-${bookingId.slice(-8)}.pdf`,
    logContext: { manualSend: true },
  })

  const voucherIds = await TBookVoucher.find({ bookingId: booking._id }).select("_id").lean()
  await markVoucherSent(
    voucherIds.map((v) => v._id),
    email,
    recipientName
  )
}

export async function getVoucherPdfById(
  voucherId: string,
  organizationId?: string
): Promise<Buffer | null> {
  if (!mongoose.Types.ObjectId.isValid(voucherId)) return null
  await dbConnect()
  const voucher = await TBookVoucher.findById(voucherId).lean()
  if (!voucher?.pdfFileName) return null
  if (organizationId && voucher.organizationId && String(voucher.organizationId) !== organizationId) {
    return null
  }
  return extractVoucherPagePdf(voucher.pdfFileName, voucher.attendeeIndex)
}

export async function scanVoucher(
  rawToken: string,
  opts: {
    eventId?: string
    organizationId?: string
    userId?: string
    mode?: "check_in" | "lookup"
  } = {}
): Promise<VoucherScanResponse> {
  const { parseVoucherTokenFromScan } = await import("../lib/voucher-pdf")
  const token = parseVoucherTokenFromScan(rawToken)
  if (!token) {
    return { result: "invalid", message: "Érvénytelen QR-kód." }
  }

  await dbConnect()
  const voucher = await TBookVoucher.findOne({ token }).lean()
  if (!voucher) {
    return { result: "invalid", message: "Jegy nem található." }
  }

  if (opts.organizationId && voucher.organizationId && String(voucher.organizationId) !== opts.organizationId) {
    return { result: "invalid", message: "Jegy nem található." }
  }

  if (opts.eventId && String(voucher.eventId) !== opts.eventId) {
    return {
      result: "wrong_event",
      message: "Ez a jegy más eseményhez tartozik.",
      voucher: serializeVoucher(voucher),
    }
  }

  if (voucher.status === "void") {
    return { result: "invalid", message: "A jegy érvénytelen (foglalás törölve)." }
  }

  const basePayload = {
    voucher: {
      ...serializeVoucher(voucher),
      checkedInAt: voucher.checkedInAt ? voucher.checkedInAt.toISOString() : null,
    },
  }

  if (voucher.status === "checked_in") {
    return {
      result: "duplicate",
      message: "A jegy már be lett léptetve.",
      ...basePayload,
    }
  }

  if (opts.mode === "lookup") {
    return {
      result: "valid",
      message: "Érvényes jegy (még nem léptetve be).",
      ...basePayload,
    }
  }

  const now = new Date()
  const updated = await TBookVoucher.findOneAndUpdate(
    { _id: voucher._id, status: "active" },
    {
      $set: {
        status: "checked_in",
        checkedInAt: now,
        checkedInByUserId: opts.userId ?? null,
      },
    },
    { new: true }
  )

  if (!updated) {
    const latest = await TBookVoucher.findById(voucher._id).lean()
    return {
      result: "duplicate",
      message: "A jegy már be lett léptetve.",
      voucher: latest
        ? {
            ...serializeVoucher(latest),
            checkedInAt: latest.checkedInAt ? latest.checkedInAt.toISOString() : null,
          }
        : basePayload.voucher,
    }
  }

  return {
    result: "valid",
    message: "Beléptetés sikeres.",
    voucher: {
      ...serializeVoucher(updated),
      checkedInAt: now.toISOString(),
    },
  }
}

export async function listVouchersByEvent(
  eventId: string,
  organizationId?: string,
  opts?: { status?: string; search?: string; page?: number; pageSize?: number }
) {
  await dbConnect()
  const match: Record<string, unknown> = { eventId: oid(eventId) }
  if (organizationId) match.organizationId = oid(organizationId)
  if (opts?.status) match.status = opts.status

  if (opts?.search?.trim()) {
    const q = opts.search.trim()
    match.$or = [
      { displayName: { $regex: q, $options: "i" } },
      { token: { $regex: q, $options: "i" } },
      { lastSentToEmail: { $regex: q, $options: "i" } },
    ]
  }

  const page = Math.max(1, opts?.page ?? 1)
  const pageSize = Math.min(200, Math.max(1, opts?.pageSize ?? 50))
  const skip = (page - 1) * pageSize

  const [total, vouchers] = await Promise.all([
    TBookVoucher.countDocuments(match),
    TBookVoucher.find(match)
      .sort({ checkedInAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ])

  const bookingIds = [...new Set(vouchers.map((v) => String(v.bookingId)))]
  const bookings = bookingIds.length
    ? await TBookBooking.find({ _id: { $in: bookingIds.map(oid) } })
        .select("_id customer status")
        .lean()
    : []
  const bookingMap = new Map(
    bookings.map((b) => [
      String(b._id),
      { name: b.customer.name, email: b.customer.email, phone: b.customer.phone, status: b.status },
    ])
  )

  return {
    total,
    page,
    pageSize,
    vouchers: vouchers.map((v) =>
      serializeVoucher({
        ...v,
        bookingCustomer: bookingMap.get(String(v.bookingId)),
        bookingStatus: bookingMap.get(String(v.bookingId))?.status,
      })
    ),
  }
}

export { attendeeFieldLabelMap }
