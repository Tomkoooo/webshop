import { NextResponse } from "next/server"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { productSuggestionSettingsSchema } from "@wse/core/lib/product-suggestion-settings-schema"
import { ProductSuggestionSettingsService } from "@wse/core/services/product-suggestion-settings"
import { revalidatePath } from "next/cache"

export async function GET() {
  await requireAdmin()
  return NextResponse.json(await ProductSuggestionSettingsService.get())
}

export async function PUT(request: Request) {
  await requireAdmin()
  const body = await request.json()
  const parsed = productSuggestionSettingsSchema.parse(body)
  const updated = await ProductSuggestionSettingsService.update(parsed)
  revalidatePath("/cart")
  revalidatePath("/checkout")
  return NextResponse.json(updated)
}
