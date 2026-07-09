import { getAdminDailyStats, getAdminStats, getOrderedProducts } from "@wse/core/actions/admin-stats"
import { redirect } from "next/navigation"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { resolvePluginStatsRedirect } from "@wse/core/lib/admin-plugin-navigation"
import { resolveAdminStatsDateRange } from "@wse/core/lib/admin-stats-date-range"
import { AdminDailyStatsSection } from "@wse/core/components/admin/AdminDailyStatsSection"
import { AdminKpiCard } from "@wse/core/components/admin/AdminKpiCard"
import { AdminOrderedProductsSection } from "@wse/core/components/admin/AdminOrderedProductsSection"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { TrendingUp, ShoppingCart, Users, Package, MessageSquare, BarChart3 } from "lucide-react"

type AdminStatsSearchParams = Promise<{
  preset?: string
  dateFrom?: string
  dateTo?: string
}>

type TopProduct = {
  soldQuantity: number
  revenue: number
  productName: string
}

type MonthlyRevenueRow = {
  label: string
  revenue: number
  orders: number
}

type AdminStatsResult = {
  kpis: {
    totalRevenue: number
    ordersCount: number
    nonCancelledOrdersCount: number
    customersCount: number
    totalCustomersCount: number
    registeredCustomersCount: number
    registeredOrderCustomersCount: number
    guestCustomersCount: number
    productsCount: number
    reviewsCount: number
    avgOrderValue: number
  }
  topProducts: TopProduct[]
  monthlyRevenue: MonthlyRevenueRow[]
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: AdminStatsSearchParams
}) {
  if (!isShopEnabled()) {
    const pluginStats = await resolvePluginStatsRedirect()
    if (pluginStats) redirect(pluginStats)
  }

  const filters = await searchParams
  let dailyStatsError: string | null = null
  let dailyStats: Awaited<ReturnType<typeof getAdminDailyStats>> | null = null

  try {
    const range = resolveAdminStatsDateRange(filters)
    dailyStats = await getAdminDailyStats(range)
  } catch (error) {
    dailyStatsError = error instanceof Error ? error.message : "Nem sikerült betölteni a napi statisztikákat."
  }

  const [stats, orderedProducts] = await Promise.all([
    getAdminStats() as Promise<AdminStatsResult>,
    getOrderedProducts(),
  ])
  const { kpis } = stats

  async function fetchOrderedProductsAction(sinceDate: string | null) {
    "use server"
    return getOrderedProducts(sinceDate ? { sinceDate } : {})
  }

  return (
    <AdminPageScaffold
      title="Statisztikák"
      description="Forgalom, rendelések és termékek — részletes napi bontás alább."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminKpiCard
          title="Összes bevétel"
          value={`${Math.round(kpis.totalRevenue).toLocaleString("hu-HU")} Ft`}
          subtitle="Nem törölt rendelések"
          icon={TrendingUp}
        />
        <AdminKpiCard
          title="Rendelések"
          value={`${kpis.nonCancelledOrdersCount}`}
          subtitle={`Összesen ${kpis.ordersCount} (töröltekkel)`}
          icon={ShoppingCart}
        />
        <AdminKpiCard
          title="Vásárlók"
          value={String(kpis.totalCustomersCount)}
          subtitle={`${kpis.registeredOrderCustomersCount} regisztrált · ${kpis.guestCustomersCount} vendég`}
          icon={Users}
        />
        <AdminKpiCard
          title="Regisztrált fiókok"
          value={String(kpis.registeredCustomersCount)}
          icon={Users}
        />
        <AdminKpiCard title="Termékek" value={String(kpis.productsCount)} icon={Package} />
        <AdminKpiCard title="Vélemények" value={String(kpis.reviewsCount)} icon={MessageSquare} />
        <AdminKpiCard
          title="Átlagos kosárérték"
          value={`${Math.round(kpis.avgOrderValue).toLocaleString("hu-HU")} Ft`}
          icon={BarChart3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top termékek</CardTitle>
          <CardDescription>Bevétel szerinti rangsor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Még nincs értékelhető adat.</p>
          ) : (
            stats.topProducts.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b py-2 last:border-0">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground text-xs">{item.soldQuantity} db eladva</p>
                </div>
                <p className="font-semibold tabular-nums">
                  {Math.round(item.revenue).toLocaleString("hu-HU")} Ft
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Havi trend</CardTitle>
          <CardDescription>Utolsó 6 hónap bevétele és rendelésszáma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.monthlyRevenue.map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b py-2 last:border-0">
              <p className="font-medium">{item.label}</p>
              <div className="text-right">
                <p className="font-semibold tabular-nums">
                  {Math.round(item.revenue).toLocaleString("hu-HU")} Ft
                </p>
                <p className="text-muted-foreground text-xs">{item.orders} rendelés</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {dailyStatsError ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg">Napi részletek</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-sm">{dailyStatsError}</p>
          </CardContent>
        </Card>
      ) : dailyStats ? (
        <AdminDailyStatsSection
          range={dailyStats.range}
          summary={dailyStats.summary}
          dailyIncome={dailyStats.dailyIncome}
          dailyProducts={dailyStats.dailyProducts}
        />
      ) : null}

      <AdminOrderedProductsSection
        initialProducts={orderedProducts}
        fetchProducts={fetchOrderedProductsAction}
      />
    </AdminPageScaffold>
  )
}
