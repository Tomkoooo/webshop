import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireManagementAuth } from "@wse/core/lib/management-auth"
import { SeoSettingsService } from "@wse/core/services/seo-settings"
import { revalidateStorefrontSitemap } from "@wse/core/lib/sitemap/revalidate-storefront-sitemap"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"

export const dynamic = "force-dynamic"

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

export async function GET(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  return NextResponse.json(await SeoSettingsService.get())
}

export async function PUT(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const payload = schema.parse(await request.json())
  const updated = await SeoSettingsService.update(payload)
  revalidatePath("/", "layout")
  revalidateStorefrontSitemap()
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.seo)
  return NextResponse.json(updated)
}
