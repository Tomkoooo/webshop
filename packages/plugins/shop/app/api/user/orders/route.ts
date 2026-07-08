import { NextRequest, NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import Product from "@wse/core/models/Product"; // needed to populate products
import ShippingMethod from "@wse/core/models/ShippingMethod";
import PaymentMethod from "@wse/core/models/PaymentMethod";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { prepareUserOrdersAccess } from "@wse/core/lib/user-orders-query";
import { timeDevResponseMetric } from "@wse/core/lib/dev-metrics";

export async function GET(req: NextRequest) {
  return timeDevResponseMetric("user.orders.GET", async () => {
    try {
      const blocked = shopCommerceBlockedResponse();
      if (blocked) return blocked;
      const session = await auth();
      const access = await prepareUserOrdersAccess(session);
      if (!access) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      await dbConnect();
      void Product;
      void ShippingMethod;
      void PaymentMethod;

      const orders = await Order.find(access.filter)
        .populate("items.product")
        .populate("shippingMethod")
        .populate("paymentMethod")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(orders);
    } catch (error: unknown) {
      console.error("Error fetching user orders:", error);
      return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
  }, { category: "api", route: "/api/user/orders", method: "GET", url: req.url });
}
