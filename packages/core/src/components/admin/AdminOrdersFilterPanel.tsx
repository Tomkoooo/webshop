"use client"

import { useState } from "react"
import { ChevronDown, Filter, Layers, RotateCcw, Search, X } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@wse/core/components/ui/collapsible"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  countAdvancedOrderFilters,
  hasAdvancedOrderFilters,
} from "@wse/core/lib/admin-orders-filter-ui"
import type { AdminOrderFilters } from "@wse/core/lib/admin-orders-filters"
import { adminFieldLabel, adminInputClass } from "@wse/core/lib/admin-ui"
import { WORKSPACE_SORT_OPTIONS } from "@wse/core/lib/admin-orders-workspace"
import { cn } from "@wse/core/lib/utils"

type Props = {
  draft: AdminOrderFilters
  setDraft: React.Dispatch<React.SetStateAction<AdminOrderFilters>>
  appliedFilters: AdminOrderFilters
  products: { id: string; name: string }[]
  onApply: () => void
  onReset: () => void
  isNavigating: boolean
}

function NumberRange({
  label,
  minKey,
  maxKey,
  draft,
  set,
  step,
}: {
  label: string
  minKey: keyof AdminOrderFilters
  maxKey: keyof AdminOrderFilters
  draft: AdminOrderFilters
  set: (key: keyof AdminOrderFilters, value: string) => void
  step?: number
}) {
  return (
    <div>
      <label className={adminFieldLabel}>{label}</label>
      <div className="mt-1.5 flex items-center gap-1">
        <input
          type="number"
          min={0}
          step={step}
          value={(draft[minKey] as string) || ""}
          onChange={(e) => set(minKey, e.target.value)}
          placeholder="Min"
          className={cn(adminInputClass, "px-2 text-center")}
        />
        <span className="text-muted-foreground text-xs">–</span>
        <input
          type="number"
          min={0}
          step={step}
          value={(draft[maxKey] as string) || ""}
          onChange={(e) => set(maxKey, e.target.value)}
          placeholder="Max"
          className={cn(adminInputClass, "px-2 text-center")}
        />
      </div>
    </div>
  )
}

