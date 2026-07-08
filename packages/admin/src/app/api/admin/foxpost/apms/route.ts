import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@wse/core/lib/admin-auth";
import {
  listFoxpostApms,
  resolveFoxpostApmCatalogMode,
  type FoxpostApmCatalogMode,
} from "@wse/core/lib/foxpost-apm-catalog";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = req.nextUrl.searchParams;
    const forceRefresh = searchParams.get("refresh") === "1";
    const modeParam = searchParams.get("mode");
    const mode: FoxpostApmCatalogMode =
      modeParam === "sandbox" || modeParam === "production"
        ? modeParam
        : await resolveFoxpostApmCatalogMode();

    const snapshot = await listFoxpostApms({ mode, forceRefresh });
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Foxpost automata lista hiba" },
      { status: 500 }
    );
  }
}
