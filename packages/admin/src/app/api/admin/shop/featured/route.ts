import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { ShopFeaturedSettingsService } from "@wse/core/services/shop-featured-settings"
import { z } from "zod"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  mode: z.enum(["auto", "manual", "byCategory"]).optional(),
  manualProductIds: z.array(z.string()).optional(),
  orderedCategoryIds: z.array(z.string()).optional(),
  maxItems: z.number().int().min(1).max(48).optional(),
  perCategoryLimit: z.number().int().min(0).max(48).optional(),
})

export async function GET() {
  await requireAdmin()
  const s = await ShopFeaturedSettingsService.get()
  return NextResponse.json(s)
}

export async function PUT(req: NextRequest) {
  await requireAdmin()
  const json = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Érvénytelen adat" }, { status: 400 })
  }
  const next = await ShopFeaturedSettingsService.update(parsed.data)
  return NextResponse.json(next)
}
