"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { FOXPOST_SANDBOX_DEFAULT_APM_ID } from "@wse/core/lib/foxpost-sandbox-apms"
import type { FoxpostParcelPoint } from "@wse/core/lib/foxpost"
import {
  OrderLabField,
  OrderLabInput,
  OrderLabPageHeader,
  OrderLabPanel,
  orderLabSelectClass,
} from "./order-lab-admin-ui"

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
    <div className="flex max-w-2xl flex-col gap-6">
      <OrderLabPageHeader
        title="Beállítások"
        description="Foxpost sandbox API hitelesítés az adminban. Éles rendelések továbbra is env változókat használnak."
      />

      <OrderLabPanel title="Foxpost sandbox kapcsolat">
        <OrderLabField label="API URL">
          <OrderLabInput
            value={form.apiBaseUrl}
            onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
            placeholder="https://webapi-test.foxpost.hu/api"
          />
        </OrderLabField>

        <OrderLabField label="Felhasználónév">
          <OrderLabInput
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
        </OrderLabField>

        <OrderLabField
          label={`Jelszó${form.hasPassword ? " (üresen hagyva megtartja a mentett értéket)" : ""}`}
        >
          <OrderLabInput
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
          />
        </OrderLabField>

        <OrderLabField
          label={`API kulcs${form.hasApiKey ? " (üresen hagyva megtartja a mentett értéket)" : ""}`}
        >
          <OrderLabInput
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            autoComplete="new-password"
          />
        </OrderLabField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <OrderLabField label="Csomag méret">
            <OrderLabInput
              value={form.parcelSize}
              onChange={(e) => setForm((f) => ({ ...f, parcelSize: e.target.value }))}
            />
          </OrderLabField>
          <OrderLabField label="Címke méret">
            <OrderLabInput
              value={form.labelPageSize}
              onChange={(e) => setForm((f) => ({ ...f, labelPageSize: e.target.value }))}
            />
          </OrderLabField>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isWeb}
              onChange={(e) => setForm((f) => ({ ...f, isWeb: e.target.checked }))}
            />
            isWeb
          </label>
        </div>

        <Button type="button" disabled={isPending} onClick={saveConnection}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Kapcsolat mentése
        </Button>
      </OrderLabPanel>

      <OrderLabPanel title="Seed beállítások">
        <p className="text-muted-foreground text-sm">
          Automaták:{" "}
          <a
            href="https://cdn.foxpost.hu/sandbox_foxplus.json"
            className="text-primary font-medium hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            sandbox_foxplus.json
          </a>{" "}
          (hu1000 alatti operator_id).
        </p>

        <OrderLabField label="Seed darabszám (1–20)">
          <OrderLabInput
            value={form.defaultSeedCount}
            onChange={(e) => setForm((f) => ({ ...f, defaultSeedCount: e.target.value }))}
          />
        </OrderLabField>

        <OrderLabField label="Alapértelmezett automata">
          <select
            value={form.defaultApmId}
            onChange={(e) => setForm((f) => ({ ...f, defaultApmId: e.target.value }))}
            className={orderLabSelectClass}
          >
            {apms.map((apm) => (
              <option key={apm.id} value={apm.id}>
                {apm.id} — {apm.name}
              </option>
            ))}
          </select>
        </OrderLabField>

        <Button type="button" disabled={isPending || !form.isConfigured} onClick={seedWithSettings}>
          Seed futtatása
        </Button>
      </OrderLabPanel>

      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
