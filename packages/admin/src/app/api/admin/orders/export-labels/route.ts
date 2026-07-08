import { NextRequest, NextResponse } from "next/server"
import { auth } from "@wse/core/auth"
import dbConnect from "@wse/core/lib/db"
import Order from "@wse/core/models/Order"
import { format } from "date-fns"
import {
  buildAdminOrdersMongoQuery,
  filterAdminOrdersWithWorkspace,
  parseAdminOrderFiltersFromSearchParams,
  parseAdminOrderIdsParam,
} from "@wse/core/lib/admin-orders-query"
import { ADMIN_ORDER_DELETED_STATUS } from "@wse/core/lib/admin-orders-filters"
import { buildAdminOrderLabelsZipBuffer } from "@wse/core/lib/admin-orders-labels-zip"

function parseFilters(searchParams: URLSearchParams) {
  return parseAdminOrderFiltersFromSearchParams(searchParams)
}

function parseOrderIds(searchParams: URLSearchParams): string[] {
  return parseAdminOrderIdsParam(searchParams.get("ids"))
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
    const selectedIds = parseOrderIds(searchParams)

    await dbConnect()

    let orders: Array<{
      _id: unknown
      glsLabel?: { labelDataBase64?: string } | null
      foxpostShipment?: { labelDataBase64?: string } | null
      standardShippingLabel?: { labelDataBase64?: string } | null
    }>

    if (selectedIds.length > 0) {
      orders = await Order.find({
        _id: { $in: selectedIds },
        status: { $ne: ADMIN_ORDER_DELETED_STATUS },
      })
        .select(
          "_id glsLabel.labelDataBase64 foxpostShipment.labelDataBase64 standardShippingLabel.labelDataBase64"
        )
        .sort({ createdAt: -1 })
        .lean()
    } else {
      const query = buildAdminOrdersMongoQuery(filters)
      const rawOrders = await Order.find(query)
        .select(
          "_id glsLabel.labelDataBase64 foxpostShipment.labelDataBase64 standardShippingLabel.labelDataBase64 createdAt"
        )
        .sort({ createdAt: -1 })
        .lean()

      orders = filterAdminOrdersWithWorkspace(JSON.parse(JSON.stringify(rawOrders)), filters)
    }

    const buffer = await buildAdminOrderLabelsZipBuffer(orders)
    if (!buffer) {
      return NextResponse.json(
        { error: "Nincs letölthető címke a kijelölt rendelésekhez." },
        { status: 404 }
      )
    }

    const filename = `cimkek-${format(new Date(), "yyyy-MM-dd-HHmm")}.zip`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[admin/orders/export-labels]", error)
    return NextResponse.json({ error: "Label export failed" }, { status: 500 })
  }
}
