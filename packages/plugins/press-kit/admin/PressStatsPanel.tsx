"use client"

import { useEffect, useState } from "react"
import { pressKitAdminApi, type PressStatsRow } from "./press-api"
import {
  PressAdminInput,
  PressAdminLoading,
  PressAdminPageHeader,
} from "./press-admin-ui"
import { adminTableHead, adminTableWrap } from "@wse/core/lib/admin-ui"
import { Button } from "@wse/core/components/ui/button"

export function PressStatsPanel() {
  const [rows, setRows] = useState<PressStatsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    pressKitAdminApi
      .getStats(from || undefined, to || undefined)
      .then((res) => setRows(res.rows))
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exportCsv() {
    const header = [
      "Név",
      "Szerkesztőség",
      "E-mail",
      "Portál megnyitás",
      "Oldalmegtekintés",
      "PDF megnyitás",
      "PDF oldal",
      "Utolsó esemény",
    ]
    const lines = rows.map((r) =>
      [
        r.name,
        r.outlet,
        r.email,
        r.portalOpens,
        r.pageViews,
        r.pdfOpens,
        r.pdfPageViews,
        r.lastEventAt || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "press-kit-stats.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PressAdminPageHeader
        title="Megnyitások"
        description="Szerveroldali napló — megbízhatóbb, mint a GA4 egyedül."
      />

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground text-neutral-500">Tól</label>
          <PressAdminInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground text-neutral-500">Ig</label>
          <PressAdminInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" className="h-11" onClick={load}>
          Szűrés
        </Button>
        <Button variant="outline" className="h-11" onClick={exportCsv} disabled={rows.length === 0}>
          CSV export
        </Button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {loading ? (
        <PressAdminLoading />
      ) : (
        <div className={adminTableWrap}>
          <table className="w-full text-sm text-left">
            <thead className={`border-b border-border bg-muted/40 ${adminTableHead}`}>
              <tr>
                <th className="p-3">Név</th>
                <th className="p-3">Szerkesztőség</th>
                <th className="p-3">Portál</th>
                <th className="p-3">Oldal</th>
                <th className="p-3">PDF</th>
                <th className="p-3">PDF oldal</th>
                <th className="p-3">Utolsó</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.contactId} className="border-t border-border">
                  <td className="p-3 text-foreground">{r.name}</td>
                  <td className="p-3 text-muted-foreground">{r.outlet}</td>
                  <td className="p-3">{r.portalOpens}</td>
                  <td className="p-3">{r.pageViews}</td>
                  <td className="p-3">{r.pdfOpens}</td>
                  <td className="p-3">{r.pdfPageViews}</td>
                  <td className="p-3 text-muted-foreground">
                    {r.lastEventAt ? new Date(r.lastEventAt).toLocaleString("hu-HU") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
