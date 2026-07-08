"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Download, Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { bulkGenerateSandboxParcelLabels } from "@wse/core/actions/order-lab-orders";
import { Button } from "@wse/core/components/ui/button";
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner";
import { cn } from "@wse/core/lib/utils";
import { orderNeedsParcelLabel } from "@wse/core/lib/parcel-locker";
import { formatHuf } from "@wse/core/lib/pricing";

type SandboxOrderRow = {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  shippingAddress?: { name?: string };
  items?: Array<{ quantity?: number }>;
  foxpostParcelPoint?: { id?: string; name?: string };
  foxpostShipment?: {
    clFoxId?: string;
    trackingStatus?: string;
    labelUrl?: string;
    labelDataBase64?: string;
  };
};

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

async function readExportError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // fall through
    }
  }
  return `Az export sikertelen (HTTP ${response.status}).`;
}

export function OrderLabOrdersAdmin() {
  const router = useRouter();
  const [orders, setOrders] = useState<SandboxOrderRow[]>([]);
  const [foxpostManagerEnabled, setFoxpostManagerEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingLabelsZip, setIsExportingLabelsZip] = useState(false);
  const [isDownloadingSelectedZip, setIsDownloadingSelectedZip] = useState(false);

  const visibleOrderIds = useMemo(() => orders.map((order) => order._id), [orders]);
  const selectedVisibleIds = useMemo(
    () => visibleOrderIds.filter((orderId) => selectedIds.has(orderId)),
    [selectedIds, visibleOrderIds]
  );
  const selectedCount = selectedVisibleIds.length;
  const allVisibleSelected =
    visibleOrderIds.length > 0 && selectedCount === visibleOrderIds.length;
  const partiallySelected = selectedCount > 0 && !allVisibleSelected;

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch("/api/plugins/order-lab/orders-list");
      if (!res.ok) throw new Error("Lista betöltése sikertelen.");
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setFoxpostManagerEnabled(Boolean(data.foxpostManagerEnabled));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hiba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function seedOrders(count: number) {
    startTransition(async () => {
      const res = await fetch("/api/plugins/order-lab/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Seed sikertelen.");
        return;
      }
      await reload();
    });
  }

  function clearOrders() {
    if (!window.confirm("Biztosan törlöd az összes sandbox rendelést?")) return;
    startTransition(async () => {
      const res = await fetch("/api/plugins/order-lab/clear", { method: "POST" });
      if (!res.ok) {
        setError("Törlés sikertelen.");
        return;
      }
      setSelectedIds(new Set());
      await reload();
    });
  }

  const toggleOrder = (orderId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleOrderIds.forEach((orderId) => next.delete(orderId));
      } else {
        visibleOrderIds.forEach((orderId) => next.add(orderId));
      }
      return next;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/plugins/order-lab/export", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await readExportError(response));

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("spreadsheetml") && !contentType.includes("octet-stream")) {
        throw new Error("A szerver nem Excel fájlt adott vissza.");
      }

      const blob = await response.blob();
      if (blob.size < 4) throw new Error("Az export üres fájlt adott vissza.");

      const filename =
        parseFilename(response.headers.get("content-disposition")) ||
        `sandbox-rendelesek-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;

      const objectUrl = URL.createObjectURL(
        new Blob([await blob.arrayBuffer()], { type: XLSX_MIME })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Excel export letöltve.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Az Excel export nem sikerült.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadLabelsZip = async (ids?: string[]) => {
    const params = new URLSearchParams();
    if (ids && ids.length > 0) params.set("ids", ids.join(","));
    const response = await fetch(
      `/api/plugins/order-lab/export-labels${params.toString() ? `?${params.toString()}` : ""}`,
      { method: "GET", credentials: "same-origin", cache: "no-store" }
    );
    if (!response.ok) throw new Error(await readExportError(response));

    const blob = await response.blob();
    if (blob.size < 4) throw new Error("A címke ZIP üres.");

    const filename =
      parseFilename(response.headers.get("content-disposition")) ||
      `sandbox-cimkek-${format(new Date(), "yyyy-MM-dd-HHmm")}.zip`;

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleLabelsZipExport = async () => {
    setIsExportingLabelsZip(true);
    try {
      await downloadLabelsZip();
      toast.success("Címke ZIP letöltve.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "A címke ZIP export nem sikerült.");
    } finally {
      setIsExportingLabelsZip(false);
    }
  };

  const handleDownloadSelectedLabelsZip = async () => {
    if (selectedVisibleIds.length === 0 || isDownloadingSelectedZip) return;
    setIsDownloadingSelectedZip(true);
    try {
      await downloadLabelsZip(selectedVisibleIds);
      toast.success("Címke ZIP letöltve.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "A címke ZIP letöltése nem sikerült.");
    } finally {
      setIsDownloadingSelectedZip(false);
    }
  };

  const handleBulkGenerateLabels = async () => {
    if (selectedVisibleIds.length === 0 || isGeneratingLabels || !foxpostManagerEnabled) return;

    setIsGeneratingLabels(true);
    try {
      const result = await bulkGenerateSandboxParcelLabels(selectedVisibleIds, {
        skipExisting: true,
      });
      setSelectedIds((current) => {
        const next = new Set(current);
        selectedVisibleIds.forEach((orderId) => next.delete(orderId));
        return next;
      });
      await reload();
      router.refresh();

      const parts = [`${result.successCount} címke elkészült`];
      if (result.skippedCount > 0) parts.push(`${result.skippedCount} kihagyva`);
      if (result.failedCount > 0) parts.push(`${result.failedCount} sikertelen`);
      if (result.failedCount > 0) toast.error(`${parts.join(", ")}.`);
      else toast.success(`${parts.join(", ")}.`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "A címkék tömeges generálása sikertelen."
      );
    } finally {
      setIsGeneratingLabels(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black uppercase italic text-white">
            Sandbox rendelések
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Külön gyűjtemény — nem érinti az éles rendeléseket.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isExporting || isExportingLabelsZip || loading}
            onClick={() => void handleExport()}
            className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest border-white/10"
          >
            {isExporting ? (
              <LoadingSpinner size="xs" className="mr-2 shrink-0" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Excel export
          </Button>
          {foxpostManagerEnabled ? (
            <Button
              type="button"
              variant="outline"
              disabled={isExporting || isExportingLabelsZip || loading}
              onClick={() => void handleLabelsZipExport()}
              className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest border-white/10"
            >
              {isExportingLabelsZip ? (
                <LoadingSpinner size="xs" className="mr-2 shrink-0" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Címkék ZIP (összes)
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={isPending}
            onClick={() => seedOrders(3)}
            className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Seed (3 db)
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={clearOrders}
            className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest border-rose-500/30 text-rose-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Összes törlése
          </Button>
        </div>
      </div>

      {error ? <p className="text-rose-400 text-sm">{error}</p> : null}
      {loading ? <p className="text-neutral-500">Betöltés...</p> : null}

      {!loading && orders.length === 0 ? (
        <p className="text-neutral-500 text-sm">Nincs sandbox rendelés. Használd a Seed gombot.</p>
      ) : null}

      {!loading && orders.length > 0 ? (
        <div className="space-y-4">
          {foxpostManagerEnabled ? (
            <div className="flex flex-col gap-3 border border-white/10 bg-white/5 p-4 text-white md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  Tömeges címke kezelés
                </p>
                <p className="mt-1 text-sm font-bold italic text-white/70">
                  Csak a hiányzó Foxpost címkék készülnek. A ZIP a már generált PDF-eket
                  tartalmazza.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    selectedCount === 0 ||
                    isGeneratingLabels ||
                    isDownloadingSelectedZip ||
                    isPending
                  }
                  onClick={() => void handleBulkGenerateLabels()}
                  className="h-12 rounded-none border-white/10 bg-black px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10"
                >
                  {isGeneratingLabels ? (
                    <LoadingSpinner size="xs" className="mr-2 shrink-0" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Címkék generálása (kijelöltek)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    selectedCount === 0 ||
                    isDownloadingSelectedZip ||
                    isGeneratingLabels ||
                    isPending
                  }
                  onClick={() => void handleDownloadSelectedLabelsZip()}
                  className="h-12 rounded-none border-white/10 bg-black px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10"
                >
                  {isDownloadingSelectedZip ? (
                    <LoadingSpinner size="xs" className="mr-2 shrink-0" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Címkék ZIP (kijelöltek)
                </Button>
              </div>
            </div>
          ) : null}

          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-white/10 bg-white/5">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      aria-checked={partiallySelected ? "mixed" : allVisibleSelected}
                      disabled={orders.length === 0 || isGeneratingLabels || isPending}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded-none border-white/20 bg-black accent-primary disabled:opacity-40"
                      aria-label="Összes sandbox rendelés kijelölése"
                    />
                  </th>
                  <th className="p-3">Szám</th>
                  <th className="p-3">Vásárló</th>
                  <th className="p-3">Automata</th>
                  <th className="p-3">CLFOX</th>
                  <th className="p-3">Címke</th>
                  <th className="p-3">Státusz</th>
                  <th className="p-3">Dátum</th>
                  <th className="p-3">Összeg</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isSelected = selectedIds.has(order._id);
                  const shipmentForLabelCheck = {
                    foxpostParcelPoint: order.foxpostParcelPoint,
                    foxpostShipment: order.foxpostShipment?.labelDataBase64
                      ? { ...order.foxpostShipment, labelDataBase64: "present" }
                      : order.foxpostShipment,
                  };
                  const needsLabel = orderNeedsParcelLabel(shipmentForLabelCheck);

                  return (
                    <tr
                      key={order._id}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/5",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <td className="p-3 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isGeneratingLabels || isPending}
                          onChange={() => toggleOrder(order._id)}
                          className="h-4 w-4 rounded-none border-white/20 bg-black accent-primary disabled:opacity-40"
                          aria-label={`${order.orderNumber} rendelés kijelölése`}
                        />
                      </td>
                      <td className="p-3 font-mono text-white">{order.orderNumber}</td>
                      <td className="p-3 text-neutral-300">
                        {order.shippingAddress?.name || "—"}
                      </td>
                      <td className="p-3 text-neutral-400">{order.foxpostParcelPoint?.id}</td>
                      <td className="p-3 text-neutral-400">
                        {order.foxpostShipment?.clFoxId || "—"}
                      </td>
                      <td className="p-3">
                        {needsLabel ? (
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                            Hiányzik
                          </span>
                        ) : order.foxpostParcelPoint?.id ? (
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                            Van
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-neutral-300 uppercase text-[10px]">
                        {order.status}
                      </td>
                      <td className="p-3 text-neutral-500 text-xs">
                        {format(new Date(order.createdAt), "yyyy.MM.dd HH:mm", { locale: hu })}
                      </td>
                      <td className="p-3 text-white font-black">{formatHuf(order.total)}</td>
                      <td className="p-3">
                        <Link
                          href={`/admin/plugins/order-lab/orders/${order._id}`}
                          className="admin-link-accent text-[10px] uppercase tracking-widest"
                        >
                          Részletek
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
