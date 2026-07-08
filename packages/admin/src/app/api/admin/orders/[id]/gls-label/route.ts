import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import { requireAdmin } from "@wse/core/lib/admin-auth";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;
    await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const order = await Order.findById(id).lean();
    if (!order?.glsLabel?.labelDataBase64) {
      return NextResponse.json({ error: "GLS címke nem található." }, { status: 404 });
    }

    const pdfBuffer = Buffer.from(order.glsLabel.labelDataBase64, "base64");
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="gls-label-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
