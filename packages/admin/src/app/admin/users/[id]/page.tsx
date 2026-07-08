import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, MapPin, ReceiptText, ShoppingBag } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { getAdminUserDetails, sendAdminPasswordReset } from "@wse/core/actions/admin-users";
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/users"
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            vissza a felhasználókhoz
          </Link>
          <h1 className="text-4xl font-heading font-black tracking-tight mt-3 uppercase italic text-white">
            <span className="admin-text-accent">Felhasználó</span> adatlap
          </h1>
          <p className="text-neutral-400 mt-2">
            {user.name || "Névtelen felhasználó"} · {user.email || "Nincs email"}
          </p>
        </div>

        <form action={sendAdminPasswordReset.bind(null, user._id)}>
          <Button className="h-12 rounded-none bg-primary hover:bg-primary/85 text-white uppercase tracking-widest text-[10px] font-black">
            <KeyRound className="w-4 h-4 mr-2" />
            Jelszó reset email küldése
          </Button>
        </form>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-5">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Rendelések</p>
          <p className="text-3xl font-black text-white mt-2">{stats.ordersCount}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Összes költés</p>
          <p className="text-3xl font-black text-white mt-2">
            {Math.round(stats.totalSpent).toLocaleString("hu-HU")} Ft
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Utolsó rendelés</p>
          <p className="text-lg font-black text-white mt-2">
            {stats.lastOrderAt ? new Date(stats.lastOrderAt).toLocaleDateString("hu-HU") : "-"}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 space-y-4">
          <h2 className="text-lg font-black uppercase tracking-widest text-white inline-flex items-center gap-2">
            <ReceiptText className="w-5 h-5 admin-icon-accent" />
            Számlázási adatok
          </h2>
          <div className="text-sm text-neutral-300 space-y-1">
            <p>Név: {user.billingInfo?.name || "-"}</p>
            <p>Típus: {user.billingInfo?.type || "-"}</p>
            <p>Adószám: {user.billingInfo?.taxNumber || "-"}</p>
            <p>
              Cím: {user.billingInfo?.zip || "-"} {user.billingInfo?.city || ""}{" "}
              {user.billingInfo?.street || ""}
            </p>
            <p>Ország: {user.billingInfo?.country || "-"}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 space-y-4">
          <h2 className="text-lg font-black uppercase tracking-widest text-white inline-flex items-center gap-2">
            <MapPin className="w-5 h-5 admin-icon-accent" />
            Szállítási adatok
          </h2>
          <div className="text-sm text-neutral-300 space-y-1">
            <p>Név: {user.shippingAddress?.name || "-"}</p>
            <p>
              Cím: {user.shippingAddress?.zip || "-"} {user.shippingAddress?.city || ""}{" "}
              {user.shippingAddress?.street || ""}
            </p>
            <p>Ország: {user.shippingAddress?.country || "-"}</p>
            <p>Megjegyzés: {user.shippingAddress?.comment || "-"}</p>
          </div>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 p-6 space-y-4">
        <h2 className="text-lg font-black uppercase tracking-widest text-white inline-flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 admin-icon-accent" />
          Rendelések
        </h2>

        {orders.length === 0 ? (
          <p className="text-neutral-500 italic">Nincs rendelési előzmény.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="border border-white/10 p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-black text-white uppercase tracking-wider">{formatOrderNumberLabel(order._id)}</p>
                  <p className="text-sm text-neutral-400">
                    {new Date(order.createdAt).toLocaleString("hu-HU")}
                  </p>
                </div>
                <div className="text-sm text-neutral-300 flex flex-wrap gap-6">
                  <p>Állapot: {order.status}</p>
                  <p>Összeg: {order.total.toLocaleString("hu-HU")} Ft</p>
                  <p>Tételek: {order.items.reduce((sum, item) => sum + item.quantity, 0)} db</p>
                </div>
                <div className="text-xs text-neutral-500">
                  {order.items
                    .map((item) =>
                      `${item.name}${item.variantLabel ? ` [${item.variantLabel}]` : ""} (${item.quantity} db)`
                    )
                    .join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
