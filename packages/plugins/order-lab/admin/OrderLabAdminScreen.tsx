"use client";

import { lazy, Suspense } from "react";
import { OrderLabOverview } from "./OrderLabOverview";

const OrderLabOrdersAdmin = lazy(() =>
  import("./OrderLabOrdersAdmin").then((m) => ({ default: m.OrderLabOrdersAdmin }))
);
const OrderLabSettings = lazy(() =>
  import("./OrderLabSettings").then((m) => ({ default: m.OrderLabSettings }))
);
const OrderLabOrderDetail = lazy(() =>
  import("./OrderLabOrderDetail").then((m) => ({ default: m.OrderLabOrderDetail }))
);

export function OrderLabAdminScreen({
  path,
}: {
  path: string[];
  config: Record<string, unknown>;
}) {
  void path;
  const segment = path[0] ?? "";

  if (segment === "orders") {
    const orderId = path[1];
    if (orderId) {
      return (
        <Suspense fallback={<p className="text-neutral-500">Betöltés...</p>}>
          <OrderLabOrderDetail orderId={orderId} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<p className="text-neutral-500">Betöltés...</p>}>
        <OrderLabOrdersAdmin />
      </Suspense>
    );
  }

  if (segment === "settings") {
    return (
      <Suspense fallback={<p className="text-neutral-500">Betöltés...</p>}>
        <OrderLabSettings />
      </Suspense>
    );
  }

  return <OrderLabOverview />;
}
