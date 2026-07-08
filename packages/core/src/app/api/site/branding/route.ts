import { NextResponse } from "next/server"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"

export async function GET() {
  const branding = await BrandingSettingsService.get()
  return NextResponse.json(branding)
}
