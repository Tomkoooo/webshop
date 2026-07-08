import { NextResponse } from "next/server"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { HomepageCmsService } from "@wse/core/services/homepage-cms"
import { homepageSnapshotSchema } from "@wse/core/features/homepage-cms/types/homepage-schema"

export async function GET() {
  await requireAdmin()
  const draft = await HomepageCmsService.getDraft()
  return NextResponse.json(draft)
}

export async function PUT(request: Request) {
  await requireAdmin()
  const payload = homepageSnapshotSchema.parse(await request.json())
  const saved = await HomepageCmsService.saveDraft(payload)
  return NextResponse.json(saved)
}
