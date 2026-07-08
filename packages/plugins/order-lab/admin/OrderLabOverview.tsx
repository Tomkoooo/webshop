"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Package, Plug, ExternalLink } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import type { FoxpostConnectionStatus } from "@wse/core/lib/foxpost";

type ConnectionPayload = FoxpostConnectionStatus & {
  isConfigured?: boolean;
  source?: "admin";
};

export function OrderLabOverview() {
  const [status, setStatus] = useState<ConnectionPayload | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/plugins/order-lab/connection")
      .then((res) => res.json())
      .then((data) => setStatus(data.connection ?? null))
      .catch(() => setStatus(null));
    fetch("/api/plugins/order-lab/stats")
      .then((res) => res.json())
      .then((data) => setOrderCount(Number(data.sandboxOrderCount ?? 0)))
      .catch(() => setOrderCount(null));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-heading font-black tracking-tight uppercase italic text-white">
          Order <span className="admin-headline-accent">Lab</span>
        </h1>
        <p className="text-neutral-400 mt-2 max-w-2xl">
          Foxpost sandbox rendeléskezelés — külön gyűjteményben, teszt automatákkal (hu1000 alatti
          operator_id).
        </p>
      </div>

      {!status?.isConfigured ? (
        <div className="border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Foxpost sandbox hitelesítés nincs beállítva. Add meg a teszt API adatokat a{" "}
          <Link href="/admin/plugins/order-lab/settings" className="underline font-bold">
            Beállítások
          </Link>{" "}
          menüben (nem env változókból).
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border border-white/10 bg-white/5 p-6 space-y-2">
          <div className="flex items-center gap-2 text-neutral-400">
            <Package className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sandbox rendelések</span>
          </div>
          <p className="text-3xl font-black text-white">{orderCount ?? "—"}</p>
          <Link href="/admin/plugins/order-lab/orders" className="text-[10px] admin-link-accent uppercase tracking-widest">
            Megnyitás
          </Link>
        </div>

        <div className="border border-white/10 bg-white/5 p-6 space-y-2 sm:col-span-2">
          <div className="flex items-center gap-2 text-neutral-400">
            <Plug className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Foxpost kapcsolat (admin)</span>
          </div>
          {status ? (
            <div className="text-[11px] text-neutral-300 space-y-1">
              <p>
                Endpoint: <span className="text-white">{status.apiBaseUrl}</span>
                {status.isSandbox ? (
                  <span className="ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[9px] uppercase">
                    Sandbox
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-[9px] uppercase">
                    Production
                  </span>
                )}
              </p>
              <p>
                Felhasználó: <span className="text-white">{status.usernameMasked}</span> · isWeb:{" "}
                <span className="text-white">{status.isWeb ? "true" : "false"}</span>
              </p>
              <p>
                Méret: {status.parcelSize} · Címke: {status.labelPageSize}
              </p>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">Kapcsolat betöltése...</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !status?.isConfigured}
              className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest"
              onClick={() => {
                setTestResult(null);
                startTransition(async () => {
                  const res = await fetch("/api/plugins/order-lab/connection-test");
                  const data = await res.json().catch(() => ({}));
                  setTestResult(data.ok ? "Kapcsolat OK" : data.error || "Hiba");
                });
              }}
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Kapcsolat teszt
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest">
              <Link href="/admin/plugins/order-lab/settings">Beállítások →</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest">
              <a href="https://webapi-test.foxpost.hu/sandbox/" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Foxpost sandbox portál
              </a>
            </Button>
          </div>
          {testResult ? (
            <p className={`text-[10px] font-black uppercase tracking-widest ${testResult === "Kapcsolat OK" ? "text-emerald-400" : "text-rose-400"}`}>
              {testResult}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
