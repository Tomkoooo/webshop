import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { popupCampaignInputSchema } from "@wse/core/lib/popup-campaign-schema"
import { PopupCampaignService } from "@wse/core/services/popup-campaign"

export async function GET() {
  try {
    await requireAdmin()
    const campaigns = await PopupCampaignService.list()
    return NextResponse.json(campaigns)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unauthorized"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json().catch(() => ({}))
    const parsed = popupCampaignInputSchema.partial().safeParse(body)
    const created = await PopupCampaignService.create(parsed.success ? parsed.data : undefined)
    revalidatePath("/")
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Hiba"
    const status = message === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message, message }, { status })
  }
}
