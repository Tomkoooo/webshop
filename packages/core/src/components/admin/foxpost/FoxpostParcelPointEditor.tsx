"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateFoxpostParcelPointOnOrder, type FoxpostShipmentSource } from "@wse/core/actions/foxpost-shipment";
import { Button } from "@wse/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog";
import { Input } from "@wse/core/components/ui/input";
import type { FoxpostParcelPoint } from "@wse/core/lib/foxpost";
import { cn } from "@wse/core/lib/utils";

type FoxpostApmCatalogResponse = {
  mode: "production" | "sandbox";
  fetchedAt: string;
  apms: FoxpostParcelPoint[];
};

type FoxpostParcelPointEditorProps = {
  source: FoxpostShipmentSource;
  orderId: string;
  currentPoint?: FoxpostParcelPoint | null;
  parcelLocked: boolean;
  disabled?: boolean;
  onUpdated?: () => void;
};

function formatApmLine(apm: FoxpostParcelPoint): string {
  return [apm.zip, apm.city, apm.address].filter(Boolean).join(" ");
}

export function FoxpostParcelPointEditor({
  source,
  orderId,
  currentPoint,
  parcelLocked,
  disabled = false,
  onUpdated,
}: FoxpostParcelPointEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingList, setLoadingList] = useState(false);
  const [catalog, setCatalog] = useState<FoxpostApmCatalogResponse | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(currentPoint?.id ?? "");

  const loadCatalog = useCallback(async (forceRefresh = false) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (forceRefresh) params.set("refresh", "1");
      if (source === "sandbox") params.set("mode", "sandbox");
      const res = await fetch(`/api/admin/foxpost/apms?${params.toString()}`);
      const data = (await res.json()) as FoxpostApmCatalogResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Automata lista betöltése sikertelen.");
      }
      setCatalog(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Automata lista betöltése sikertelen.");
    } finally {
      setLoadingList(false);
    }
  }, [source]);

  useEffect(() => {
    if (!open) return;
    setSelectedId(currentPoint?.id ?? "");
    setQuery("");
    void loadCatalog(false);
  }, [open, currentPoint?.id, loadCatalog]);

  const filteredApms = useMemo(() => {
    const apms = catalog?.apms ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return apms.slice(0, 200);
    return apms
      .filter((apm) => {
        const haystack = [apm.id, apm.name, apm.city, apm.zip, apm.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 200);
  }, [catalog?.apms, query]);

  const handleSave = () => {
    if (!selectedId || isPending || disabled || parcelLocked) return;
    startTransition(async () => {
      const result = await updateFoxpostParcelPointOnOrder({
        source,
        id: orderId,
        apmId: selectedId,
      });
      if (!result.success) {
        toast.error(result.error || "A csomagpont mentése sikertelen.");
        return;
      }
      toast.success("Foxpost csomagpont frissítve.");
      setOpen(false);
      router.refresh();
      onUpdated?.();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || parcelLocked}
        onClick={() => setOpen(true)}
        className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Csomagpont módosítása
      </Button>

      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-none border-white/10 bg-black p-0 text-white sm:max-w-2xl">
          <DialogHeader className="border-b border-white/10 px-5 py-4 pr-12">
            <DialogTitle className="text-lg font-black uppercase italic tracking-tight">
              Foxpost csomagpont választása
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-400">
              A lista naponta frissül a Foxpost hivatalos forrásából (
              <span className="text-neutral-300">foxplus.json</span>). Válassz élő automatát — a bezárt pontok
              nincsenek a listában.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 border-b border-white/10 px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Keresés név, város, irányítószám vagy ID alapján…"
                className="h-10 flex-1 rounded-none border-white/10 bg-neutral-950"
              />
              <Button
                type="button"
                variant="outline"
                disabled={loadingList}
                onClick={() => void loadCatalog(true)}
                className="h-10 shrink-0 rounded-none border-white/10 text-[10px] font-black uppercase tracking-widest"
              >
                {loadingList ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Lista frissítése
              </Button>
            </div>
            {catalog?.fetchedAt ? (
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                Lista betöltve:{" "}
                {format(new Date(catalog.fetchedAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
                {catalog.mode === "sandbox" ? " · sandbox" : " · éles"}
              </p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
            {loadingList && !catalog ? (
              <div className="flex h-40 items-center justify-center text-neutral-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Automaták betöltése…
              </div>
            ) : filteredApms.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">Nincs találat.</p>
            ) : (
              <ul className="space-y-2">
                {filteredApms.map((apm) => {
                  const isSelected = selectedId === apm.id;
                  return (
                    <li key={apm.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(apm.id)}
                        className={cn(
                          "w-full border p-3 text-left transition-colors",
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-white/10 bg-black/40 hover:border-white/20"
                        )}
                      >
                        <p className="text-sm font-bold text-white">{apm.name}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">
                          {apm.id} · {formatApmLine(apm) || "—"}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-white/10 px-5 py-4 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
              className="h-10 rounded-none border-white/10 text-[10px] font-black uppercase tracking-widest"
            >
              Mégse
            </Button>
            <Button
              type="button"
              disabled={isPending || !selectedId}
              onClick={handleSave}
              className="h-10 rounded-none text-[10px] font-black uppercase tracking-widest"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Csomagpont mentése
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
