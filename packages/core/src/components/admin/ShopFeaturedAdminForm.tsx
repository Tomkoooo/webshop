"use client"

import * as React from "react"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import { cn } from "@wse/core/lib/utils"
import { adminInputClass } from "@wse/core/lib/admin-ui"
import { ProductPickerModal } from "@wse/core/features/homepage-cms/components/editor/ProductPickerModal"
import type { ShopFeaturedSettings } from "@wse/core/services/shop-featured-settings"
import type { FeaturedProductsMode } from "@wse/core/models/ShopFeaturedSetting"

export type ShopFeaturedAdminFormProps = {
  initial: ShopFeaturedSettings
  categories: Array<{ id: string; name: string }>
}

const MODES: { value: FeaturedProductsMode; label: string; hint: string }[] = [
  {
    value: "auto",
    label: "Automatikus",
    hint: "Legújabb látható termékek (alapértelmezett).",
  },
  {
    value: "manual",
    label: "Egyedi lista",
    hint: "Fix terméklista a megadott sorrendben (alsó index = előrébb).",
  },
  {
    value: "byCategory",
    label: "Kategória sorrend",
    hint: "Először B kategória termékei, utána A — kategórián belül a termék index vagy legújabb.",
  },
]

export function ShopFeaturedAdminForm({ initial, categories }: ShopFeaturedAdminFormProps) {
  const [mode, setMode] = React.useState<FeaturedProductsMode>(initial.mode)
  const [manualProductIds, setManualProductIds] = React.useState<string[]>(initial.manualProductIds)
  const [orderedCategoryIds, setOrderedCategoryIds] = React.useState<string[]>(initial.orderedCategoryIds)
  const [maxItems, setMaxItems] = React.useState(initial.maxItems)
  const [perCategoryLimit, setPerCategoryLimit] = React.useState(initial.perCategoryLimit)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const categoryById = React.useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  )

  const moveId = (ids: string[], index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= ids.length) return ids
    const copy = [...ids]
    ;[copy[index], copy[next]] = [copy[next], copy[index]]
    return copy
  }

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/shop/featured", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          manualProductIds,
          orderedCategoryIds,
          maxItems,
          perCategoryLimit,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data?.error || "Mentés sikertelen")
        return
      }
      setMode(data.mode)
      setManualProductIds(data.manualProductIds ?? [])
      setOrderedCategoryIds(data.orderedCategoryIds ?? [])
      setMaxItems(data.maxItems)
      setPerCategoryLimit(data.perCategoryLimit)
      setMessage("Elmentve.")
    } catch {
      setMessage("Hálózati hiba")
    } finally {
      setBusy(false)
    }
  }

  const addCategory = (id: string) => {
    if (!id || orderedCategoryIds.includes(id)) return
    setOrderedCategoryIds((prev) => [...prev, id])
  }

  return (
    <div className="max-w-3xl space-y-8">
      <AdminPanel title="Megjelenítési mód">
        <div className="space-y-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg px-4 py-3 transition-colors",
                mode === m.value ? "bg-muted shadow-sm ring-1 ring-primary/30" : "hover:bg-muted/50"
              )}
            >
              <input
                type="radio"
                name="featured-mode"
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
                className="mt-1"
              />
              <span>
                <span className="text-sm font-medium">{m.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </AdminPanel>

      <div className="grid gap-6 sm:grid-cols-2">
        <AdminFormField label="Max. termék a főoldalon">
          <Input
            id="max-items"
            type="number"
            min={1}
            max={48}
            value={maxItems}
            onChange={(e) => setMaxItems(Math.min(48, Math.max(1, Number(e.target.value) || 1)))}
            className={adminInputClass}
          />
        </AdminFormField>
        {mode === "byCategory" ? (
          <AdminFormField label="Max. / kategória (0 = nincs külön limit)">
            <Input
              id="per-cat"
              type="number"
              min={0}
              max={48}
              value={perCategoryLimit}
              onChange={(e) => setPerCategoryLimit(Math.max(0, Number(e.target.value) || 0))}
              className={adminInputClass}
            />
          </AdminFormField>
        ) : null}
      </div>

      {mode === "manual" ? (
        <AdminPanel
          title="Terméklista (sorrend)"
          description="A fenti lista sorrendje = megjelenítési sorrend. Terméknél a „Kiemelt lista index” tovább finomítható kategória módban."
        >
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
            Termékek kiválasztása
          </Button>
          <Card>
            <CardContent className="p-3">
              <ol className="space-y-1 font-mono text-xs">
                {manualProductIds.length === 0 ? (
                  <li className="text-muted-foreground">Nincs kiválasztott termék</li>
                ) : (
                  manualProductIds.map((id, index) => (
                    <li key={id} className="flex items-center justify-between gap-2 text-foreground">
                      <span>
                        {index + 1}. {id}
                      </span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-md px-2 py-0.5 hover:bg-muted"
                          onClick={() => setManualProductIds((prev) => moveId(prev, index, -1))}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="rounded-md px-2 py-0.5 hover:bg-muted"
                          onClick={() => setManualProductIds((prev) => moveId(prev, index, 1))}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="rounded-md px-2 py-0.5 text-rose-600 hover:bg-rose-500/10"
                          onClick={() => setManualProductIds((prev) => prev.filter((x) => x !== id))}
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </CardContent>
          </Card>
        </AdminPanel>
      ) : null}

      {mode === "byCategory" ? (
        <AdminPanel title="Kategória sorrend" description="Pl. B előbb, mint A">
          <select
            className={cn(adminInputClass, "h-10 min-w-[200px]")}
            defaultValue=""
            onChange={(e) => {
              addCategory(e.target.value)
              e.target.value = ""
            }}
          >
            <option value="">Kategória hozzáadása…</option>
            {categories
              .filter((c) => !orderedCategoryIds.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <Card>
            <CardContent className="p-3">
              <ol className="space-y-1 text-sm">
                {orderedCategoryIds.length === 0 ? (
                  <li className="text-muted-foreground">Adj hozzá kategóriákat a sorrendhez.</li>
                ) : (
                  orderedCategoryIds.map((id, index) => (
                    <li key={id} className="flex items-center justify-between gap-2">
                      <span>
                        {index + 1}. {categoryById.get(id) ?? id}
                      </span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-md px-2 py-0.5 text-xs hover:bg-muted"
                          onClick={() => setOrderedCategoryIds((prev) => moveId(prev, index, -1))}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="rounded-md px-2 py-0.5 text-xs hover:bg-muted"
                          onClick={() => setOrderedCategoryIds((prev) => moveId(prev, index, 1))}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="rounded-md px-2 py-0.5 text-xs text-rose-600"
                          onClick={() => setOrderedCategoryIds((prev) => prev.filter((x) => x !== id))}
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </CardContent>
          </Card>
        </AdminPanel>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" disabled={busy} onClick={() => void save()}>
          Mentés
        </Button>
        {message ? <span className="text-sm text-foreground">{message}</span> : null}
      </div>

      <ProductPickerModal
        open={pickerOpen}
        selected={manualProductIds}
        onClose={() => setPickerOpen(false)}
        onApply={setManualProductIds}
      />
    </div>
  )
}
