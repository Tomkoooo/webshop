import { NextRequest, NextResponse } from "next/server"
import { auth } from "@wse/core/auth"
import dbConnect from "@wse/core/lib/db"
import Order from "@wse/core/models/Order"
// Ensure populated models are registered in this route bundle.
import "@wse/core/models/User"
import "@wse/core/models/ShippingMethod"
import "@wse/core/models/PaymentMethod"
import { format } from "date-fns"
import {
  buildAdminOrdersMongoQuery,
  filterAdminOrdersWithWorkspace,
  parseAdminOrderFiltersFromSearchParams,
  parseAdminOrderIdsParam,
} from "@wse/core/lib/admin-orders-query"
import { ADMIN_ORDER_DELETED_STATUS } from "@wse/core/lib/admin-orders-filters"
import { buildAdminOrdersExcelBuffer } from "@wse/core/lib/admin-orders-export"

function parseFilters(searchParams: URLSearchParams) {
  return parseAdminOrderFiltersFromSearchParams(searchParams)
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filters = parseFilters(searchParams)
    const selectedIds = parseAdminOrderIdsParam(searchParams.get("ids"))
    await dbConnect()

    let orders: Record<string, unknown>[]

    if (selectedIds.length > 0) {
      const rawOrders = await Order.find({
        _id: { $in: selectedIds },
        status: { $ne: ADMIN_ORDER_DELETED_STATUS },
      })
        .populate("user", "name email")
        .populate("shippingMethod", "name")
        .populate("paymentMethod", "name")
        .sort({ createdAt: -1 })
        .lean()
      orders = JSON.parse(JSON.stringify(rawOrders))
    } else {
      const query = buildAdminOrdersMongoQuery(filters)
      const rawOrders = await Order.find(query)
        .populate("user", "name email")
        .populate("shippingMethod", "name")
        .populate("paymentMethod", "name")
        .sort({ createdAt: -1 })
        .lean()
      orders = filterAdminOrdersWithWorkspace(JSON.parse(JSON.stringify(rawOrders)), filters)
    }

    const buffer = await buildAdminOrdersExcelBuffer(orders as never, filters)
    const filename = `rendelesek-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[admin/orders/export]", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
