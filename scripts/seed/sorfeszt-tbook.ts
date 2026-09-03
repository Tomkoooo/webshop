#!/usr/bin/env npx tsx
/**
 * Bootstrap Sörfeszt tickets on the local tBook host (tbook-admin DB)
 * and wire the group API key into the sorfeszt homepage CMS.
 *
 *   npx tsx scripts/seed/sorfeszt-tbook.ts
 *
 * Does not use SEED_DB_URL (that points at an unrelated customer cluster).
 * Sources:
 *   TBOOK_ADMIN_DB_URL  or DATABASE_URL with db name swapped to tbook-admin
 *   SORFESZT_DB_URL     or DATABASE_URL with db name swapped to sorfeszt
 */
import "dotenv/config"
import { config } from "dotenv"
import path from "node:path"
import { fileURLToPath } from "node:url"
import mongoose from "mongoose"
import User from "@wse/core/models/User"
import FeatureFlag from "@wse/core/models/FeatureFlag"
import TemplateContent from "@wse/core/models/TemplateContent"
import TBookOrganization from "@wse/plugin-t-book/models/TBookOrganization"
import TBookOrgRole from "@wse/plugin-t-book/models/TBookOrgRole"
import TBookOrgMembership from "@wse/plugin-t-book/models/TBookOrgMembership"
import TBookEventGroup from "@wse/plugin-t-book/models/TBookEventGroup"
import TBookEvent from "@wse/plugin-t-book/models/TBookEvent"
import { generateApiKey, hashApiKey, apiKeyHint } from "@wse/plugin-t-book/lib/api-key"
import { encryptOrgSecret } from "@wse/plugin-t-book/lib/org-secrets"
import {
  TBOOK_OWNER_PERMISSIONS,
  TBOOK_VIEWER_PERMISSIONS,
} from "@wse/plugin-t-book/lib/permissions"
import { homeDefaultContent } from "@wse/template-sorfeszt/pages/home/defaultContent"
import { homeSchema } from "@wse/template-sorfeszt/pages/home/schema"
import { backupCollectionsBeforeSeed } from "./lib/safe-seed-backup"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
config({ path: path.join(root, ".env") })

const OWNER_EMAIL = "tothtamasb0108@gmail.com"
const ORG_NAME = "esemenyszervezes"
const GROUP_NAME = "Sörfeszt 2026"
const TEMPLATE_ID = "sorfeszt"
const PAGE_KEY = "page:home"

function swapDbName(uri: string, dbName: string): string {
  const parsed = new URL(uri)
  parsed.pathname = `/${dbName}`
  return parsed.toString()
}

function redact(uri: string): string {
  return uri.includes("@") ? uri.replace(/\/\/[^@]+@/, "//***@") : uri
}

