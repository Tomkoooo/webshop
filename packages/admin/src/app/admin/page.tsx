import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Mail,
} from "lucide-react"
import { getAdminStats } from "@wse/core/actions/admin-stats"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { resolveShopDisabledAdminLanding } from "@wse/core/lib/admin-plugin-navigation"
import { AdminContentModeHub } from "@wse/core/components/admin/AdminContentModeHub"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import type { ComponentType } from "react"

type Trend = "up" | "down"

type KpiCardProps = {
  title: string
  value: string
  subtitle?: string
  change: number
  trend: Trend
  icon: ComponentType<{ className?: string }>
}

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

async function KpiCard({ title, value, subtitle, change, trend, icon: Icon }: KpiCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 admin-icon-well rounded-xl group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 admin-icon-accent" />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-emerald-400" : "text-rose-400"}`}
        >
          {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {change}%
        </div>
      </div>
      <div>
        <h3 className="text-white/40 text-sm font-medium mb-1 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle ? <p className="mt-2 text-xs font-bold text-neutral-500">{subtitle}</p> : null}
      </div>
    </div>
  )
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

  const stats: KpiCardProps[] = [
    {
      title: "Összes Bevétel",
      value: `${Math.round(kpis.totalRevenue).toLocaleString("hu-HU")} Ft`,
      change: 0,
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Összes Rendelés",
      value: kpis.ordersCount.toString(),
      change: 0,
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Összes Vásárló",
      value: kpis.totalCustomersCount.toString(),
      subtitle: `Regisztrált: ${kpis.registeredCustomersCount} · Vendég: ${kpis.guestCustomersCount}`,
      change: 0,
      trend: "up",
      icon: Users,
    },
    {
      title: "Összes Termék",
      value: kpis.productsCount.toString(),
      change: 0,
      trend: "up",
      icon: Package,
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase italic text-white">
          Vezérlőpult <span className="admin-headline-accent">Áttekintés</span>
        </h1>
        <p className="text-white/40 font-medium italic">
          Üdvözöljük az adminisztrációs felületen. Itt láthatja a bolt jelenlegi állapotát.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <KpiCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold italic uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-6 admin-section-marker rounded-full" />
              Legutóbbi Rendelések
            </h2>
            <Link
              href="/admin/orders"
              className="text-[10px] font-black uppercase tracking-widest admin-link-accent"
            >
              Összes megtekintése
            </Link>
          </div>
          <div className="space-y-4">
            {typedRecentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/20">
                <ShoppingCart className="w-12 h-12 mb-4 opacity-10" />
                <p className="italic">Még nincs rendelés.</p>
              </div>
            ) : (
              typedRecentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-white/25 transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="font-heading font-black text-white uppercase tracking-wider text-sm">
                      {formatOrderNumberLabel(order._id)}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                      {format(new Date(order.createdAt), "MM. dd. HH:mm", { locale: hu })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-white text-sm">
                      {order.total.toLocaleString("hu-HU")} FT
                    </span>
                    <Link href={`/admin/orders/${order._id}`}>
                      <Eye className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          {recentOrdersPagination.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                {recentOrdersPagination.page}. / {recentOrdersPagination.totalPages} oldal ·{" "}
                {recentOrdersPagination.totalItems} rendelés
              </p>
              <div className="flex gap-2">
                {recentOrdersPagination.hasPrevious ? (
                  <Link
                    href={`/admin?recentPage=${recentOrdersPagination.page - 1}`}
                    className="border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:border-white/30 hover:text-white"
                  >
                    Előző
                  </Link>
                ) : null}
                {recentOrdersPagination.hasNext ? (
                  <Link
                    href={`/admin?recentPage=${recentOrdersPagination.page + 1}`}
                    className="border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:border-white/30 hover:text-white"
                  >
                    Következő
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold italic uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-6 admin-section-marker rounded-full" />
              Aktivitási Napló
            </h2>
            <Link
              href="/admin/contact"
              className="text-[10px] font-black uppercase tracking-widest admin-link-accent"
            >
              Üzenetek
            </Link>
          </div>
          <div className="space-y-4">
            {typedUnreadMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/20">
                <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
                <p className="italic">Nincs új olvasatlan kapcsolatfelvétel.</p>
              </div>
            ) : (
              typedUnreadMessages.map((message) => (
                <div
                  key={message._id}
                  className="flex items-start justify-between gap-4 p-4 bg-white/5 border border-white/5 hover:border-white/25 transition-colors group"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-primary/10 p-2">
                      <Mail className="h-4 w-4 admin-icon-accent" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-heading font-black text-white uppercase tracking-wider text-sm">
                        Új üzenet: {message.name}
                      </span>
                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-neutral-400">
                        {message.message}
                      </p>
                      <span className="mt-2 block text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                        {message.email} ·{" "}
                        {format(new Date(message.createdAt), "MM. dd. HH:mm", { locale: hu })}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/contact/${message._id}`}
                    className="mt-1 shrink-0"
                    title="Üzenet megnyitása"
                  >
                    <Eye className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
