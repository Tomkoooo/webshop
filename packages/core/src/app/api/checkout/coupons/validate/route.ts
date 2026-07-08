import { NextRequest, NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { validateAndApplyCoupon } from "@wse/core/lib/coupon-validation";

export async function POST(req: NextRequest) {
  const blocked = shopCommerceBlockedResponse();
  if (blocked) return blocked;
  const session = await auth();

  try {
    await dbConnect();
    const { code, cartValue, items, email } = await req.json();

    const cartLines = Array.isArray(items)
      ? items.map((item: {
          productId?: string;
          product?: string;
          id?: string;
          variantId?: string;
          quantity?: number;
          price?: number;
          vatPercent?: number;
        }) => {
          const rawId = item.productId || item.product || item.id || "";
          const [productId, variantFromId] = String(rawId).includes(":")
            ? String(rawId).split(":", 2)
            : [String(rawId), undefined];
          return {
            product: productId,
            variantId: item.variantId || variantFromId,
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            vatPercent: item.vatPercent,
          };
        })
      : [];

    const result = await validateAndApplyCoupon(String(code || ""), Number(cartValue || 0), {
      userId: session?.user?.id,
      email: (typeof email === "string" ? email : session?.user?.email) || undefined,
      items: cartLines,
    });

    return NextResponse.json({
      code: result.couponCodes[0],
      type:
        result.type === "fixed_amount"
          ? "fixed"
          : result.type === "product_price"
            ? "product_price"
            : result.type,
      value: result.discount,
      discount: result.discount,
      freeShipping: result.freeShipping,
      adjustedSubtotal: result.adjustedSubtotal,
      lineAdjustments: result.lineAdjustments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Érvénytelen kuponkód";
    const status = message.includes("nem elérhető") ? 403 : 400;
    if (message === "Érvénytelen kuponkód") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status });
  }
}
