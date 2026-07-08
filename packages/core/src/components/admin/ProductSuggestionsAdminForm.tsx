"use client"

import * as React from "react"
import { Plus, Trash2, Save } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"
import type { ProductSuggestionSettings, SuggestionSource } from "@wse/core/lib/product-suggestion-settings-schema"
import { FixedProductsSourcePicker } from "@wse/core/components/admin/FixedProductsSourcePicker"

type CategoryOption = { id: string; name: string; depth: number }

const SOURCE_TYPES: SuggestionSource["type"][] = [
  "random_catalog",
  "random_price_range",
  "category",
  "fixed_products",
]

function emptySource(type: SuggestionSource["type"]): SuggestionSource {
  switch (type) {
    case "random_catalog":
      return { type: "random_catalog" }
    case "random_price_range":
      return { type: "random_price_range", minNet: 0, maxNet: 100000 }
    case "category":
      return { type: "category", categoryId: "" }
    case "fixed_products":
      return { type: "fixed_products", productIds: [] }
    default:
      return { type: "random_catalog" }
  }
}

export function ProductSuggestionsAdminForm({
  initial,
  categories,
}: {
  initial: ProductSuggestionSettings
  categories: CategoryOption[]
}) {
  const [settings, setSettings] = React.useState<ProductSuggestionSettings>(initial)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const updateSource = (index: number, next: SuggestionSource) => {
    setSettings((s) => {
      const sources = [...s.sources]
      sources[index] = next
      return { ...s, sources }
    })
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const sources = settings.sources.filter((src) => {
        if (src.type === "category") return Boolean(src.categoryId?.trim())
        if (src.type === "fixed_products") return src.productIds.length > 0
        return true
      })
      const payload = { ...settings, sources }
      const res = await fetch("/api/admin/shop/product-suggestions", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || err?.error || "Mentés sikertelen")
      }
      const data = await res.json()
      setSettings(data)
      setMessage("Elmentve.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10 max-w-3xl">
      <div className="flex items-center gap-3">
        <input
          id="ps-enabled"
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={settings.enabled}
          onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
        />
        <Label htmlFor="ps-enabled" className="text-white font-black uppercase tracking-widest text-xs cursor-pointer">
          Javaslatok bekapcsolva
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="ps-show-cart"
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={Boolean(settings.showCartLinesInModal)}
          disabled={!settings.enabled}
          onChange={(e) => setSettings((s) => ({ ...s, showCartLinesInModal: e.target.checked }))}
        />
        <Label
          htmlFor="ps-show-cart"
          className={cn(
            "font-black uppercase tracking-widest text-xs cursor-pointer",
            settings.enabled ? "text-white" : "text-neutral-600 cursor-not-allowed"
          )}
        >
          Kosár tételeinek megjelenítése a modálban (pénztár előtt)
        </Label>
      </div>

      <div className="space-y-2">
        <Label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Modál címe</Label>
        <Input
          value={settings.modalTitle ?? ""}
          onChange={(e) => setSettings((s) => ({ ...s, modalTitle: e.target.value }))}
          className="rounded-none border-white/10 bg-white/5 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Segéd szöveg</Label>
        <Input
          value={settings.modalHelper ?? ""}
          onChange={(e) => setSettings((s) => ({ ...s, modalHelper: e.target.value }))}
          className="rounded-none border-white/10 bg-white/5 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Max. javaslat (modálban)</Label>
        <Input
          type="number"
          min={1}
          max={24}
          value={settings.maxSuggestions}
          onChange={(e) =>
            setSettings((s) => ({ ...s, maxSuggestions: Math.min(24, Math.max(1, Number(e.target.value) || 1)) }))
          }
          className="rounded-none border-white/10 bg-white/5 text-white w-32"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-white font-black uppercase tracking-widest text-xs">Források (sorrendben egyesítve)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none border-white/10 text-white text-[10px] font-black uppercase"
            onClick={() =>
              setSettings((s) => ({
                ...s,
                sources: [...s.sources, emptySource("random_catalog")],
              }))
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Szabály
          </Button>
        </div>

        {settings.sources.length === 0 ? (
          <p className="text-sm text-neutral-500">Nincs szabály — a pénztár felé nem jelenik meg modál.</p>
        ) : (
          <ul className="space-y-6">
            {settings.sources.map((src, index) => (
              <li key={index} className="glass-card border-white/10 p-6 space-y-4">
                <div className="flex flex-wrap gap-3 items-end justify-between">
                  <div className="space-y-2 grow min-w-[200px]">
                    <Label className="text-neutral-500 text-[10px] font-black uppercase">Típus</Label>
                    <select
                      className="w-full h-10 px-3 rounded-none border border-white/10 bg-[#0A0A0B] text-white text-sm"
                      value={src.type}
                      onChange={(e) => {
                        const t = e.target.value as SuggestionSource["type"]
                        updateSource(index, emptySource(t))
                      }}
                    >
                      {SOURCE_TYPES.map((t) => (
                        <option key={t} value={t}>
                      {t === "random_catalog" && "Véletlen — a teljes bolt"}
                      {t === "random_price_range" && "Véletlen — nettó ár között"}
                      {t === "category" && "Egy kategória termékei"}
                      {t === "fixed_products" && "Kézzel kiválasztott termékek"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-rose-500 hover:bg-rose-500/10 shrink-0"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        sources: s.sources.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                {src.type === "random_catalog" && (
                  <div className="space-y-2">
                    <Label className="text-neutral-500 text-[10px] font-black uppercase">Darab ebből a szabályból (üres = automatikus arány)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      placeholder="auto"
                      value={src.take ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        updateSource(
                          index,
                          v === ""
                            ? { type: "random_catalog" }
                            : { type: "random_catalog", take: Math.min(50, Math.max(1, Number(v) || 1)) }
                        )
                      }}
                      className="rounded-none border-white/10 bg-white/5 text-white w-32"
                    />
                  </div>
                )}

                {src.type === "random_price_range" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-500 text-[10px] font-black uppercase">Min. nettó (Ft)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={src.minNet}
                        onChange={(e) =>
                          updateSource(index, {
                            ...src,
                            minNet: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="rounded-none border-white/10 bg-white/5 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-500 text-[10px] font-black uppercase">Max. nettó (Ft)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={src.maxNet}
                        onChange={(e) =>
                          updateSource(index, {
                            ...src,
                            maxNet: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="rounded-none border-white/10 bg-white/5 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-500 text-[10px] font-black uppercase">Darab (opcionális)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        placeholder="auto"
                        value={src.take ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          updateSource(
                            index,
                            v === ""
                              ? { type: "random_price_range", minNet: src.minNet, maxNet: src.maxNet }
                              : {
                                  type: "random_price_range",
                                  minNet: src.minNet,
                                  maxNet: src.maxNet,
                                  take: Math.min(50, Math.max(1, Number(v) || 1)),
                                }
                          )
                        }}
                        className="rounded-none border-white/10 bg-white/5 text-white"
                      />
                    </div>
                  </div>
                )}

                {src.type === "category" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-500 text-[10px] font-black uppercase">Kategória</Label>
                      <select
                        className="w-full h-10 px-3 rounded-none border border-white/10 bg-[#0A0A0B] text-white text-sm"
                        value={src.categoryId}
                        onChange={(e) => updateSource(index, { ...src, categoryId: e.target.value })}
                      >
                        <option value="">— válassz —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {"—".repeat(c.depth)} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-500 text-[10px] font-black uppercase">Darab (opcionális)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        placeholder="auto"
                        value={src.take ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          updateSource(
                            index,
                            v === ""
                              ? { type: "category", categoryId: src.categoryId }
                              : {
                                  type: "category",
                                  categoryId: src.categoryId,
                                  take: Math.min(50, Math.max(1, Number(v) || 1)),
                                }
                          )
                        }}
                        className="rounded-none border-white/10 bg-white/5 text-white"
                      />
                    </div>
                  </div>
                )}

                {src.type === "fixed_products" && (
                  <FixedProductsSourcePicker
                    productIds={src.productIds}
                    onChange={(ids) => updateSource(index, { type: "fixed_products", productIds: ids })}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="krausz"
          className="h-12 px-8 rounded-none font-black uppercase tracking-widest text-xs"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? <LoadingSpinner size="xs" className="mr-2 shrink-0" /> : <Save className="w-4 h-4 mr-2" />}
          Mentés
        </Button>
        {message ? <span className={cn("text-sm", message === "Elmentve." ? "text-emerald-400" : "text-rose-400")}>{message}</span> : null}
      </div>
    </div>
  )
}
