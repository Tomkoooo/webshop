"use client";

import { useState, useTransition } from "react";
import { Package, Search, Download, Calendar } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner";
import { AdminKpiCard } from "@wse/core/components/admin/AdminKpiCard";
import { AdminPanel } from "@wse/core/components/admin/AdminPanel";
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge";
import { adminInputClass, adminTableWrap } from "@wse/core/lib/admin-ui";
import { formatHuf } from "@wse/core/lib/pricing";
import { cn } from "@wse/core/lib/utils";
import type { OrderedProductRow } from "@wse/core/actions/admin-stats";

type AdminOrderedProductsSectionProps = {
  initialProducts: OrderedProductRow[];
  fetchProducts: (sinceDate: string | null) => Promise<OrderedProductRow[]>;
};

export function AdminOrderedProductsSection({
  initialProducts,
  fetchProducts,
}: AdminOrderedProductsSectionProps) {
  const [products, setProducts] = useState<OrderedProductRow[]>(initialProducts);
  const [dateMode, setDateMode] = useState<"all" | "since">("all");
  const [sinceDate, setSinceDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleFilter = () => {
    startTransition(async () => {
      const result = await fetchProducts(dateMode === "since" ? sinceDate : null);
      setProducts(result);
    });
  };

  const totalQuantity = products.reduce((sum, p) => sum + p.totalQuantity, 0);
  const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);

  const exportCsv = () => {
    const headers = ["Termék", "Variáns", "Eladott DB", "Bevétel", "Rendelések"];
    const rows = products.map((p) => [
      p.productName,
      p.variantLabel || "-",
      p.totalQuantity,
      p.totalRevenue,
      p.orderCount,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rendelt-termekek-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPanel
      title="Rendelt termékek listája"
      description="Összes rendelt termék variánsokkal együtt"
      actions={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDateMode("all")}
              className={cn(
                "h-10 rounded-md px-4 text-sm font-medium transition-colors",
                dateMode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Összes idő
            </button>
            <button
              type="button"
              onClick={() => setDateMode("since")}
              className={cn(
                "h-10 rounded-md px-4 text-sm font-medium transition-colors",
                dateMode === "since"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Dátum óta
            </button>
          </div>

          {dateMode === "since" && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                className={cn(adminInputClass, "h-10")}
              />
            </div>
          )}

          <Button
            type="button"
            onClick={handleFilter}
            disabled={isPending || (dateMode === "since" && !sinceDate)}
          >
            {isPending ? <LoadingSpinner size="xs" className="mr-2" /> : <Search className="mr-2 h-4 w-4" />}
            Szűrés
          </Button>

          <Button type="button" variant="outline" onClick={exportCsv} disabled={products.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AdminKpiCard title="Termék sorok" value={String(products.length)} icon={Package} />
        <AdminKpiCard
          title="Összes darab"
          value={totalQuantity.toLocaleString("hu-HU")}
          icon={Package}
        />
        <AdminKpiCard title="Összes bevétel" value={formatHuf(totalRevenue)} icon={Package} />
        <AdminKpiCard
          title="Szűrő"
          value={dateMode === "all" ? "Minden idő" : sinceDate || "—"}
          icon={Calendar}
        />
      </div>

      <div className={adminTableWrap}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Termék</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Variáns</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Eladott DB</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Bevétel</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Rendelések</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Nincs megjeleníthető adat.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr
                    key={`${product.productId}-${product.variantLabel ?? "base"}-${index}`}
                    className="hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{product.productName}</span>
                    </td>
                    <td className="px-4 py-3">
                      {product.variantLabel ? (
                        <AdminStatusBadge status="active" label={product.variantLabel} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold tabular-nums text-foreground">
                        {product.totalQuantity.toLocaleString("hu-HU")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatHuf(product.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-muted-foreground">{product.orderCount}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPanel>
  );
}
