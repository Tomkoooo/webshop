"use client"

import * as React from "react"
import { Plus, Trash2, Save } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { cn } from "@wse/core/lib/utils"
import { adminFieldLabel, adminInputClass } from "@wse/core/lib/admin-ui"
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
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <input
          id="ps-enabled"
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={settings.enabled}
          onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
        />
        <Label htmlFor="ps-enabled" className={cn(adminFieldLabel, "cursor-pointer")}>
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
            adminFieldLabel,
            "cursor-pointer",
            !settings.enabled && "cursor-not-allowed text-muted-foreground"
          )}
        >
          Kosár tételeinek megjelenítése a modálban (pénztár előtt)
        </Label>
      </div>

      <AdminFormField label="Modál címe">
        <Input
          value={settings.modalTitle ?? ""}
          onChange={(e) => setSettings((s) => ({ ...s, modalTitle: e.target.value }))}
          className={adminInputClass}
        />
      </AdminFormField>

      <AdminFormField label="Segéd szöveg">
        <Input
          value={settings.modalHelper ?? ""}
          onChange={(e) => setSettings((s) => ({ ...s, modalHelper: e.target.value }))}
          className={adminInputClass}
        />
      </AdminFormField>

      <AdminFormField label="Max. javaslat (modálban)">
        <Input
          type="number"
          min={1}
          max={24}
          value={settings.maxSuggestions}
          onChange={(e) =>
            setSettings((s) => ({ ...s, maxSuggestions: Math.min(24, Math.max(1, Number(e.target.value) || 1)) }))
          }
          className={cn(adminInputClass, "w-32")}
        />
      </AdminFormField>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className={adminFieldLabel}>Források (sorrendben egyesítve)</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSettings((s) => ({
                ...s,
                sources: [...s.sources, emptySource("random_catalog")],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Szabály
          </Button>
        </div>

        {settings.sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nincs szabály — a pénztár felé nem jelenik meg modál.</p>
        ) : (
          <ul className="space-y-4">
            {settings.sources.map((src, index) => (
              <li key={index}>
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <AdminFormField label="Típus" className="min-w-[200px] grow">
                        <select
                          className={adminInputClass}
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
                      </AdminFormField>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-rose-500 hover:bg-rose-500/10"
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            sources: s.sources.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {src.type === "random_catalog" && (
                      <AdminFormField
                        label="Darab ebből a szabályból"
                        hint="Üres = automatikus arány"
                      >
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
                          className={cn(adminInputClass, "w-32")}
                        />
                      </AdminFormField>
                    )}

                    {src.type === "random_price_range" && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <AdminFormField label="Min. nettó (Ft)">
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
                            className={adminInputClass}
                          />
                        </AdminFormField>
                        <AdminFormField label="Max. nettó (Ft)">
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
                            className={adminInputClass}
                          />
                        </AdminFormField>
                        <AdminFormField label="Darab (opcionális)">
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
                            className={adminInputClass}
                          />
                        </AdminFormField>
                      </div>
                    )}

                    {src.type === "category" && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AdminFormField label="Kategória">
                          <select
                            className={adminInputClass}
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
                        </AdminFormField>
                        <AdminFormField label="Darab (opcionális)">
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
                            className={adminInputClass}
                          />
                        </AdminFormField>
                      </div>
                    )}

                    {src.type === "fixed_products" && (
                      <FixedProductsSourcePicker
                        productIds={src.productIds}
                        onChange={(ids) => updateSource(index, { type: "fixed_products", productIds: ids })}
                      />
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? <LoadingSpinner size="xs" className="mr-2 shrink-0" /> : <Save className="mr-2 h-4 w-4" />}
          Mentés
        </Button>
        {message ? (
          <span className={cn("text-sm", message === "Elmentve." ? "text-emerald-800" : "text-rose-600")}>
            {message}
          </span>
        ) : null}
      </div>
    </div>
  )
}
