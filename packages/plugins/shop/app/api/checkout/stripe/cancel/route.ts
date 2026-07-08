import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import TempOrder from "@wse/core/models/TempOrder";
import { releaseReservationsForTempOrder } from "@wse/core/services/inventory-reservation";

export const runtime = "nodejs";

/** Release inventory when the shopper abandons Stripe checkout (best-effort). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tempOrderId = typeof body?.tempOrderId === "string" ? body.tempOrderId : "";
    if (!mongoose.Types.ObjectId.isValid(tempOrderId)) {
      return NextResponse.json({ error: "Invalid temp order id" }, { status: 400 });
    }

    await dbConnect();

    const updated = await TempOrder.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(tempOrderId),
        status: { $in: ["created", "checkout_started"] },
      },
      { $set: { status: "failed", lastError: "Checkout cancelled" } },
      { returnDocument: "after" }
    ).lean();

    if (!updated) {
      return NextResponse.json({ ok: true, released: 0 });
    }

    const n = await releaseReservationsForTempOrder(tempOrderId, { states: ["pending"] });
    return NextResponse.json({ ok: true, released: n });
  } catch (error: any) {
    console.error("Stripe cancel POST error:", error);
    return NextResponse.json({ error: error?.message || "Cancel failed" }, { status: 400 });
  }
}
