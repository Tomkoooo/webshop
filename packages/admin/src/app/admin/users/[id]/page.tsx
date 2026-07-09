import { notFound } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Card, CardContent } from "@wse/core/components/ui/card";
import { getAdminUserDetails, sendAdminPasswordReset } from "@wse/core/actions/admin-users";
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold";
import { formatOrderNumberLabel } from "@wse/core/lib/order-number";

type UserDetailsResponse = {
  user: {
    _id: string;
    name?: string;
    email?: string;
    role?: "ADMIN" | "USER";
    hasPassword?: boolean;
    billingInfo?: {
      type?: "personal" | "company";
      name?: string;
      taxNumber?: string;
      country?: string;
      city?: string;
      zip?: string;
      street?: string;
    };
    shippingAddress?: {
      name?: string;
      country?: string;
      city?: string;
      zip?: string;
      street?: string;
      comment?: string;
    };
  };
  orders: Array<{
    _id: string;
    total: number;
    status: string;
    createdAt: string | Date;
    items: { name: string; quantity: number; variantLabel?: string }[];
    billingInfo?: {
      type?: "personal" | "company";
      name?: string;
      taxNumber?: string;
      zip?: string;
      city?: string;
      street?: string;
    };
    shippingAddress?: {
      name?: string;
      zip?: string;
      city?: string;
      street?: string;
      comment?: string;
    };
  }>;
  stats: {
    ordersCount: number;
    totalSpent: number;
    lastOrderAt?: string | Date | null;
  };
};

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const details = (await getAdminUserDetails(id)) as UserDetailsResponse | null;

  if (!details) {
    notFound();
  }

  const { user, orders, stats } = details;

  return (
    <AdminPageScaffold
      backHref="/admin/users"
      backLabel="Vissza a felhasználókhoz"
      title="Felhasználó adatlap"
      description={`${user.name || "Névtelen felhasználó"} · ${user.email || "Nincs email"}`}
      actions={
        <form action={sendAdminPasswordReset.bind(null, user._id)}>
          <Button type="submit">
            <KeyRound className="size-4" />
            Jelszó reset email küldése
          </Button>
        </form>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Rendelések</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{stats.ordersCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Összes költés</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {Math.round(stats.totalSpent).toLocaleString("hu-HU")} Ft
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Utolsó rendelés</p>
            <p className="mt-2 text-lg font-semibold">
              {stats.lastOrderAt ? new Date(stats.lastOrderAt).toLocaleDateString("hu-HU") : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSection title="Számlázási adatok">
          <Card className="shadow-sm">
            <CardContent className="space-y-1 pt-6 text-sm">
              <p>Név: {user.billingInfo?.name || "-"}</p>
              <p>Típus: {user.billingInfo?.type || "-"}</p>
              <p>Adószám: {user.billingInfo?.taxNumber || "-"}</p>
              <p>
                Cím: {user.billingInfo?.zip || "-"} {user.billingInfo?.city || ""}{" "}
                {user.billingInfo?.street || ""}
              </p>
              <p>Ország: {user.billingInfo?.country || "-"}</p>
            </CardContent>
          </Card>
        </AdminSection>

        <AdminSection title="Szállítási adatok">
          <Card className="shadow-sm">
            <CardContent className="space-y-1 pt-6 text-sm">
              <p>Név: {user.shippingAddress?.name || "-"}</p>
              <p>
                Cím: {user.shippingAddress?.zip || "-"} {user.shippingAddress?.city || ""}{" "}
                {user.shippingAddress?.street || ""}
              </p>
              <p>Ország: {user.shippingAddress?.country || "-"}</p>
              <p>Megjegyzés: {user.shippingAddress?.comment || "-"}</p>
            </CardContent>
          </Card>
        </AdminSection>
      </div>

      <AdminSection title="Rendelések">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nincs rendelési előzmény.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order._id} className="shadow-sm">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">{formatOrderNumberLabel(order._id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("hu-HU")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <p>Állapot: {order.status}</p>
                    <p>Összeg: {order.total.toLocaleString("hu-HU")} Ft</p>
                    <p>Tételek: {order.items.reduce((sum, item) => sum + item.quantity, 0)} db</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.items
                      .map((item) =>
                        `${item.name}${item.variantLabel ? ` [${item.variantLabel}]` : ""} (${item.quantity} db)`
                      )
                      .join(", ")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminSection>
    </AdminPageScaffold>
  );
}
