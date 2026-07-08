"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { FoxpostShipmentPanel } from "@wse/core/components/admin/foxpost/FoxpostShipmentPanel";
import { formatHuf } from "@wse/core/lib/pricing";
import type { FoxpostParcelPoint, FoxpostShipment } from "@wse/core/lib/foxpost";

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
        <p className="text-rose-400">{error}</p>
        <Link href="/admin/plugins/order-lab/orders" className="admin-link-accent text-sm">
          Vissza a listához
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-neutral-500">Betöltés...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/plugins/order-lab/orders"
          className="group flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vissza</span>
        </Link>
        <h1 className="text-3xl font-heading font-black uppercase italic text-white">{order.orderNumber}</h1>
        <p className="text-neutral-500 text-sm mt-1">
          {format(new Date(order.createdAt), "yyyy. MMMM dd. HH:mm", { locale: hu })} · {order.status}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-neutral-300">Tételek</h2>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between gap-4 text-sm border-b border-white/5 pb-3">
              <div>
                <p className="text-white font-bold">{item.name}</p>
                {item.variantLabel ? (
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    Variáns: {item.variantLabel}
                  </p>
                ) : null}
                <p className="text-neutral-500 text-xs">{item.quantity} db</p>
              </div>
              <p className="text-white font-black">{formatHuf(item.price * item.quantity)}</p>
            </div>
          ))}
          <p className="text-right text-white font-black">Összesen: {formatHuf(order.total)}</p>
        </div>

        <div className="space-y-4">
          <div className="border border-white/10 bg-white/5 p-6 space-y-2 text-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-300">Címzett</h2>
            <p className="text-white">{order.shippingAddress.name}</p>
            <p className="text-neutral-400">{order.shippingAddress.email}</p>
            <p className="text-neutral-400">{order.shippingAddress.phone}</p>
            {order.shippingAddress.comment ? (
              <p className="text-neutral-500 text-xs">{order.shippingAddress.comment}</p>
            ) : null}
          </div>

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
