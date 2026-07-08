import dbConnect from "@wse/core/lib/db"
import { hashPassword, verifyPassword } from "@wse/core/lib/password"
import PressContact, { type IPressContact } from "../models/PressContact"
import PressKitSettings, {
  type IPressKitSettings,
  type PressKitAccessMode,
} from "../models/PressKitSettings"
import PressKitAccessLog, { type PressKitAccessEvent } from "../models/PressKitAccessLog"
import { generateAccessToken, generateReadablePassword } from "../lib/generate-password"
import { hashClientIp } from "../lib/ip-hash"
import { buildAccessInstructions, buildPressPortalUrl } from "../lib/portal-url"
import { MailerService } from "@wse/core/services/mailer"
import { logMailer } from "@wse/core/lib/mailer-log"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { MediaService } from "@wse/core/services/media"
import { getPluginConfigForDeployment } from "@wse/core/config/deployments-registry"
import {
  flattenPressKitPageContent,
  normalizePressKitPageContent,
  type PressKitPageContent,
} from "../lib/page-content"

const SETTINGS_KEY = "default"

export type PressContactPublic = {
  id: string
  name: string
  outlet: string
  email: string
  accessToken: string
  isActive: boolean
  inviteSentAt: string | null
  lastAccessAt: string | null
  notes: string
  hasPassword: boolean
}

function serializeContact(doc: IPressContact): PressContactPublic {
  return {
    id: String(doc._id),
    name: doc.name,
    outlet: doc.outlet,
    email: doc.email,
    accessToken: doc.accessToken,
    isActive: doc.isActive,
    inviteSentAt: doc.inviteSentAt ? doc.inviteSentAt.toISOString() : null,
    lastAccessAt: doc.lastAccessAt ? doc.lastAccessAt.toISOString() : null,
    notes: doc.notes || "",
    hasPassword: Boolean(doc.passwordHash),
  }
}

export class PressKitService {
  static async getOrCreateSettings(): Promise<IPressKitSettings> {
    await dbConnect()
    let doc = await PressKitSettings.findOne({ singletonKey: SETTINGS_KEY })
    if (!doc) {
      doc = await PressKitSettings.create({ singletonKey: SETTINGS_KEY })
    }
    return doc
  }

  static async updateSettings(
    patch: Partial<
      Pick<
        IPressKitSettings,
        | "accessMode"
        | "pageTitle"
        | "heroImage"
        | "embargoNote"
        | "sections"
        | "productHighlights"
        | "pdfMediaFilename"
        | "pdfSettings"
        | "isPublished"
      >
    > & { sharedPassword?: string; pageContent?: PressKitPageContent; pageBlocks?: unknown[] }
  ): Promise<IPressKitSettings> {
    await dbConnect()
    const update: Record<string, unknown> = { ...patch }
    delete update.sharedPassword
    delete update.pageContent
    delete update.pageBlocks

    if (patch.pageContent) {
      const flat = flattenPressKitPageContent(patch.pageContent)
      Object.assign(update, flat)
    } else if (patch.pageBlocks) {
      const flat = flattenPressKitPageContent({ blocks: patch.pageBlocks as PressKitPageContent["blocks"] })
      Object.assign(update, flat)
    }
    if (patch.sharedPassword !== undefined) {
      update.sharedPasswordHash = patch.sharedPassword
        ? hashPassword(patch.sharedPassword)
        : null
    }
    if (patch.isPublished === true) {
      update.publishedAt = new Date()
    }
    const doc = await PressKitSettings.findOneAndUpdate(
      { singletonKey: SETTINGS_KEY },
      { $set: update },
      { upsert: true, new: true }
    )
    return doc!
  }

  static async listContacts(): Promise<PressContactPublic[]> {
    await dbConnect()
    const docs = await PressContact.find().sort({ outlet: 1, name: 1 }).lean()
    return docs.map((d) => serializeContact(d as IPressContact))
  }

  static async createContact(input: {
    name: string
    outlet: string
    email: string
    password?: string
    notes?: string
  }): Promise<{ contact: PressContactPublic; plainPassword: string | null }> {
    await dbConnect()
    const plainPassword = input.password?.trim() || generateReadablePassword()
    const settings = await this.getOrCreateSettings()
    const needsPassword =
      settings.accessMode === "password_per_contact" ||
      (settings.accessMode === "unique_link" && !input.password)

    const doc = await PressContact.create({
      name: input.name.trim(),
      outlet: input.outlet.trim(),
      email: input.email.trim().toLowerCase(),
      accessToken: generateAccessToken(),
      passwordHash: needsPassword ? hashPassword(plainPassword) : input.password ? hashPassword(input.password) : undefined,
      notes: input.notes?.trim() || "",
      isActive: true,
    })
    return {
      contact: serializeContact(doc),
      plainPassword: needsPassword || input.password ? plainPassword : null,
    }
  }