export function AdminOrdersFilterPanel({
  draft,
  setDraft,
  appliedFilters,
  products,
  onApply,
  onReset,
  isNavigating,
}: Props) {
  const set = (key: keyof AdminOrderFilters, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const [advancedOpen, setAdvancedOpen] = useState(() => hasAdvancedOrderFilters(appliedFilters))
  const advancedCount = countAdvancedOrderFilters(draft)

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onApply()
        }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Szűrés</CardTitle>
          <CardDescription>
            Keresés név, e-mail vagy rendelésszám alapján. A gyakori szűrők itt vannak; a ritkább mezők a
            részletes blokkban.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              value={draft.q || ""}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Keresés rendelésben…"
              className={cn(adminInputClass, "h-10 pl-9")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={adminFieldLabel}>Lista</label>
              <select
                value={draft.deletedFilter === "deleted" ? "deleted" : "active"}
                onChange={(e) => {
                  const next = e.target.value
                  setDraft((d) => ({
                    ...d,
                    deletedFilter: next === "deleted" ? "deleted" : undefined,
                    status: next === "deleted" ? "cancelled" : d.status === "cancelled" ? "all" : d.status,
                    mix: next === "deleted" ? undefined : d.mix,
                  }))
                }}
                className={adminInputClass}
              >
                <option value="active">Aktív rendelések</option>
                <option value="deleted">Töröltek</option>
              </select>
            </div>
            <div>
              <label className={adminFieldLabel}>Státusz</label>
              <select
                value={draft.deletedFilter === "deleted" ? "cancelled" : draft.status || "all"}
                onChange={(e) => set("status", e.target.value)}
                disabled={draft.deletedFilter === "deleted"}
                className={adminInputClass}
              >
                {draft.deletedFilter === "deleted" ? (
                  <option value="cancelled">Törölve</option>
                ) : (
                  <>
                    <option value="all">Minden státusz</option>
                    {ADMIN_ORDER_STATUS_OPTIONS.filter((s) => s.value !== "cancelled").map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className={adminFieldLabel}>Szállítás</label>
              <select
                value={draft.shippingType || "all"}
                onChange={(e) => set("shippingType", e.target.value)}
                className={adminInputClass}
              >
                <option value="all">Minden mód</option>
                <option value="gls">GLS csomagpont</option>
                <option value="foxpost">Foxpost</option>
                <option value="standard">Házhozszállítás</option>
              </select>
            </div>
            <div>
              <label className={adminFieldLabel}>Termék</label>
              <select
                value={draft.productId || "all"}
                onChange={(e) => set("productId", e.target.value)}
                className={adminInputClass}
              >
                <option value="all">Bármely termék</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={adminFieldLabel}>Rendelés dátuma – tól</label>
              <input
                type="date"
                value={draft.dateFrom || ""}
                onChange={(e) => set("dateFrom", e.target.value)}
                className={adminInputClass}
              />
            </div>
            <div>
              <label className={adminFieldLabel}>Rendelés dátuma – ig</label>
              <input
                type="date"
                value={draft.dateTo || ""}
                onChange={(e) => set("dateTo", e.target.value)}
                className={adminInputClass}
              />
            </div>
            <div>
              <label className={adminFieldLabel}>Rendezés</label>
              <select
                value={draft.sort || "newest"}
                onChange={(e) => set("sort", e.target.value)}
                className={adminInputClass}
              >
                {WORKSPACE_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="gap-2 px-0 hover:bg-transparent">
                <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
                Részletes szűrők
                {advancedCount > 0 ? (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    {advancedCount}
                  </span>
                ) : null}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={adminFieldLabel}>Címke állapot</label>
                  <select
                    value={draft.labelState || "all"}
                    onChange={(e) => set("labelState", e.target.value)}
                    className={adminInputClass}
                  >
                    <option value="all">Mindegy</option>
                    <option value="needs">Hiányzik</option>
                    <option value="generating">Generálás alatt</option>
                    <option value="error">Hiba</option>
                    <option value="has">Kész</option>
                    <option value="none">Nem csomagküldés</option>
                  </select>
                </div>
                <div>
                  <label className={adminFieldLabel}>Számla állapot</label>
                  <select
                    value={draft.invoiceStatus || "all"}
                    onChange={(e) => set("invoiceStatus", e.target.value)}
                    className={adminInputClass}
                  >
                    <option value="all">Mindegy</option>
                    <option value="pending">Függőben</option>
                    <option value="issued">Kiállítva</option>
                    <option value="failed">Sikertelen</option>
                    <option value="manual">Manuális</option>
                  </select>
                </div>
                <div>
                  <label className={adminFieldLabel}>Vásárló típus</label>
                  <select
                    value={draft.billingType || "all"}
                    onChange={(e) => set("billingType", e.target.value)}
                    className={adminInputClass}
                  >
                    <option value="all">Mindegy</option>
                    <option value="personal">Magánszemély</option>
                    <option value="company">Cég</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <NumberRange label="Darabszám (db)" minKey="unitsMin" maxKey="unitsMax" draft={draft} set={set} />
                <NumberRange label="Tételféle" minKey="kindsMin" maxKey="kindsMax" draft={draft} set={set} />
                <NumberRange
                  label="Összeg (Ft)"
                  minKey="totalMin"
                  maxKey="totalMax"
                  draft={draft}
                  set={set}
                  step={1000}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={adminFieldLabel}>Utoljára módosítva – tól</label>
                  <input
                    type="date"
                    value={draft.updatedFrom || ""}
                    onChange={(e) => set("updatedFrom", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
                <div>
                  <label className={adminFieldLabel}>Utoljára módosítva – ig</label>
                  <input
                    type="date"
                    value={draft.updatedTo || ""}
                    onChange={(e) => set("updatedTo", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
                <div>
                  <label className={adminFieldLabel}>Státusz váltás napja</label>
                  <input
                    type="date"
                    value={draft.statusChangedOn || ""}
                    onChange={(e) => set("statusChangedOn", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
                <div>
                  <label className={adminFieldLabel}>Státusz váltás – tól</label>
                  <input
                    type="date"
                    value={draft.statusChangedFrom || ""}
                    onChange={(e) => set("statusChangedFrom", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
                <div>
                  <label className={adminFieldLabel}>Státusz váltás – ig</label>
                  <input
                    type="date"
                    value={draft.statusChangedTo || ""}
                    onChange={(e) => set("statusChangedTo", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={adminFieldLabel}>Foxpost címke – nap</label>
                  <input
                    type="date"
                    value={draft.foxpostLabelOn || ""}
                    onChange={(e) => set("foxpostLabelOn", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
                <div>
                  <label className={adminFieldLabel}>Foxpost címke – tól</label>
                  <input
                    type="date"
                    value={draft.foxpostLabelFrom || ""}
                    onChange={(e) => set("foxpostLabelFrom", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
                <div>
                  <label className={adminFieldLabel}>Foxpost címke – ig</label>
                  <input
                    type="date"
                    value={draft.foxpostLabelTo || ""}
                    onChange={(e) => set("foxpostLabelTo", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
                <div>
                  <label className={adminFieldLabel}>GLS címke – nap</label>
                  <input
                    type="date"
                    value={draft.glsLabelOn || ""}
                    onChange={(e) => set("glsLabelOn", e.target.value)}
                    className={adminInputClass}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button type="submit" disabled={isNavigating}>
              {isNavigating ? <LoadingSpinner size="xs" className="mr-2" /> : <Filter className="mr-2 size-4" />}
              Szűrés alkalmazása
            </Button>
            <Button type="button" variant="outline" onClick={onReset} disabled={isNavigating}>
              <RotateCcw className="mr-2 size-4" />
              Alaphelyzet
            </Button>
            {draft.mix ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary">
                <Layers className="size-3.5" />
                Kosár-mix szűrő aktív
                <button type="button" onClick={() => set("mix", "")} aria-label="Mix szűrő törlése">
                  <X className="size-3.5" />
                </button>
              </span>
            ) : null}
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
