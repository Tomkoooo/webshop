import { User, ShoppingBag, Coins, CalendarDays, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@wse/core/components/ui/button";
import { Badge } from "@wse/core/components/ui/badge";
import { getAdminUsers } from "@wse/core/actions/admin-users";
import { UserManagementSheet } from "@wse/core/components/admin/UserManagementSheet";
import { AdminCreateUserForm, AdminSyncAuthProfilesButton } from "@wse/core/components/admin/AdminUserManagementTools";
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold";
import { AdminFilterBar, AdminFilterInput, AdminFilterSelect } from "@wse/core/components/admin/AdminFilterBar";
import { AdminDataTable } from "@wse/core/components/admin/AdminDataTable";
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge";
import { formatHuf } from "@wse/core/lib/pricing";
import { isShopEnabled } from "@wse/core/lib/features/shop";

type AdminUserRow = {
  _id: string;
  kind?: "registered" | "guest";
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  ordersCount?: number;
  totalSpent?: number;
  lastOrderAt?: string | Date | null;
  recentOrders?: Array<{
    _id: string;
    total: number;
    status: string;
    createdAt: string | Date;
  }>;
};

type AdminUsersSearchParams = Promise<{
  q?: string;
  kind?: string;
  role?: string;
  hasOrders?: string;
}>;

export default async function AdminUsersPage({ searchParams }: { searchParams: AdminUsersSearchParams }) {
  const filters = await searchParams;
  const shopEnabled = isShopEnabled();
  const users = await getAdminUsers(filters) as AdminUserRow[];

  return (
    <AdminPageScaffold
      title={shopEnabled ? "Vásárlók" : "Felhasználók és adminok"}
      description={
        shopEnabled
          ? "Regisztrált fiókok és vendég vásárlók vásárlási összefoglalója."
          : "Admin jogosultságok kezelése. Google bejelentkezés után a felhasználó profil automatikusan létrejön — itt adhatsz ADMIN szerepet."
      }
      actions={<AdminSyncAuthProfilesButton />}
    >
      <AdminCreateUserForm />

      <AdminFilterBar className="md:grid-cols-6">
        <AdminFilterInput
          name="q"
          defaultValue={filters.q || ""}
          placeholder="Keresés név vagy email alapján..."
          className="md:col-span-2"
        />
        <AdminFilterSelect
          name="kind"
          defaultValue={filters.kind || "all"}
          disabled={!shopEnabled}
        >
          <option value="all">Minden vásárló</option>
          <option value="registered">Regisztrált</option>
          <option value="guest">Vendég</option>
        </AdminFilterSelect>
        <AdminFilterSelect
          name="role"
          defaultValue={filters.role || "all"}
        >
          <option value="all">Minden szerepkör</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </AdminFilterSelect>
        <AdminFilterSelect
          name="hasOrders"
          defaultValue={filters.hasOrders || "all"}
          disabled={!shopEnabled}
        >
          <option value="all">Rendelés szerint: mind</option>
          <option value="yes">Van rendelése</option>
          <option value="no">Nincs rendelése</option>
        </AdminFilterSelect>
        <Button type="submit">Szűrés</Button>
      </AdminFilterBar>

      <AdminDataTable
        rows={users}
        getRowKey={(item) => item._id}
        emptyMessage="Nincs még felhasználó."
        className="min-w-[900px]"
        columns={[
          {
            id: "user",
            header: "Felhasználó",
            cell: (item) => (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {item.name || (item.kind === "guest" ? "Vendég vásárló" : "Névtelen felhasználó")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.email || "Nincs email"}</p>
              </div>
            ),
          },
          {
            id: "type",
            header: "Típus / Szerepkör",
            cell: (item) => (
              <div className="flex flex-col items-start gap-2">
                <Badge
                  variant="outline"
                  className={
                    item.kind === "guest"
                      ? "border-blue-400/40 bg-blue-500/10 text-blue-800"
                      : "border-emerald-400/40 bg-emerald-500/10 text-emerald-800"
                  }
                >
                  <User className="size-3.5" />
                  {item.kind === "guest" ? "Vendég" : "Regisztrált"}
                </Badge>
                {item.kind !== "guest" ? (
                  <AdminStatusBadge
                    status={item.role === "ADMIN" ? "active" : "read"}
                    label={item.role}
                  />
                ) : null}
              </div>
            ),
          },
          {
            id: "orders",
            header: "Rendelések",
            cell: (item) => (
              <span className="inline-flex items-center gap-2 font-medium tabular-nums">
                <ShoppingBag className="size-4 text-muted-foreground" />
                {item.ordersCount || 0}
              </span>
            ),
          },
          {
            id: "spent",
            header: "Összes költés",
            cell: (item) => (
              <span className="inline-flex items-center gap-2 font-medium tabular-nums">
                <Coins className="size-4 text-muted-foreground" />
                {formatHuf(item.totalSpent || 0)}
              </span>
            ),
          },
          {
            id: "lastOrder",
            header: "Utolsó rendelés",
            cell: (item) => (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                {item.lastOrderAt ? new Date(item.lastOrderAt).toLocaleDateString("hu-HU") : "-"}
              </span>
            ),
          },
          {
            id: "actions",
            header: "Műveletek",
            headerClassName: "text-right",
            className: "text-right",
            cell: (item) => (
              <div className="flex justify-end gap-2">
                {item.kind === "guest" ? (
                  item.recentOrders?.[0] ? (
                    <Link href={`/admin/orders/${item.recentOrders[0]._id.toString()}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Legutóbbi rendelés megnyitása"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </Link>
                  ) : null
                ) : (
                  <UserManagementSheet
                    user={{
                      _id: item._id.toString(),
                      name: item.name,
                      email: item.email,
                      role: item.role,
                    }}
                    recentOrders={(item.recentOrders || []).map((order) => ({
                      _id: order._id.toString(),
                      total: order.total,
                      status: order.status,
                      createdAt: order.createdAt,
                    }))}
                  />
                )}
              </div>
            ),
          },
        ]}
      />
    </AdminPageScaffold>
  );
}
