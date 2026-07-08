import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@wse/core/lib/db";
import { sweepExpiredPendingReservations } from "@wse/core/services/inventory-reservation";

export const runtime = "nodejs";

/**
 * Release expired pending reservations (Mongo-only safety net).
 * Protect with CRON_SECRET: `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const released = await sweepExpiredPendingReservations(new Date());
  return NextResponse.json({ ok: true, released });
}
