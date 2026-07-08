import { NextResponse } from "next/server";
import { FeatureFlagService } from "@wse/core/services/feature-flags";

export async function GET() {
  try {
    const enabled = await FeatureFlagService.isEnabled("newsletter", false);
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("Newsletter feature flag GET error:", error);
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
