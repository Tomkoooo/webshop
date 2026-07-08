import { NextRequest, NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import ShopFeedback from "@wse/core/models/ShopFeedback";
import Order from "@wse/core/models/Order";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Érvénytelen értékelés" }, { status: 400 });
    }

    await dbConnect();

    // Verify user has at least one processed order
    const hasProcessedOrder = await Order.exists({
      user: session.user.id,
      status: { $in: ["processing", "shipped", "delivered", "cancelled"] }
    });

    if (!hasProcessedOrder) {
      // Return 403 or specific error so frontend knows why
      return NextResponse.json({ error: "Csak feldolgozott rendelés után értékelheted a boltot." }, { status: 403 });
    }

    // UPSERT behaviour: If they already submitted feedback, we update it.
    await ShopFeedback.findOneAndUpdate(
      { user: session.user.id },
      { rating, comment, status: "pending" },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error submitting shop feedback:", error);
    return NextResponse.json({ error: "Szerver hiba történt" }, { status: 500 });
  }
}
