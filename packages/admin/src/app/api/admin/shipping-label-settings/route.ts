import { NextResponse } from "next/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { ShippingLabelSettingsService } from "@wse/core/services/shipping-label-settings"

const schema = z.object({
  companyName: z.string().optional(),
  companyStreet: z.string().optional(),
  companyZip: z.string().optional(),
  companyCity: z.string().optional(),
  companyCountry: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().optional(),
  taxNumber: z.string().optional(),
  footerNote: z.string().optional(),
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(await ShippingLabelSettingsService.get())
}

export async function PUT(request: Request) {
  await requireAdmin()
  const payload = schema.parse(await request.json())
  const updated = await ShippingLabelSettingsService.update(payload)
  revalidatePath("/admin/shipping")
  return NextResponse.json(updated)
}
