import { NextResponse } from "next/server"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { HomepageCmsService } from "@wse/core/services/homepage-cms"

export async function POST() {
  await requireAdmin()
  const published = await HomepageCmsService.publishDraft()
  return NextResponse.json({ published })
}