  static async updateContact(
    id: string,
    patch: Partial<{
      name: string
      outlet: string
      email: string
      isActive: boolean
      notes: string
      regeneratePassword: boolean
      regenerateToken: boolean
    }>
  ): Promise<{ contact: PressContactPublic; plainPassword: string | null }> {
    await dbConnect()
    const doc = await PressContact.findById(id)
    if (!doc) throw new Error("Kapcsolat nem található")

    if (patch.name !== undefined) doc.name = patch.name.trim()
    if (patch.outlet !== undefined) doc.outlet = patch.outlet.trim()
    if (patch.email !== undefined) doc.email = patch.email.trim().toLowerCase()
    if (patch.isActive !== undefined) doc.isActive = patch.isActive
    if (patch.notes !== undefined) doc.notes = patch.notes.trim()
    if (patch.regenerateToken) doc.accessToken = generateAccessToken()

    let plainPassword: string | null = null
    if (patch.regeneratePassword) {
      plainPassword = generateReadablePassword()
      doc.passwordHash = hashPassword(plainPassword)
    }

    await doc.save()
    return { contact: serializeContact(doc), plainPassword }
  }

  static async deleteContact(id: string): Promise<void> {
    await dbConnect()
    await PressContact.findByIdAndDelete(id)
  }

  static async findContactById(id: string): Promise<IPressContact | null> {
    await dbConnect()
    return PressContact.findById(id)
  }

  static async findContactByToken(token: string): Promise<IPressContact | null> {
    await dbConnect()
    return PressContact.findOne({ accessToken: token, isActive: true })
  }

  static async findContactByEmail(email: string): Promise<IPressContact | null> {
    await dbConnect()
    return PressContact.findOne({ email: email.trim().toLowerCase(), isActive: true })
  }

  static async authenticate(params: {
    accessMode: PressKitAccessMode
    email?: string
    password?: string
    token?: string
    sharedPasswordHash?: string
  }): Promise<IPressContact | null> {
    const { accessMode, email, password, token, sharedPasswordHash } = params

    if (accessMode === "unique_link") {
      if (!token) return null
      const contact = await this.findContactByToken(token)
      if (!contact) return null
      if (contact.passwordHash) {
        if (!password || !verifyPassword(password, contact.passwordHash)) return null
      }
      return contact
    }

    if (!email?.trim() || !password) return null
    const contact = await this.findContactByEmail(email)
    if (!contact) return null

    if (accessMode === "password_per_contact") {
      if (!contact.passwordHash || !verifyPassword(password, contact.passwordHash)) return null
      return contact
    }

    if (accessMode === "shared_password") {
      if (!sharedPasswordHash || !verifyPassword(password, sharedPasswordHash)) return null
      return contact
    }

    return null
  }

  static async recordAccess(
    event: PressKitAccessEvent,
    contactId: string | null,
    metadata: Record<string, unknown> = {},
    clientIp?: string | null
  ): Promise<void> {
    await dbConnect()
    await PressKitAccessLog.create({
      contactId: contactId || null,
      event,
      metadata,
      ipHash: hashClientIp(clientIp),
    })
    if (contactId && (event === "portal_open" || event === "page_view")) {
      await PressContact.findByIdAndUpdate(contactId, { lastAccessAt: new Date() })
    }
  }

