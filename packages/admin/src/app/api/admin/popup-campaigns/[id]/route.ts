import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { popupCampaignInputSchema } from "@wse/core/lib/popup-campaign-schema"
import { PopupCampaignService } from "@wse/core/services/popup-campaign"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin()
    const { id } = await context.params
    const campaign = await PopupCampaignService.getById(id)
    if (!campaign) {
      return NextResponse.json({ error: "Nem található" }, { status: 404 })
    }
    return NextResponse.json(campaign)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unauthorized"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin()
    const { id } = await context.params
    const body = await request.json()
    const parsed = popupCampaignInputSchema.parse(body)
    const updated = await PopupCampaignService.update(id, parsed)
    if (!updated) {
      return NextResponse.json({ error: "Nem található" }, { status: 404 })
    }
    revalidatePath("/")
    return NextResponse.json(updated)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Hiba"
    const status = message === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message, message }, { status })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin()
    const { id } = await context.params
    const ok = await PopupCampaignService.delete(id)
    if (!ok) {
      return NextResponse.json({ error: "Nem található" }, { status: 404 })
    }
    revalidatePath("/")
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unauthorized"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
