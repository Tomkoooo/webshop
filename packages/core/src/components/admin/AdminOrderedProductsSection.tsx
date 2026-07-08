"use client";

import { useState, useTransition } from "react";
import { Package, Search, Download, Calendar } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner";
import { formatHuf } from "@wse/core/lib/pricing";
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
    <section className="bg-white/5 border border-white/10 p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Package className="w-5 h-5 admin-icon-accent" />
            Rendelt termékek listája
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Összes rendelt termék variánsokkal együtt
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDateMode("all")}
              className={`h-10 px-4 text-[10px] font-black uppercase tracking-widest border transition-colors ${
                dateMode === "all"
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-neutral-400 border-white/10 hover:border-white/30"
              }`}
            >
              Összes idő
            </button>
            <button
              type="button"
              onClick={() => setDateMode("since")}
              className={`h-10 px-4 text-[10px] font-black uppercase tracking-widest border transition-colors ${
                dateMode === "since"
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-neutral-400 border-white/10 hover:border-white/30"
              }`}
            >
              Dátum óta
            </button>
          </div>

          {dateMode === "since" && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                className="h-10 bg-black border border-white/10 px-3 text-sm text-white rounded-none"
              />
            </div>
          )}

          <Button
            type="button"
            onClick={handleFilter}
            disabled={isPending || (dateMode === "since" && !sinceDate)}
            className="h-10 rounded-none bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
          >
            {isPending ? <LoadingSpinner size="xs" className="mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Szűrés
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            disabled={products.length === 0}
            className="h-10 rounded-none border-white/10 bg-black px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Termék sorok</p>
          <p className="text-2xl font-black text-white mt-1">{products.length}</p>
        </div>
        <div className="border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Összes darab</p>
          <p className="text-2xl font-black text-white mt-1">{totalQuantity.toLocaleString("hu-HU")}</p>
        </div>
        <div className="border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Összes bevétel</p>
          <p className="text-2xl font-black admin-value mt-1">{formatHuf(totalRevenue)}</p>
        </div>
        <div className="border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Szűrő</p>
          <p className="text-sm font-bold text-neutral-300 mt-1">
            {dateMode === "all" ? "Minden idő" : sinceDate || "-"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-neutral-500">Termék</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-neutral-500">Variáns</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-neutral-500 text-right">Eladott DB</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-neutral-500 text-right">Bevétel</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-neutral-500 text-right">Rendelések</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500 italic">
                  Nincs megjeleníthető adat.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={`${product.productId}-${product.variantLabel ?? "base"}-${index}`} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <span className="font-bold text-white">{product.productName}</span>
                  </td>
                  <td className="px-4 py-3">
                    {product.variantLabel ? (
                      <span className="text-xs font-bold admin-value px-2 py-1 border border-white/10 bg-black/40">
                        {product.variantLabel}
                      </span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-white">{product.totalQuantity.toLocaleString("hu-HU")}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black admin-value">{formatHuf(product.totalRevenue)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-neutral-400 font-bold">{product.orderCount}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
