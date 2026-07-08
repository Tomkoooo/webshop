import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@wse/core/services/product";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";

export async function GET(request: NextRequest) {
  const blocked = shopCommerceBlockedResponse();
  if (blocked) return blocked;
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  
  try {
    const { products } = await ProductService.getPaginated(1, 5, { 
      search: q,
      isActive: true,
      isVisible: true
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Live search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
