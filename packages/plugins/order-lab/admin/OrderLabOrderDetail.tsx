"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { FoxpostShipmentPanel } from "@wse/core/components/admin/foxpost/FoxpostShipmentPanel";
import { adminSectionTitle } from "@wse/core/lib/admin-ui";
import { formatHuf } from "@wse/core/lib/pricing";
import type { FoxpostParcelPoint, FoxpostShipment } from "@wse/core/lib/foxpost";
import {
  OrderLabLoading,
  OrderLabPageHeader,
  OrderLabPanel,
} from "./order-lab-admin-ui";

type SandboxOrderDetail = {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    variantLabel?: string;
  }>;
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    comment?: string;
  };
  foxpostParcelPoint: FoxpostParcelPoint;
  foxpostShipment?: FoxpostShipment;
};

export function OrderLabOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<SandboxOrderDetail | null>(null);
  const [foxpostManagerEnabled, setFoxpostManagerEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/plugins/order-lab/orders-list/${orderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Sandbox rendelés nem található.");
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        setFoxpostManagerEnabled(Boolean(data.foxpostManagerEnabled));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"));
  }, [orderId]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Link href="/admin/plugins/order-lab/orders" className="admin-link-accent text-sm">
          Vissza a listához
        </Link>
      </div>
    );
  }

  if (!order) {
    return <OrderLabLoading />;
  }

  return (
    <div className="space-y-8">
      <OrderLabPageHeader
        backHref="/admin/plugins/order-lab/orders"
        title={order.orderNumber}
        description={`${format(new Date(order.createdAt), "yyyy. MMMM dd. HH:mm", { locale: hu })} · ${order.status}`}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <OrderLabPanel>
          <h2 className={adminSectionTitle}>Tételek</h2>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between gap-4 text-sm border-b border-border pb-3">
              <div>
                <p className="text-foreground font-medium">{item.name}</p>
                {item.variantLabel ? (
                  <p className="text-sm text-muted-foreground">
                    Variáns: {item.variantLabel}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-xs">{item.quantity} db</p>
              </div>
              <p className="text-foreground font-semibold">{formatHuf(item.price * item.quantity)}</p>
            </div>
          ))}
          <p className="text-right text-foreground font-semibold">Összesen: {formatHuf(order.total)}</p>
        </OrderLabPanel>

        <div className="space-y-4">
          <OrderLabPanel>
            <h2 className={adminSectionTitle}>Címzett</h2>
            <p className="text-foreground">{order.shippingAddress.name}</p>
            <p className="text-muted-foreground">{order.shippingAddress.email}</p>
            <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
            {order.shippingAddress.comment ? (
              <p className="text-muted-foreground text-xs">{order.shippingAddress.comment}</p>
            ) : null}
          </OrderLabPanel>

          <FoxpostShipmentPanel
            source="sandbox"
            orderId={order._id}
            parcelManagerEnabled={foxpostManagerEnabled}
            foxpostParcelPoint={order.foxpostParcelPoint}
            foxpostShipment={order.foxpostShipment}
          />
        </div>
      </div>
    </div>
  );
}
