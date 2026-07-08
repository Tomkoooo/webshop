import { NextResponse } from "next/server";
import { isShopEnabled } from "@wse/core/lib/features/shop";
import { FeatureFlagService } from "@wse/core/services/feature-flags";

export async function GET() {
  if (!isShopEnabled()) {
    return NextResponse.json({ enabled: false });
  }
  const shopPageOn = await FeatureFlagService.isEnabled("shopPage", true);
  return NextResponse.json({ enabled: shopPageOn });
}
