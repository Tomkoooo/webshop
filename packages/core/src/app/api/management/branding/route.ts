import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireManagementAuth } from "@wse/core/lib/management-auth"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"

export const dynamic = "force-dynamic"

const schema = z.object({
  brandName: z.string().min(1).optional(),
  logoNav: z.string().optional(),
  logoFooter: z.string().optional(),
  logoHero: z.string().optional(),
})

export async function GET(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  return NextResponse.json(await BrandingSettingsService.get())
}

export async function PUT(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const payload = schema.parse(await request.json())
  const updated = await BrandingSettingsService.update(payload)
  revalidatePath("/", "layout")
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.branding)
  return NextResponse.json(updated)
}