  static async getStats(from?: Date, to?: Date) {
    await dbConnect()
    const match: Record<string, unknown> = {}
    if (from || to) {
      match.createdAt = {}
      if (from) (match.createdAt as Record<string, Date>).$gte = from
      if (to) (match.createdAt as Record<string, Date>).$lte = to
    }

    const byContact = await PressKitAccessLog.aggregate([
      { $match: { ...match, contactId: { $ne: null } } },
      {
        $group: {
          _id: "$contactId",
          portalOpens: {
            $sum: { $cond: [{ $eq: ["$event", "portal_open"] }, 1, 0] },
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ["$event", "page_view"] }, 1, 0] },
          },
          pdfOpens: {
            $sum: { $cond: [{ $eq: ["$event", "pdf_open"] }, 1, 0] },
          },
          pdfPageViews: {
            $sum: { $cond: [{ $eq: ["$event", "pdf_page_view"] }, 1, 0] },
          },
          lastEventAt: { $max: "$createdAt" },
        },
      },
      { $sort: { lastEventAt: -1 } },
    ])

    const contacts = await PressContact.find().lean()
    const contactMap = new Map(contacts.map((c) => [String(c._id), c]))

    return byContact.map((row) => {
      const c = contactMap.get(String(row._id))
      return {
        contactId: String(row._id),
        name: c?.name || "—",
        outlet: c?.outlet || "—",
        email: c?.email || "—",
        portalOpens: row.portalOpens as number,
        pageViews: row.pageViews as number,
        pdfOpens: row.pdfOpens as number,
        pdfPageViews: row.pdfPageViews as number,
        lastEventAt: row.lastEventAt ? new Date(row.lastEventAt as Date).toISOString() : null,
      }
    })
  }

  static async getOverviewStats() {
    await dbConnect()
    const [contactCount, published, recentOpens] = await Promise.all([
      PressContact.countDocuments({ isActive: true }),
      PressKitSettings.findOne({ singletonKey: SETTINGS_KEY }).select("isPublished accessMode").lean(),
      PressKitAccessLog.countDocuments({
        event: "portal_open",
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ])
    return {
      contactCount,
      isPublished: Boolean(published?.isPublished),
      accessMode: (published?.accessMode as PressKitAccessMode) || "unique_link",
      opensLast7Days: recentOpens,
    }
  }

  static async getPublishedContent(): Promise<IPressKitSettings | null> {
    await dbConnect()
    const doc = await PressKitSettings.findOne({ singletonKey: SETTINGS_KEY, isPublished: true }).lean()
    return doc as IPressKitSettings | null
  }

  static async getPdfBuffer(filename: string): Promise<Buffer | null> {
    const payload = await MediaService.getFilePayload(filename)
    if (!payload?.buffer) return null
    return payload.buffer
  }

  static async sendInvites(params: {
    contactIds: string[]
    origin: string
    host?: string | null
  }): Promise<{ sent: number; failed: string[] }> {
    await dbConnect()
    const settings = await this.getOrCreateSettings()
    const branding = await BrandingSettingsService.get()
    const pluginConfig = getPluginConfigForDeployment("press-kit", params.host)
    const routePrefix = String(pluginConfig.routePrefix || "sajto")
    const analyticsNotice =
      pluginConfig.analyticsOnPressPortal === false
        ? ""
        : "A portál használatát mérjük a sajtószolgálat javítása érdekében."

    const contacts = await PressContact.find({
      _id: { $in: params.contactIds },
      isActive: true,
    })

    let sent = 0
    const failed: string[] = []

    for (const contact of contacts) {
      const portalUrl = buildPressPortalUrl({
        origin: params.origin,
        routePrefix,
        accessMode: settings.accessMode,
        accessToken: contact.accessToken,
      })

      let passwordForEmail = ""
      if (settings.accessMode === "shared_password") {
        passwordForEmail = ""
      } else if (
        settings.accessMode === "password_per_contact" ||
        (settings.accessMode === "unique_link" && contact.passwordHash)
      ) {
        const plain = generateReadablePassword()
        contact.passwordHash = hashPassword(plain)
        passwordForEmail = plain
      }

      try {
        await MailerService.sendEmail({
          to: contact.email,
          templateType: "press_kit_invite",
          data: {
            name: contact.name,
            outlet: contact.outlet,
            portalUrl,
            password: passwordForEmail,
            accessInstructions: buildAccessInstructions(settings.accessMode),
            analyticsNotice,
          },
          logContext: {
            flow: "press_kit_invite",
            contactId: String(contact._id),
            pluginId: "press-kit",
          },
        })
        contact.inviteSentAt = new Date()
        await contact.save()
        sent++
      } catch (error) {
        logMailer("error", "press_kit_invite_failed", {
          contactId: String(contact._id),
          error: error instanceof Error ? error.message : String(error),
        })
        failed.push(contact.email)
      }
    }

    return { sent, failed }
  }

  static serializeSettings(doc: IPressKitSettings) {
    const pageContent = normalizePressKitPageContent(doc)
    return {
      accessMode: doc.accessMode,
      pageTitle: doc.pageTitle,
      heroImage: doc.heroImage || "",
      embargoNote: doc.embargoNote || "",
      sections: doc.sections || [],
      productHighlights: doc.productHighlights || [],
      pageContent,
      pdfMediaFilename: doc.pdfMediaFilename || "",
      pdfSettings: doc.pdfSettings || {
        allowDownload: false,
        watermarkTemplate: "{{outlet}} — {{email}}",
        disableTextSelection: true,
        showPageNav: true,
      },
      isPublished: doc.isPublished,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
      hasSharedPassword: Boolean(doc.sharedPasswordHash),
    }
  }
}
