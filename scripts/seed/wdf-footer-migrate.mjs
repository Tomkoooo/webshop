#!/usr/bin/env node
/**
 * Seed / migrate World Darts Festival template-scoped footer (`footer:world-darts-festival`).
 *
 * Safe on WDF production DB: copies customized legacy `footer` when present,
 * otherwise writes festival defaults. Ignores shop/KockaKemp seed leftovers.
 *
 * Usage:
 *   MONGODB_URI="mongodb://..." node scripts/seed/wdf-footer-migrate.mjs
 */
import mongoose from "mongoose"

const TEMPLATE_ID = "world-darts-festival"
const SCOPED_KEY = `footer:${TEMPLATE_ID}`
const LEGACY_KEY = "footer"

const WDF_DEFAULTS = {
  tagline: "A nemzetközi darts fesztivál Budapesten — jegyek, program, díjazás.",
  quickLinksTitle: "Gyors linkek",
  quickLinks: [
    { label: "Jegyek & foglalás", href: "/jegyek" },
    { label: "Helyszín", href: "/#venue" },
    { label: "Program", href: "/#schedule" },
    { label: "Díjazás", href: "/#prize-money" },
    { label: "Kapcsolat", href: "/#contact" },
  ],
  categoriesTitle: "",
  browseProductsLabel: "",
  contactTitle: "Kapcsolat",
  newsletterLabel: "",
  newsletterPlaceholder: "",
  copyrightText: "© {year} {brand}. Minden jog fenntartva.",
  socialLinks: [
    { platform: "facebook", enabled: false, url: "" },
    { platform: "instagram", enabled: false, url: "" },
    { platform: "twitter", enabled: false, url: "" },
    { platform: "youtube", enabled: false, url: "" },
  ],
  contactEntries: [],
  organizerSection: {
    title: "",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours: "",
  },
  paymentMethodsNote: "",
}

const SHOP_HREFS = new Set(["#home", "#about", "#shop", "#reviews", "#contact"])

function isLegacyNoise(doc) {
  const organizer = doc.organizerSection?.title?.trim() ?? ""
  if (organizer.includes("KockaKemp") || organizer.includes("Eseményszervezés")) return true
  const payment = doc.paymentMethodsNote?.trim() ?? ""
  if (payment.includes("Stripe")) return true
  const links = doc.quickLinks ?? []
  if (links.length > 0 && links.every((item) => SHOP_HREFS.has(item.href))) return true
  if ((doc.tagline?.trim() ?? "") === "Minőségi termékek, gyors szállítás.") return true
  return false
}

function pickFooterFields(doc) {
  const out = { ...WDF_DEFAULTS }
  for (const key of Object.keys(WDF_DEFAULTS)) {
    if (doc[key] !== undefined && doc[key] !== null) {
      out[key] = doc[key]
    }
  }
  return out
}

const FooterSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    tagline: String,
    quickLinksTitle: String,
    quickLinks: [{ label: String, href: String }],
    categoriesTitle: String,
    browseProductsLabel: String,
    contactTitle: String,
    newsletterLabel: String,
    newsletterPlaceholder: String,
    copyrightText: String,
    socialLinks: [{ platform: String, enabled: Boolean, url: String }],
    contactEntries: [{ label: String, value: String, kind: String }],
    organizerSection: {
      title: String,
      companyName: String,
      registeredAddress: String,
      mailingAddress: String,
      openingHours: String,
    },
    paymentMethodsNote: String,
  },
  { timestamps: true, strict: false }
)

const FooterSetting =
  mongoose.models.FooterSetting ||
  mongoose.model("FooterSetting", FooterSettingSchema)

async function main() {
  const uri = process.env.SEED_DB_URL || process.env.DATABASE_URL || process.env.MONGODB_URI
  if (!uri) {
    console.error("SEED_DB_URL, DATABASE_URL, or MONGODB_URI required")
    process.exit(1)
  }

  await mongoose.connect(uri)

  const existing = await FooterSetting.findOne({ key: SCOPED_KEY }).lean()
  if (existing) {
    console.log(`Already seeded: ${SCOPED_KEY}`)
    await mongoose.disconnect()
    return
  }

  const legacy = await FooterSetting.findOne({ key: LEGACY_KEY }).lean()
  let doc = { ...WDF_DEFAULTS }
  if (legacy && !isLegacyNoise(legacy)) {
    doc = pickFooterFields(legacy)
    console.log(`Migrating customized legacy footer → ${SCOPED_KEY}`)
  } else {
    console.log(`Seeding WDF festival defaults → ${SCOPED_KEY}`)
  }

  await FooterSetting.findOneAndUpdate(
    { key: SCOPED_KEY },
    { $set: { key: SCOPED_KEY, ...doc } },
    { upsert: true }
  )

  console.log("Done.")
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
