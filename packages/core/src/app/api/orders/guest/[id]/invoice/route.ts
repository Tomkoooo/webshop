import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { formatOrderNumber } from "@wse/core/lib/order-number";
import { InvoicingSzamlazzService, invoiceDownloadParamsForOrder } from "@wse/core/services/invoicing-szamlazz";
import { OrderGuestAccessService } from "@wse/core/services/order-guest-access";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = shopCommerceBlockedResponse();
  if (blocked) return blocked;

  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Hiányzó hozzáférési token." }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Érvénytelen rendelés azonosító." }, { status: 400 });
  }

  const valid = await OrderGuestAccessService.verifyToken(id, token);
  if (!valid) {
    return NextResponse.json({ error: "A link érvénytelen vagy lejárt." }, { status: 403 });
  }

  await dbConnect();
  const order = await Order.findById(id).lean();
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pdfBuffer = await InvoicingSzamlazzService.downloadInvoicePdf(
    invoiceDownloadParamsForOrder(order as { _id: unknown; invoiceId?: string; invoicePdfFileName?: string })
  );
  if (!pdfBuffer) {
    return NextResponse.json({ error: "Invoice PDF not found" }, { status: 404 });
  }

  const invoiceId = String(
    (order as { invoiceId?: string }).invoiceId || `invoice-${formatOrderNumber(order._id)}`
  );
  const pdfBody = Uint8Array.from(pdfBuffer);

  return new NextResponse(pdfBody, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
