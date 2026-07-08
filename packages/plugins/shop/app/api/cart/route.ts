import { NextRequest, NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import { CartService } from "@wse/core/services/cart";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { timeDevResponseMetric } from "@wse/core/lib/dev-metrics";

export async function GET(req: NextRequest) {
  return timeDevResponseMetric("cart.GET", async () => {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const cart = await CartService.getCart(session.user.id);
      return NextResponse.json(cart);
    } catch (error) {
      console.error("Cart GET error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }, { category: "api", route: "/api/cart", method: "GET", url: req.url });
}

export async function POST(req: NextRequest) {
  return timeDevResponseMetric("cart.POST", async () => {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { items } = await req.json();
      const cart = await CartService.replaceCart(session.user.id, items);
      return NextResponse.json(cart);
    } catch (error) {
      console.error("Cart POST error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }, { category: "api", route: "/api/cart", method: "POST", url: req.url });
}

export async function PUT(req: NextRequest) {
  return timeDevResponseMetric("cart.PUT", async () => {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { productId, quantity } = await req.json();
      const cart = await CartService.updateQuantity(session.user.id, productId, quantity);
      return NextResponse.json(cart);
    } catch (error) {
      console.error("Cart PUT error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }, { category: "api", route: "/api/cart", method: "PUT", url: req.url });
}

export async function DELETE(req: NextRequest) {
  return timeDevResponseMetric("cart.DELETE", async () => {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { searchParams } = new URL(req.url);
      const productId = searchParams.get("productId");
      if (!productId) {
        return NextResponse.json({ error: "Product ID required" }, { status: 400 });
      }

      const cart = await CartService.removeItem(session.user.id, productId);
      return NextResponse.json(cart);
    } catch (error) {
      console.error("Cart DELETE error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }, { category: "api", route: "/api/cart", method: "DELETE", url: req.url });
}
