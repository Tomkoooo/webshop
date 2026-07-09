import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Eye,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { getAdminStats } from "@wse/core/actions/admin-stats"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { resolveShopDisabledAdminLanding } from "@wse/core/lib/admin-plugin-navigation"
import { AdminContentModeHub } from "@wse/core/components/admin/AdminContentModeHub"
import { AdminKpiCard } from "@wse/core/components/admin/AdminKpiCard"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import type { ComponentType } from "react"

type RecentOrder = {
  _id: string
  createdAt: string | Date
  total: number
}

type UnreadContactMessage = {
  _id: string
  name: string
  email: string
  message: string
  createdAt: string | Date
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ recentPage?: string }>
}) {
  if (!isShopEnabled()) {
    const landing = await resolveShopDisabledAdminLanding()
    if (landing.kind === "redirect") {
      redirect(landing.href)
    }
    return (
      <AdminContentModeHub
        plugins={landing.plugins}
        pendingPlugins={landing.pendingPlugins}
      />
    )
  }

  const params = await searchParams
  const recentPage = Math.max(1, Number.parseInt(params.recentPage || "1", 10) || 1)
  const statsData = await getAdminStats({ recentPage })
  const { kpis, recentOrders, recentOrdersPagination, unreadContactMessages } = statsData
  const typedRecentOrders = recentOrders as RecentOrder[]
  const typedUnreadMessages = unreadContactMessages as UnreadContactMessage[]

  const stats: Array<{
    title: string
    value: string
    subtitle?: string
    icon: ComponentType<{ className?: string }>
  }> = [
    {
      title: "Összes bevétel",
      value: `${Math.round(kpis.totalRevenue).toLocaleString("hu-HU")} Ft`,
      icon: TrendingUp,
    },
    {
      title: "Összes rendelés",
      value: kpis.ordersCount.toString(),
      icon: ShoppingCart,
    },
    {
      title: "Összes vásárló",
      value: kpis.totalCustomersCount.toString(),
      icon: Users,
    },
    {
      title: "Összes termék",
      value: kpis.productsCount.toString(),
      icon: Package,
    },
  ]

  const quickActions = [
    { label: "Rendelések", href: "/admin/orders", icon: ShoppingCart },
    { label: "Termékek", href: "/admin/products", icon: Package },
    { label: "CMS", href: "/admin/cms", icon: Sparkles },
    { label: "Rendszer", href: "/admin/info", icon: TrendingUp },
  ]

  return (
    <AdminPageScaffold
      title="Üdv újra!"
      description="Gyors áttekintés és a leggyakoribb feladatok — részletes statisztikákhoz használd a Statisztikák menüt."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminKpiCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Első lépések</CardTitle>
          <CardDescription>Gyors hozzáférés a leggyakoribb feladatokhoz.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button key={action.href} variant="outline" size="sm" asChild>
              <Link href={action.href}>
                <action.icon className="size-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Legutóbbi rendelések</CardTitle>
              <CardDescription>Az utolsó beérkező rendelések listája.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                Összes
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {typedRecentOrders.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">Még nincs rendelés.</p>
            ) : (
              typedRecentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{formatOrderNumberLabel(order._id)}</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(order.createdAt), "yyyy. MM. dd. HH:mm", { locale: hu })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      {order.total.toLocaleString("hu-HU")} Ft
                    </span>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/orders/${order._id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Kapcsolatfelvételek</CardTitle>
              <CardDescription>Olvasatlan üzenetek az ügyfélszolgálatról.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/contact">
                Üzenetek
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {typedUnreadMessages.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Nincs új olvasatlan üzenet.
              </p>
            ) : (
              typedUnreadMessages.map((message) => (
                <div
                  key={message._id}
                  className="flex gap-3 rounded-lg border bg-muted/30 p-4"
                >
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Új üzenet: {message.name}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{message.message}</p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {message.email} ·{" "}
                      {format(new Date(message.createdAt), "MM. dd. HH:mm", { locale: hu })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/contact/${message._id}`}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageScaffold>
  )
}
