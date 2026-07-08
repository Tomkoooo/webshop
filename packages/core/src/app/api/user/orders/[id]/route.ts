import { NextRequest, NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import Product from "@wse/core/models/Product";
import ShippingMethod from "@wse/core/models/ShippingMethod";
import PaymentMethod from "@wse/core/models/PaymentMethod";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { prepareUserOrdersAccess } from "@wse/core/lib/user-orders-query";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;
    const session = await auth();
    const access = await prepareUserOrdersAccess(session);
    if (!access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    void Product;
    void ShippingMethod;
    void PaymentMethod;

    const order = await Order.findOne({
      _id: id,
      ...access.filter,
    })
      .populate("items.product")
      .populate("shippingMethod")
      .populate("paymentMethod")
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Rendelés nem található" }, { status: 404 });
    }

    const safeOrder = {
      ...(order as any),
      invoiceDownloadUrl: `/api/user/orders/${id}/invoice`,
    };

    return NextResponse.json(safeOrder);
  } catch (error: any) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
