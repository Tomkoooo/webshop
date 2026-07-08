import { NextResponse } from "next/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { FooterSettingsService } from "@wse/core/services/footer-settings"

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
  organizerSection: z
    .object({
      title: z.string(),
      companyName: z.string(),
      registeredAddress: z.string(),
      mailingAddress: z.string(),
      openingHours: z.string(),
    })
    .optional(),
  paymentMethodsNote: z.string().optional(),
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(await FooterSettingsService.get())
}

export async function PUT(request: Request) {
  await requireAdmin()
  const payload = schema.parse(await request.json())
  const updated = await FooterSettingsService.update(payload)
  revalidatePath("/")
  revalidatePath("/products/[slug]", "page")
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.footer)
  return NextResponse.json(updated)
}
