"use client"

import * as React from "react"
import { Button } from "@wse/core/components/ui/button"
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"
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
    <div className="max-w-3xl space-y-10 rounded-none border border-white/10 bg-white/[0.03] p-8 text-white">
      <section className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">Megjelenítési mód</p>
        <div className="space-y-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={cn(
                "flex cursor-pointer gap-3 border px-4 py-3 transition-colors",
                mode === m.value ? "border-white/40 bg-white/10" : "border-white/15 hover:border-white/25"
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
                <span className="text-sm font-bold uppercase tracking-wider">{m.label}</span>
                <span className="mt-1 block text-xs text-neutral-400">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="max-items" className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
            Max. termék a főoldalon
          </Label>
          <input
            id="max-items"
            type="number"
            min={1}
            max={48}
            value={maxItems}
            onChange={(e) => setMaxItems(Math.min(48, Math.max(1, Number(e.target.value) || 1)))}
            className="h-10 w-full border border-white/15 bg-black/40 px-3 font-mono text-sm"
          />
        </div>
        {mode === "byCategory" ? (
          <div className="space-y-2">
            <Label htmlFor="per-cat" className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
              Max. / kategória (0 = nincs külön limit)
            </Label>
            <input
              id="per-cat"
              type="number"
              min={0}
              max={48}
              value={perCategoryLimit}
              onChange={(e) => setPerCategoryLimit(Math.max(0, Number(e.target.value) || 0))}
              className="h-10 w-full border border-white/15 bg-black/40 px-3 font-mono text-sm"
            />
          </div>
        ) : null}
      </section>

      {mode === "manual" ? (
        <section className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">Terméklista (sorrend)</p>
          <p className="text-sm text-neutral-400">
            A fenti lista sorrendje = megjelenítési sorrend. Terméknél a „Kiemelt lista index” tovább finomítható
            kategória módban.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="rounded-none border-white/20 font-black uppercase tracking-widest"
          >
            Termékek kiválasztása
          </Button>
          <ol className="space-y-1 border border-white/10 p-3 font-mono text-xs">
            {manualProductIds.length === 0 ? (
              <li className="text-neutral-500">Nincs kiválasztott termék</li>
            ) : (
              manualProductIds.map((id, index) => (
                <li key={id} className="flex items-center justify-between gap-2 text-neutral-300">
                  <span>
                    {index + 1}. {id}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className="border border-white/20 px-2 py-0.5 hover:bg-white/10"
                      onClick={() => setManualProductIds((prev) => moveId(prev, index, -1))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="border border-white/20 px-2 py-0.5 hover:bg-white/10"
                      onClick={() => setManualProductIds((prev) => moveId(prev, index, 1))}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="border border-red-500/40 px-2 py-0.5 text-red-300 hover:bg-red-500/10"
                      onClick={() => setManualProductIds((prev) => prev.filter((x) => x !== id))}
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))
            )}
          </ol>
        </section>
      ) : null}

      {mode === "byCategory" ? (
        <section className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
            Kategória sorrend (pl. B előbb, mint A)
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 min-w-[200px] border border-white/15 bg-black/40 px-3 text-sm"
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
          </div>
          <ol className="space-y-1 border border-white/10 p-3 text-sm">
            {orderedCategoryIds.length === 0 ? (
              <li className="text-neutral-500">Adj hozzá kategóriákat a sorrendhez.</li>
            ) : (
              orderedCategoryIds.map((id, index) => (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span>
                    {index + 1}. {categoryById.get(id) ?? id}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className="border border-white/20 px-2 py-0.5 text-xs hover:bg-white/10"
                      onClick={() => setOrderedCategoryIds((prev) => moveId(prev, index, -1))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="border border-white/20 px-2 py-0.5 text-xs hover:bg-white/10"
                      onClick={() => setOrderedCategoryIds((prev) => moveId(prev, index, 1))}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="border border-red-500/40 px-2 py-0.5 text-xs text-red-300"
                      onClick={() => setOrderedCategoryIds((prev) => prev.filter((x) => x !== id))}
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))
            )}
          </ol>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-none bg-primary font-black uppercase tracking-widest"
        >
          Mentés
        </Button>
        {message ? <span className="text-sm text-neutral-300">{message}</span> : null}
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
