import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { revalidatePath } from "next/cache"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"

const schema = z.object({
  brandName: z.string().min(1).optional(),
  logoNav: z.string().optional(),
  logoFooter: z.string().optional(),
  logoHero: z.string().optional(),
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(await BrandingSettingsService.get())
}

export async function PUT(request: Request) {
  await requireAdmin()
  const payload = schema.parse(await request.json())
  const updated = await BrandingSettingsService.update(payload)
  revalidatePath("/", "layout")
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.branding)
  return NextResponse.json(updated)
}