function htmlList(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`
}

async function enablePluginTBook() {
  await FeatureFlag.findOneAndUpdate(
    { key: "pluginTBook" },
    {
      $set: {
        label: "tBook plugin",
        description: "Esemény foglalás, Stripe fizetés, szamlazz.hu számlázás.",
        enabled: true,
      },
      $setOnInsert: { key: "pluginTBook" },
    },
    { upsert: true }
  )
}

async function ensureOwnerUser() {
  const email = OWNER_EMAIL.toLowerCase()
  const existing = await User.findOne({ email })
  if (existing) {
    if (existing.isSystemAdmin !== true) {
      existing.isSystemAdmin = true
      await existing.save()
    }
    return existing
  }
  return User.create({
    email,
    name: "Tóth Tamás",
    role: "USER",
    isSystemAdmin: true,
    newsletterSubscribed: false,
  })
}

async function ensureOrg(ownerUserId: mongoose.Types.ObjectId) {
  let org = await TBookOrganization.findOne({
    $or: [{ slug: ORG_NAME }, { name: ORG_NAME }],
  })
  if (!org) {
    org = await TBookOrganization.create({
      name: ORG_NAME,
      slug: ORG_NAME,
      status: "active",
      settings: { currency: "HUF" },
      createdBy: ownerUserId,
    })
    console.log(`Created organization ${ORG_NAME} (${String(org._id)})`)
  } else {
    console.log(`Reusing organization ${org.name} (${String(org._id)})`)
  }

  let ownerRole = await TBookOrgRole.findOne({ organizationId: org._id, name: "Owner" })
  if (!ownerRole) {
    ownerRole = await TBookOrgRole.create({
      organizationId: org._id,
      name: "Owner",
      description: "Teljes hozzáférés a szervezethez.",
      permissions: TBOOK_OWNER_PERMISSIONS,
      isBuiltIn: true,
    })
  }
  const viewer = await TBookOrgRole.findOne({ organizationId: org._id, name: "Viewer" })
  if (!viewer) {
    await TBookOrgRole.create({
      organizationId: org._id,
      name: "Viewer",
      description: "Csak olvasási jogosultságok.",
      permissions: TBOOK_VIEWER_PERMISSIONS,
      isBuiltIn: true,
    })
  }

  const membership = await TBookOrgMembership.findOne({
    organizationId: org._id,
    userId: ownerUserId,
  })
  if (membership) {
    await TBookOrgMembership.updateOne(
      { _id: membership._id },
      { $set: { roleIds: [ownerRole._id], status: "active" } }
    )
  } else {
    await TBookOrgMembership.create({
      organizationId: org._id,
      userId: ownerUserId,
      roleIds: [ownerRole._id],
      status: "active",
    })
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim()
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (stripeSecret) {
    await TBookOrganization.updateOne(
      { _id: org._id },
      {
        $set: {
          "settings.stripe.enabled": true,
          "settings.stripe.secretKeyEnc": encryptOrgSecret(stripeSecret),
          ...(stripeWebhook
            ? { "settings.stripe.webhookSecretEnc": encryptOrgSecret(stripeWebhook) }
            : {}),
        },
      }
    )
  }

  return org
}

async function ensureGroup(organizationId: mongoose.Types.ObjectId): Promise<{
  groupId: mongoose.Types.ObjectId
  apiKey: string
}> {
  let group = await TBookEventGroup.findOne({ organizationId, name: GROUP_NAME })
  const apiKey = generateApiKey()
  const keyFields = {
    apiKeyHash: hashApiKey(apiKey),
    apiKeyHint: apiKeyHint(apiKey),
    apiKeyCreatedAt: new Date(),
  }
  if (!group) {
    group = await TBookEventGroup.create({
      organizationId,
      name: GROUP_NAME,
      description:
        "<p>Sörfeszt 2026 — október 2–4. Napijegy, VIP és asztal. Minden jegytípus külön esemény naponta.</p>",
      status: "active",
      defaultPriceBasis: "gross",
      defaultVatPercent: 27,
      defaultAttendeeFieldSchema: [
        { key: "full_name", label: "Név", type: "text", required: true, sortOrder: 0 },
        { key: "email", label: "E-mail", type: "email", required: true, sortOrder: 1 },
      ],
      listOnTBookSite: false,
      ...keyFields,
    })
    console.log(`Created group ${GROUP_NAME} (${String(group._id)})`)
  } else {
    await TBookEventGroup.updateOne(
      { _id: group._id },
      {
        $set: {
          status: "active",
          description:
            "<p>Sörfeszt 2026 — október 2–4. Napijegy, VIP és asztal. Minden jegytípus külön esemény naponta.</p>",
          defaultPriceBasis: "gross",
          defaultAttendeeFieldSchema: [
            { key: "full_name", label: "Név", type: "text", required: true, sortOrder: 0 },
            { key: "email", label: "E-mail", type: "email", required: true, sortOrder: 1 },
          ],
          ...keyFields,
        },
      }
    )
    console.log(`Rotated API key for existing group ${GROUP_NAME} (${String(group._id)})`)
  }
  return { groupId: group._id as mongoose.Types.ObjectId, apiKey }
}

type TicketSpec = {
  kindLabel: string
  namePrefix: string
  fee: number
  includes: string[]
  ticketFeeMode: "per_person" | "per_booking"
  playersPerTicket: number
  salesOpensAt: Date
  sortBase: number
}

const DAYS = [
  { label: "Péntek", date: "2026-10-02", startTime: "16:00", endTime: "23:00" },
  { label: "Szombat", date: "2026-10-03", startTime: "13:00", endTime: "23:00" },
  { label: "Vasárnap", date: "2026-10-04", startTime: "13:00", endTime: "23:00" },
] as const

const TICKETS: TicketSpec[] = [
  {
    kindLabel: "standard-early",
    namePrefix: "Napijegy earlybird",
    fee: 5990,
    includes: ["Belépés", "3 db kóstolójegy"],
    ticketFeeMode: "per_person",
    playersPerTicket: 1,
    salesOpensAt: new Date("2026-08-01T08:00:00+02:00"),
    sortBase: 10,
  },
  {
    kindLabel: "standard-normal",
    namePrefix: "Napijegy normál",
    fee: 7990,
    includes: ["Belépés", "3 db kóstolójegy"],
    ticketFeeMode: "per_person",
    playersPerTicket: 1,
    salesOpensAt: new Date("2026-09-20T10:00:00+02:00"),
    sortBase: 20,
  },
  {
    kindLabel: "vip-early",
    namePrefix: "VIP Napijegy earlybird",
    fee: 9990,
    includes: ["Belépés", "7 db kóstolójegy", "Külön rész hideg kísérőételekkel"],
    ticketFeeMode: "per_person",
    playersPerTicket: 1,
    salesOpensAt: new Date("2026-08-01T08:00:00+02:00"),
    sortBase: 30,
  },
  {
    kindLabel: "vip-normal",
    namePrefix: "VIP Napijegy normál",
    fee: 14990,
    includes: ["Belépés", "7 db kóstolójegy", "Külön rész hideg kísérőételekkel"],
    ticketFeeMode: "per_person",
    playersPerTicket: 1,
    salesOpensAt: new Date("2026-09-20T10:00:00+02:00"),
    sortBase: 40,
  },
  {
    kindLabel: "table",
    namePrefix: "Asztal 6 fő",
    fee: 35990,
    includes: ["Belépés 6 fő részére", "20 db kóstolójegy", "Külön rész hideg kísérőételekkel"],
    ticketFeeMode: "per_booking",
    playersPerTicket: 1,
    salesOpensAt: new Date("2026-08-01T08:00:00+02:00"),
    sortBase: 50,
  },
]

async function ensureEvents(
  organizationId: mongoose.Types.ObjectId,
  groupId: mongoose.Types.ObjectId
) {
  let created = 0
  let updated = 0
  for (const [dayIndex, day] of DAYS.entries()) {
    for (const ticket of TICKETS) {
      const name = `${ticket.namePrefix} — ${day.label}`
      const payload = {
        organizationId,
        groupId,
        name,
        description: htmlList(ticket.includes),
        location: { address: "", lat: null, lng: null, mapEmbedUrl: "" },
        startDate: new Date(`${day.date}T00:00:00+02:00`),
        endDate: new Date(`${day.date}T00:00:00+02:00`),
        startTime: day.startTime,
        endTime: day.endTime,
        salesOpensAt: ticket.salesOpensAt,
        salesClosesAt: null,
        currency: "HUF",
        ticketFeeHuf: ticket.fee,
        ticketFeeMode: ticket.ticketFeeMode,
        registrationUnit: "person" as const,
        playersPerTicket: ticket.playersPerTicket,
        ticketPriceBasis: "gross" as const,
        ticketVatPercent: 27,
        publicListing: "listed" as const,
        status: "active" as const,
        sortOrder: ticket.sortBase + dayIndex,
        attendeeFieldSchemaMode: "extend" as const,
        eligibilityPreset: "none" as const,
      }
      const existing = await TBookEvent.findOne({ groupId, name })
      if (existing) {
        await TBookEvent.updateOne({ _id: existing._id }, { $set: payload })
        updated += 1
      } else {
        await TBookEvent.create(payload)
        created += 1
      }
    }
  }
  console.log(`Events: ${created} created, ${updated} updated (${DAYS.length * TICKETS.length} total SKUs)`)
}

async function wireSorfesztHomepage(apiKey: string, sorfesztUri: string) {
  await mongoose.disconnect()
  await mongoose.connect(sorfesztUri)
  console.log(`Connected to CMS db ${redact(sorfesztUri)} (${mongoose.connection.name})`)
  if (mongoose.connection.name !== "sorfeszt") {
    throw new Error(`Refusing to write CMS: expected db "sorfeszt", got "${mongoose.connection.name}"`)
  }

  await backupCollectionsBeforeSeed("sorfeszt-tbook-cms", ["templatecontents"], {
    templateId: TEMPLATE_ID,
    pageKey: PAGE_KEY,
  })
  await backupCollectionsBeforeSeed("sorfeszt-tbook-cms-flags", ["featureflags"])
  await enablePluginTBook()

  const doc = await TemplateContent.findOne({ templateId: TEMPLATE_ID, pageKey: PAGE_KEY })
  let next = homeDefaultContent
  if (doc?.value?.trim()) {
    try {
      next = homeSchema.parse(JSON.parse(doc.value))
    } catch {
      console.warn("Published homepage JSON failed schema parse — merging API key onto defaults.")
      next = homeDefaultContent
    }
  } else {
    console.log("No published homepage yet — writing defaults plus tBook API key.")
  }

  next = {
    ...next,
    chrome: { ...next.chrome, tbookApiKey: apiKey },
    ribbons: {
      beforeTickets: next.ribbons?.beforeTickets || homeDefaultContent.ribbons.beforeTickets,
      afterBeers: next.ribbons?.afterBeers || homeDefaultContent.ribbons.afterBeers,
    },
  }
  const validated = homeSchema.parse(next)
  await TemplateContent.findOneAndUpdate(
    { templateId: TEMPLATE_ID, pageKey: PAGE_KEY },
    {
      $set: {
        value: JSON.stringify(validated),
        publishedAt: new Date(),
        publishedBy: "sorfeszt-tbook-seed",
      },
      $unset: { draftValue: 1 },
    },
    { upsert: true }
  )
  console.log(`Patched ${TEMPLATE_ID}/${PAGE_KEY} chrome.tbookApiKey (${apiKeyHint(apiKey)})`)
}

async function main() {
  const baseUri = process.env.TBOOK_ADMIN_DB_URL || process.env.DATABASE_URL
  if (!baseUri) {
    throw new Error("TBOOK_ADMIN_DB_URL or DATABASE_URL required")
  }
  const tbookUri = process.env.TBOOK_ADMIN_DB_URL || swapDbName(baseUri, "tbook-admin")
  const sorfesztUri = process.env.SORFESZT_DB_URL || swapDbName(baseUri, "sorfeszt")

  console.log(`Connecting to tBook host db ${redact(tbookUri)}`)
  await mongoose.connect(tbookUri)
  console.log(`Database: ${mongoose.connection.name}`)
  if (mongoose.connection.name !== "tbook-admin") {
    throw new Error(`Refusing to seed: expected db "tbook-admin", got "${mongoose.connection.name}"`)
  }

  await backupCollectionsBeforeSeed(
    "sorfeszt-tbook-admin",
    ["users", "featureflags", "tbookorganizations", "tbookeventgroups", "tbookevents", "tbookorgmemberships", "tbookorgroles"]
  )

  await enablePluginTBook()
  const owner = await ensureOwnerUser()
  const org = await ensureOrg(owner._id as mongoose.Types.ObjectId)
  const { groupId, apiKey } = await ensureGroup(org._id as mongoose.Types.ObjectId)
  await ensureEvents(org._id as mongoose.Types.ObjectId, groupId)

  console.log(`Owner: ${OWNER_EMAIL} (${String(owner._id)})`)
  console.log(`API key hint: ${apiKeyHint(apiKey)}`)

  await wireSorfesztHomepage(apiKey, sorfesztUri)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
