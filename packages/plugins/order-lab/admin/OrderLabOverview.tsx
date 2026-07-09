"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, Package, Plug } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { Badge } from "@wse/core/components/ui/badge"
import type { FoxpostConnectionStatus } from "@wse/core/lib/foxpost"
import {
  OrderLabKpiCard,
  OrderLabPageHeader,
} from "./order-lab-admin-ui"

type ConnectionPayload = FoxpostConnectionStatus & {
  isConfigured?: boolean
  source?: "admin"
}

export function OrderLabOverview() {
  const [status, setStatus] = useState<ConnectionPayload | null>(null)
  const [orderCount, setOrderCount] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch("/api/plugins/order-lab/connection")
      .then((res) => res.json())
      .then((data) => setStatus(data.connection ?? null))
      .catch(() => setStatus(null))
    fetch("/api/plugins/order-lab/stats")
      .then((res) => res.json())
      .then((data) => setOrderCount(Number(data.sandboxOrderCount ?? 0)))
      .catch(() => setOrderCount(null))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <OrderLabPageHeader
        title="Order Lab"
        description="Foxpost sandbox rendeléskezelés — külön gyűjteményben, teszt automatákkal (hu1000 alatti operator_id)."
      />

      {!status?.isConfigured ? (
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-none">
          <CardContent className="py-4 text-sm text-amber-900">
            Foxpost sandbox hitelesítés nincs beállítva. Add meg a teszt API adatokat a{" "}
            <Link href="/admin/plugins/order-lab/settings" className="font-medium text-primary underline">
              Beállítások
            </Link>{" "}
            menüben.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OrderLabKpiCard
          title="Sandbox rendelések"
          value={orderCount !== null ? String(orderCount) : "—"}
          icon={Package}
          footer={
            <Link href="/admin/plugins/order-lab/orders" className="text-sm font-medium text-primary hover:underline">
              Megnyitás →
            </Link>
          }
        />

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plug className="size-5" />
              Foxpost kapcsolat
            </CardTitle>
            <CardDescription>Admin felületen megadott sandbox hitelesítés.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <dl className="grid gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="text-muted-foreground">Endpoint</dt>
                  <dd className="font-medium text-foreground">{status.apiBaseUrl}</dd>
                  {status.isSandbox ? (
                    <Badge className="bg-amber-500/12 text-amber-900">Sandbox</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/12 text-emerald-900">Production</Badge>
                  )}
                </div>
                <div>
                  <dt className="text-muted-foreground">Felhasználó</dt>
                  <dd className="font-medium">{status.usernameMasked}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Méret / címke</dt>
                  <dd>
                    {status.parcelSize} · {status.labelPageSize}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">Kapcsolat betöltése…</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || !status?.isConfigured}
                onClick={() => {
                  setTestResult(null)
                  startTransition(async () => {
                    const res = await fetch("/api/plugins/order-lab/connection-test")
                    const data = await res.json().catch(() => ({}))
                    setTestResult(data.ok ? "Kapcsolat OK" : data.error || "Hiba")
                  })
                }}
              >
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Kapcsolat teszt
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/plugins/order-lab/settings">Beállítások</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="https://webapi-test.foxpost.hu/sandbox/" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Foxpost sandbox portál
                </a>
              </Button>
            </div>
            {testResult ? (
              <p className={testResult === "Kapcsolat OK" ? "text-sm text-emerald-800" : "text-destructive text-sm"}>
                {testResult}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
