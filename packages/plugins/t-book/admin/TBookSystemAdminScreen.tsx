"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminDataTable } from "@wse/core/components/admin/AdminDataTable"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { tbookSystemApi } from "./org-api"
import { CurrencySelect } from "./CurrencySelect"
import { DEFAULT_TBOOK_CURRENCY, normalizeTBookCurrency, type TBookCurrencyCode } from "../lib/currency"

type OrgRow = {
  id: string
  name: string
  slug: string
  status: string
  stats: { groupCount: number; eventCount: number; bookingCount: number; memberCount: number }
}

export function TBookSystemAdminScreen() {
  const [organizations, setOrganizations] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [currency, setCurrency] = useState<TBookCurrencyCode>(DEFAULT_TBOOK_CURRENCY)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await tbookSystemApi.organizations()
      setOrganizations(res.organizations)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      await tbookSystemApi.createOrganization({
        name,
        ownerEmail: ownerEmail || undefined,
        currency,
      })
      setName("")
      setOwnerEmail("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <AdminPageScaffold
      title="Rendszer admin"
      description="Szervezetek létrehozása és kezelése a tBook platformon."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/org/select">Szervezet váltás</Link>
        </Button>
      }
    >
      <form onSubmit={(e) => void createOrg(e)} className="grid max-w-lg gap-4">
        <div className="grid gap-2">
          <Label htmlFor="org-name">Új szervezet neve</Label>
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="owner-email">Owner e-mail (opcionális)</Label>
          <Input
            id="owner-email"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="owner@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="org-currency">Pénznem</Label>
          <CurrencySelect
            id="org-currency"
            value={currency}
            onValueChange={(code) => setCurrency(normalizeTBookCurrency(code))}
          />
        </div>
        <Button type="submit" disabled={creating || !name.trim()}>
          <Plus className="size-4" />
          Szervezet létrehozása
        </Button>
      </form>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <AdminDataTable
        columns={[
          { id: "name", header: "Név", cell: (row) => row.name },
          { id: "slug", header: "Slug", cell: (row) => row.slug },
          { id: "status", header: "Státusz", cell: (row) => row.status },
          { id: "members", header: "Tagok", cell: (row) => String(row.stats.memberCount) },
          {
            id: "actions",
            header: "",
            cell: (row) => (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/system/organizations/${row.id}`}>Részletek</Link>
              </Button>
            ),
          },
        ]}
        rows={organizations}
        getRowKey={(row) => row.id}
        emptyMessage="Még nincs szervezet."
      />
    </AdminPageScaffold>
  )
}
