import { getAdminDailyStats, getAdminStats, getOrderedProducts } from "@wse/core/actions/admin-stats";
import { redirect } from "next/navigation";
import { isShopEnabled } from "@wse/core/lib/features/shop";
import { resolvePluginStatsRedirect } from "@wse/core/lib/admin-plugin-navigation";
import { resolveAdminStatsDateRange } from "@wse/core/lib/admin-stats-date-range";
import { AdminDailyStatsSection } from "@wse/core/components/admin/AdminDailyStatsSection";
import { AdminOrderedProductsSection } from "@wse/core/components/admin/AdminOrderedProductsSection";
import { TrendingUp, ShoppingCart, Users, Package, MessageSquare, BarChart3 } from "lucide-react";
import type { ComponentType } from "react";

type AdminStatsSearchParams = Promise<{
  preset?: string;
  dateFrom?: string;
  dateTo?: string;
}>;

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
};

type TopProduct = {
  soldQuantity: number;
  revenue: number;
  productName: string;
};

type MonthlyRevenueRow = {
  label: string;
  revenue: number;
  orders: number;
};

type AdminStatsResult = {
  kpis: {
    totalRevenue: number;
    ordersCount: number;
    nonCancelledOrdersCount: number;
    customersCount: number;
    totalCustomersCount: number;
    registeredCustomersCount: number;
    registeredOrderCustomersCount: number;
    guestCustomersCount: number;
    productsCount: number;
    reviewsCount: number;
    avgOrderValue: number;
  };
  topProducts: TopProduct[];
  monthlyRevenue: MonthlyRevenueRow[];
};

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">{title}</p>
        <Icon className="w-5 h-5 admin-icon-accent" />
      </div>
      <div>
        <p className="text-3xl font-black text-white">{value}</p>
        {subtitle ? <p className="text-xs text-neutral-500 font-bold mt-1">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: AdminStatsSearchParams;
}) {
  if (!isShopEnabled()) {
    const pluginStats = await resolvePluginStatsRedirect();
    if (pluginStats) redirect(pluginStats);
  }

  const filters = await searchParams;
  let dailyStatsError: string | null = null;
  let dailyStats: Awaited<ReturnType<typeof getAdminDailyStats>> | null = null;

  try {
    const range = resolveAdminStatsDateRange(filters);
    dailyStats = await getAdminDailyStats(range);
  } catch (error) {
    dailyStatsError = error instanceof Error ? error.message : "Nem sikerült betölteni a napi statisztikákat.";
  }

  const [stats, orderedProducts] = await Promise.all([
    getAdminStats() as Promise<AdminStatsResult>,
    getOrderedProducts(),
  ]);
  const { kpis } = stats;

  async function fetchOrderedProductsAction(sinceDate: string | null) {
    "use server";
    return getOrderedProducts(sinceDate ? { sinceDate } : {});
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
          Statisztikák <span className="admin-headline-accent">Áttekintés</span>
        </h1>
        <p className="text-white/40 font-medium italic">
          Valós idejű üzleti mutatók, forgalom és top termékek.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          title="Összes bevétel"
          value={`${Math.round(kpis.totalRevenue).toLocaleString("hu-HU")} Ft`}
          subtitle="Nem törölt rendelések alapján"
          icon={TrendingUp}
        />
        <StatCard
          title="Rendelések"
          value={`${kpis.nonCancelledOrdersCount} / ${kpis.ordersCount}`}
          subtitle="Érvényes / összes"
          icon={ShoppingCart}
        />
        <StatCard
          title="Összes vásárló"
          value={`${kpis.totalCustomersCount}`}
          subtitle={`Regisztrált vásárlók: ${kpis.registeredOrderCustomersCount} · Vendég vásárlók: ${kpis.guestCustomersCount}`}
          icon={Users}
        />
        <StatCard
          title="Regisztrált vásárlók"
          value={`${kpis.registeredCustomersCount}`}
          subtitle="Vásárlói fiókok (adminok nélkül)"
          icon={Users}
        />
        <StatCard
          title="Termékek"
          value={kpis.productsCount}
          subtitle="Adatbázisban tárolt termékek"
          icon={Package}
        />
        <StatCard
          title="Visszajelzések"
          value={kpis.reviewsCount}
          subtitle="Termék + webshop értékelések"
          icon={MessageSquare}
        />
        <StatCard
          title="Átlagos kosárérték"
          value={`${Math.round(kpis.avgOrderValue).toLocaleString("hu-HU")} Ft`}
          subtitle="AOV (nem törölt rendelések)"
          icon={BarChart3}
        />
      </div>

      <section className="bg-white/5 border border-white/10 p-6 space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Top termékek</h2>
        <div className="space-y-3">
          {stats.topProducts.length === 0 ? (
            <p className="text-neutral-500 italic">Még nincs értékelhető adat.</p>
          ) : (
            stats.topProducts.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <p className="font-black text-white uppercase tracking-wide">{item.productName}</p>
                  <p className="text-[11px] text-neutral-500 font-bold">{item.soldQuantity} db eladva</p>
                </div>
                <p className="font-black admin-value">{Math.round(item.revenue).toLocaleString("hu-HU")} Ft</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 p-6 space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Havi trend (utolsó 6 hónap)</h2>
        <div className="space-y-2">
          {stats.monthlyRevenue.map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b border-white/5 py-2">
              <p className="text-neutral-300 font-bold">{item.label}</p>
              <div className="text-right">
                <p className="text-white font-black">{Math.round(item.revenue).toLocaleString("hu-HU")} Ft</p>
                <p className="text-[11px] text-neutral-500">{item.orders} rendelés</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {dailyStatsError ? (
        <section className="bg-white/5 border border-rose-500/30 p-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Napi részletek</h2>
          <p className="mt-2 text-sm text-rose-300">{dailyStatsError}</p>
        </section>
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
    </div>
  );
}
