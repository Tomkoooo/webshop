import { NextRequest, NextResponse } from "next/server";
import { findFoxpostApmById, resolveFoxpostApmCatalogMode } from "@wse/core/lib/foxpost-apm-catalog";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Hiányzó automata azonosító." }, { status: 400 });
    }

    const forceRefresh = searchParams.get("refresh") !== "0";
    const modeParam = searchParams.get("mode");
    const mode =
      modeParam === "sandbox" || modeParam === "production"
        ? modeParam
        : await resolveFoxpostApmCatalogMode();

    const point = await findFoxpostApmById(id, { mode, forceRefresh });
    if (!point) {
      return NextResponse.json(
        {
          error:
            "Ez a Foxpost automata jelenleg nem választható (bezárt vagy már nem szerepel a friss listában).",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { point },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Foxpost automata ellenőrzés sikertelen." },
      { status: 500 }
    );
  }
}
