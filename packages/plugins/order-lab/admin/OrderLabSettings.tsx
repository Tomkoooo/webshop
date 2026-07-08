"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Label } from "@wse/core/components/ui/label";
import { Input } from "@wse/core/components/ui/input";
import { FOXPOST_SANDBOX_DEFAULT_APM_ID } from "@wse/core/lib/foxpost-sandbox-apms";
import type { FoxpostParcelPoint } from "@wse/core/lib/foxpost";

type ConnectionForm = {
  apiBaseUrl: string;
  username: string;
  password: string;
  apiKey: string;
  isWeb: boolean;
  parcelSize: string;
  labelPageSize: string;
  defaultSeedCount: string;
  defaultApmId: string;
  hasPassword: boolean;
  hasApiKey: boolean;
  isConfigured: boolean;
};

const DEFAULT_CONNECTION: ConnectionForm = {
  apiBaseUrl: "https://webapi-test.foxpost.hu/api",
  username: "",
  password: "",
  apiKey: "",
  isWeb: false,
  parcelSize: "M",
  labelPageSize: "A6",
  defaultSeedCount: "3",
  defaultApmId: FOXPOST_SANDBOX_DEFAULT_APM_ID,
  hasPassword: false,
  hasApiKey: false,
  isConfigured: false,
};

export function OrderLabSettings() {
  const [apms, setApms] = useState<FoxpostParcelPoint[]>([]);
  const [form, setForm] = useState<ConnectionForm>(DEFAULT_CONNECTION);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/plugins/order-lab/apms")
      .then((res) => res.json())
      .then((data) => setApms(Array.isArray(data.apms) ? data.apms : []))
      .catch(() => setApms([]));

    fetch("/api/plugins/order-lab/connection")
      .then((res) => res.json())
      .then((data) => {
        const connection = data.connection;
        if (!connection) return;
        setForm((prev) => ({
          ...prev,
          apiBaseUrl: connection.apiBaseUrl || prev.apiBaseUrl,
          username: connection.username || "",
          password: "",
          apiKey: "",
          isWeb: Boolean(connection.isWeb),
          parcelSize: connection.parcelSize || "M",
          labelPageSize: connection.labelPageSize || "A6",
          defaultSeedCount: String(connection.defaultSeedCount ?? 3),
          defaultApmId: connection.defaultApmId || FOXPOST_SANDBOX_DEFAULT_APM_ID,
          hasPassword: Boolean(connection.hasPassword),
          hasApiKey: Boolean(connection.hasApiKey),
          isConfigured: Boolean(connection.isConfigured),
        }));
      })
      .catch(() => undefined);
  }, []);

  function saveConnection() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/plugins/order-lab/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiBaseUrl: form.apiBaseUrl,
          username: form.username,
          password: form.password || undefined,
          apiKey: form.apiKey || undefined,
          isWeb: form.isWeb,
          parcelSize: form.parcelSize,
          labelPageSize: form.labelPageSize,
          defaultSeedCount: Number(form.defaultSeedCount),
          defaultApmId: form.defaultApmId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Mentés sikertelen.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        password: "",
        apiKey: "",
        hasPassword: Boolean(data.connection?.hasPassword),
        hasApiKey: Boolean(data.connection?.hasApiKey),
        isConfigured: Boolean(data.connection?.isConfigured),
      }));
      setMessage("Foxpost sandbox kapcsolat mentve.");
    });
  }

  async function seedWithSettings() {
    setMessage(null);
    setError(null);
    const count = Math.min(Math.max(Number(form.defaultSeedCount) || 3, 1), 20);
    const res = await fetch("/api/plugins/order-lab/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, apmId: form.defaultApmId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Seed sikertelen.");
      return;
    }
    setMessage(`${data.createdCount} sandbox rendelés létrehozva (${data.apmId}).`);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-heading font-black uppercase italic text-white">Beállítások</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Foxpost sandbox API hitelesítés az adminban (nem <code className="text-neutral-400">FOXPOST_*</code> env).
          Éles rendelések továbbra is env változókat használnak.
        </p>
      </div>

      <div className="border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-neutral-300">Foxpost sandbox kapcsolat</h2>

        <div>
          <Label className="text-[10px] uppercase tracking-widest text-neutral-500">API URL</Label>
          <Input
            value={form.apiBaseUrl}
            onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
            placeholder="https://webapi-test.foxpost.hu/api"
            className="h-10 rounded-none bg-black border-white/10 mt-1"
          />
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Felhasználónév</Label>
          <Input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="h-10 rounded-none bg-black border-white/10 mt-1"
          />
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-widest text-neutral-500">
            Jelszó {form.hasPassword ? "(üresen hagyva megtartja a mentett értéket)" : ""}
          </Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="h-10 rounded-none bg-black border-white/10 mt-1"
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-widest text-neutral-500">
            API kulcs {form.hasApiKey ? "(üresen hagyva megtartja a mentett értéket)" : ""}
          </Label>
          <Input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            className="h-10 rounded-none bg-black border-white/10 mt-1"
            autoComplete="new-password"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Csomag méret</Label>
            <Input
              value={form.parcelSize}
              onChange={(e) => setForm((f) => ({ ...f, parcelSize: e.target.value }))}
              className="h-10 rounded-none bg-black border-white/10 mt-1"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Címke méret</Label>
            <Input
              value={form.labelPageSize}
              onChange={(e) => setForm((f) => ({ ...f, labelPageSize: e.target.value }))}
              className="h-10 rounded-none bg-black border-white/10 mt-1"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-neutral-300 pb-2">
              <input
                type="checkbox"
                checked={form.isWeb}
                onChange={(e) => setForm((f) => ({ ...f, isWeb: e.target.checked }))}
              />
              isWeb
            </label>
          </div>
        </div>

        <Button
          type="button"
          disabled={isPending}
          onClick={saveConnection}
          className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest"
        >
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Kapcsolat mentése
        </Button>
      </div>

      <div className="border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-neutral-300">Seed beállítások</h2>
        <p className="text-xs text-neutral-500">
          Automaták:{" "}
          <a href="https://cdn.foxpost.hu/sandbox_foxplus.json" className="admin-link-accent" target="_blank" rel="noreferrer">
            sandbox_foxplus.json
          </a>{" "}
          (hu1000 alatti operator_id).
        </p>

        <div>
          <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Seed darabszám (1–20)</Label>
          <Input
            value={form.defaultSeedCount}
            onChange={(e) => setForm((f) => ({ ...f, defaultSeedCount: e.target.value }))}
            className="h-10 rounded-none bg-black border-white/10 mt-1"
          />
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Alapértelmezett automata</Label>
          <select
            value={form.defaultApmId}
            onChange={(e) => setForm((f) => ({ ...f, defaultApmId: e.target.value }))}
            className="w-full h-10 mt-1 bg-black border border-white/10 px-3 text-white text-sm"
          >
            {apms.map((apm) => (
              <option key={apm.id} value={apm.id}>
                {apm.id} — {apm.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          disabled={isPending || !form.isConfigured}
          onClick={seedWithSettings}
          className="h-10 rounded-none uppercase text-[10px] font-black tracking-widest"
        >
          Seed futtatása
        </Button>
      </div>

      {message ? <p className="text-[10px] text-emerald-400 uppercase tracking-widest">{message}</p> : null}
      {error ? <p className="text-[10px] text-rose-400 uppercase tracking-widest">{error}</p> : null}
    </div>
  );
}
