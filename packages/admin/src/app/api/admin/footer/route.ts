import { NextResponse } from "next/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { FooterSettingsService } from "@wse/core/services/footer-settings"
import { TemplateService } from "@wse/core/services/template"

const contactEntrySchema = z.object({
  label: z.string(),
  value: z.string(),
  kind: z.enum(["text", "link", "mailto", "tel"]),
})

const schema = z.object({
  tagline: z.string().optional(),
  quickLinksTitle: z.string().optional(),
  quickLinks: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
  categoriesTitle: z.string().optional(),
  browseProductsLabel: z.string().optional(),
  contactTitle: z.string().optional(),
  newsletterLabel: z.string().optional(),
  newsletterPlaceholder: z.string().optional(),
  copyrightText: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(["facebook", "instagram", "twitter", "youtube"]),
        enabled: z.boolean(),
        url: z.string(),
      })
    )
    .optional(),
  contactEntries: z.array(contactEntrySchema).optional(),
  organizerSection: z
    .object({
      title: z.string(),
      companyName: z.string(),
      registeredAddress: z.string(),
      mailingAddress: z.string(),
      openingHours: z.string(),
      taxNumber: z.string().optional(),
    })
    .optional(),
  paymentMethodsNote: z.string().optional(),
})

export async function GET() {
  await requireAdmin()
  const template = await TemplateService.getDbActive()
  return NextResponse.json(await FooterSettingsService.getForTemplate(template))
}

export async function PUT(request: Request) {
  await requireAdmin()
  const template = await TemplateService.getDbActive()
  const payload = schema.parse(await request.json())
  const updated = await FooterSettingsService.updateForTemplate(template, payload)
  revalidatePath("/")
  revalidatePath("/products/[slug]", "page")
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.footer)
  return NextResponse.json(updated)
}
