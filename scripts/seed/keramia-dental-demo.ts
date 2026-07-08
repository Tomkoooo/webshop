#!/usr/bin/env npx tsx
/**
 * Seed keramia-dental deployment — both campaign templates (home CMS + branding + contact).
 *
 * Usage:
 *   npm run seed:keramia-dental
 *
 * Uses SEED_DB_URL when set, otherwise DATABASE_URL.
 */
import "dotenv/config"
import mongoose from "mongoose"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { fogfeheritesDefault } from "@wse/template-keramia-shared/static-pages/shared/defaults/fogfeherites"
import { implantDefault } from "@wse/template-keramia-shared/static-pages/shared/defaults/implant"
import type { CampaignPageContent } from "@wse/template-keramia-shared/static-pages/shared/schema"
import { seedKeramiaDentalMedia } from "./lib/keramia-media.mjs"

type KeramiaCampaignMedia = {
  hero: string
  before: string
  after: string
}

type KeramiaSeedMedia = {
  fogfeherites: KeramiaCampaignMedia
  implant: KeramiaCampaignMedia
  logo: string
}

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")

const uri = process.env.SEED_DB_URL || process.env.DATABASE_URL
if (!uri) {
  console.error("SEED_DB_URL or DATABASE_URL required")
  process.exit(1)
}

const BRAND_NAME = "Kerámia Dental"
const CONTACT_EMAIL = "fogaszat@keramiadental.hu"
const CONTACT_PHONE = "+36 20 244 8888"
const CONTACT_ADDRESS = "Székesfehérvár, Szekfű Gy. u. 12."

const TemplateContentSchema = new mongoose.Schema(
  {
    templateId: String,
    pageKey: String,
    value: String,
    draftValue: String,
    publishedAt: Date,
    publishedBy: String,
  },
  { timestamps: true }
)

const BrandingSettingSchema = new mongoose.Schema(
  { key: String, brandName: String, logoNav: String, logoFooter: String, logoHero: String },
  { timestamps: true }
)

const SeoSettingSchema = new mongoose.Schema(
  {
    key: String,
    siteTitle: String,
    siteDescription: String,
    favicon: String,
    ogImage: String,
    twitterImage: String,
    defaultLocale: String,
    robotsIndex: Boolean,
    robotsFollow: Boolean,
  },
  { timestamps: true }
)

const ShopContentSchema = new mongoose.Schema(
  { key: String, value: String, section: String },
  { timestamps: true }
)

function withMedia(
  base: CampaignPageContent,
  urls: { hero: string; before: string; after: string }
): CampaignPageContent {
  return {
    ...base,
    hero: { ...base.hero, image: urls.hero },
    beforeAfter: {
      ...base.beforeAfter,
      beforeImage: urls.before,
      afterImage: urls.after,
    },
  }
}

async function upsertTemplateContent(
  TemplateContent: mongoose.Model<unknown>,
  templateId: string,
  content: CampaignPageContent
) {
  const json = JSON.stringify(content)
  const now = new Date()
  await TemplateContent.findOneAndUpdate(
    { templateId, pageKey: "page:home" },
    {
      templateId,
      pageKey: "page:home",
      value: json,
      draftValue: json,
      publishedAt: now,
      publishedBy: "seed:keramia-dental",
    },
    { upsert: true }
  )
}

async function main() {
  const dbLabel = uri!.includes("@") ? uri!.replace(/\/\/[^@]+@/, "//***@") : uri
  console.log(`Connecting to ${dbLabel} …`)
  await mongoose.connect(uri!)

  const TemplateContent =
    mongoose.models.TemplateContent || mongoose.model("TemplateContent", TemplateContentSchema)
  const BrandingSetting =
    mongoose.models.BrandingSetting || mongoose.model("BrandingSetting", BrandingSettingSchema)
  const SeoSetting = mongoose.models.SeoSetting || mongoose.model("SeoSetting", SeoSettingSchema)
  const ShopContent =
    mongoose.models.ShopContent || mongoose.model("ShopContent", ShopContentSchema)

  const media = (await seedKeramiaDentalMedia(root)) as KeramiaSeedMedia

  const fogContent = withMedia(fogfeheritesDefault, media.fogfeherites)
  const implantContent = withMedia(implantDefault, media.implant)

  await upsertTemplateContent(TemplateContent, "keramia-fogfeherites", fogContent)
  console.log("  TemplateContent: keramia-fogfeherites / page:home")

  await upsertTemplateContent(TemplateContent, "keramia-implant", implantContent)
  console.log("  TemplateContent: keramia-implant / page:home")

  await BrandingSetting.findOneAndUpdate(
    { key: "branding" },
    {
      key: "branding",
      brandName: BRAND_NAME,
      logoNav: media.logo,
      logoFooter: media.logo,
      logoHero: media.fogfeherites.hero,
    },
    { upsert: true }
  )
  console.log("  BrandingSetting: branding")

  await SeoSetting.findOneAndUpdate(
    { key: "seo" },
    {
      key: "seo",
      siteTitle: fogContent.meta.seoTitle,
      siteDescription: fogContent.meta.seoDescription,
      favicon: media.logo,
      ogImage: media.fogfeherites.hero,
      twitterImage: media.fogfeherites.hero,
      defaultLocale: "hu_HU",
      robotsIndex: true,
      robotsFollow: true,
    },
    { upsert: true }
  )
  console.log("  SeoSetting: seo (fogfehérítés baseline)")

  const contactEmailsJson = JSON.stringify([
    { id: "fogaszat", label: "Fogászat", email: CONTACT_EMAIL },
  ])
  await ShopContent.findOneAndUpdate(
    { key: "contact_emails" },
    { key: "contact_emails", value: contactEmailsJson, section: "contact" },
    { upsert: true }
  )
  await ShopContent.findOneAndUpdate(
    { key: "contact_email" },
    { key: "contact_email", value: CONTACT_EMAIL, section: "contact" },
    { upsert: true }
  )
  await ShopContent.findOneAndUpdate(
    { key: "contact_phone" },
    { key: "contact_phone", value: CONTACT_PHONE, section: "contact" },
    { upsert: true }
  )
  await ShopContent.findOneAndUpdate(
    { key: "contact_address" },
    { key: "contact_address", value: CONTACT_ADDRESS, section: "contact" },
    { upsert: true }
  )
  console.log("  ShopContent: contact email / phone / address")

  console.log("\nKerámia dental seed complete.")
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
