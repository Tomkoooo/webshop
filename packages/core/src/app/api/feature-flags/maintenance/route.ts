import { NextResponse } from "next/server";
import { getCachedFeatureFlag } from "@wse/core/lib/cached-storefront";
import { setCachedMaintenanceEnabled } from "@wse/core/lib/maintenance-flag-cache";

export async function GET() {
  try {
    const enabled = await getCachedFeatureFlag("maintenanceMode", false);
    setCachedMaintenanceEnabled(enabled);
    return NextResponse.json(
      { enabled },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Maintenance feature flag GET error:", error);
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
