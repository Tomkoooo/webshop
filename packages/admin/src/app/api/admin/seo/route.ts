import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { SeoSettingsService } from "@wse/core/services/seo-settings"
import { revalidatePath } from "next/cache"
import { revalidateStorefrontSitemap } from "@wse/core/lib/sitemap/revalidate-storefront-sitemap"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"

const schema = z.object({
  siteTitle: z.string().optional(),
  siteDescription: z.string().optional(),
  favicon: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  defaultLocale: z.string().optional(),
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  canonicalBaseUrl: z.string().optional(),
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(await SeoSettingsService.get())
}

export async function PUT(request: Request) {
  await requireAdmin()
  const payload = schema.parse(await request.json())
  const updated = await SeoSettingsService.update(payload)
  revalidatePath("/", "layout")
  revalidateStorefrontSitemap()
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.seo)
  return NextResponse.json(updated)
}
