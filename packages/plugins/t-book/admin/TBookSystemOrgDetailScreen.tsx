"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminBackLink } from "@wse/core/components/admin/AdminBackLink"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wse/core/components/ui/select"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { tbookSystemApi } from "./org-api"
import { CurrencySelect } from "./CurrencySelect"
import { DEFAULT_TBOOK_CURRENCY, normalizeTBookCurrency, type TBookCurrencyCode } from "../lib/currency"

export function TBookSystemOrgDetailScreen({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [status, setStatus] = useState("active")
  const [currency, setCurrency] = useState<TBookCurrencyCode>(DEFAULT_TBOOK_CURRENCY)
  const [ownerEmail, setOwnerEmail] = useState("")
  const [stats, setStats] = useState<Record<string, number>>({})

  async function load() {
    setLoading(true)
    try {
      const res = await tbookSystemApi.organization(orgId)
      setName(res.organization.name)
      setStatus(res.organization.status)
      setCurrency(normalizeTBookCurrency(res.organization.settings?.currency))
      setStats(res.stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [orgId])

  async function save() {
    try {
      await tbookSystemApi.updateOrganization(orgId, {
        name,
        status: status as "active" | "suspended",
        currency,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    }
  }

  async function assignOwner() {
    if (!ownerEmail.trim()) return
    try {
      await tbookSystemApi.assignOwner(orgId, ownerEmail.trim())
      setOwnerEmail("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
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
      title="Szervezet részletei"
      description="Státusz, owner hozzárendelés és használati statisztikák."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/system">Vissza</Link>
        </Button>
      }
    >
      <AdminBackLink href="/admin/system">Rendszer admin</AdminBackLink>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="grid max-w-lg gap-4">
        <div className="grid gap-2">
          <Label htmlFor="org-name">Név</Label>
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Státusz</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktív</SelectItem>
              <SelectItem value="suspended">Felfüggesztve</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="org-currency">Pénznem (díjak, árak)</Label>
          <CurrencySelect
            id="org-currency"
            value={currency}
            onValueChange={(code) => setCurrency(normalizeTBookCurrency(code))}
          />
        </div>
        <Button type="button" onClick={() => void save()}>
          Mentés
        </Button>
      </div>

      <div className="text-muted-foreground grid gap-1 text-sm">
        <p>Csoportok: {stats.groupCount ?? 0}</p>
        <p>Események: {stats.eventCount ?? 0}</p>
        <p>Foglalások: {stats.bookingCount ?? 0}</p>
        <p>Tagok: {stats.memberCount ?? 0}</p>
      </div>

      <div className="grid max-w-lg gap-2">
        <Label htmlFor="owner-email">Owner hozzáadása e-mail alapján</Label>
        <div className="flex gap-2">
          <Input
            id="owner-email"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={() => void assignOwner()}>
            Hozzáadás
          </Button>
        </div>
      </div>
    </AdminPageScaffold>
  )
}
