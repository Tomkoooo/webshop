import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { ProductService } from "@wse/core/services/product"
import { mediaImageSrc } from "@wse/core/lib/images"

export async function GET(request: NextRequest) {
  await requireAdmin()
  const query = request.nextUrl.searchParams.get("q") ?? ""
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1")
  const data = await ProductService.getPaginated(page, 12, {
    search: query.trim() || undefined,
    searchStyle: "substring",
    deleted: false,
  })

  return NextResponse.json({
    items: (data.products as any[]).map((item) => ({
      id: item._id.toString(),
      name: item.name,
      slug: item.slug,
      image: mediaImageSrc(item.images?.[0]),
    })),
    total: data.total,
  })
}
