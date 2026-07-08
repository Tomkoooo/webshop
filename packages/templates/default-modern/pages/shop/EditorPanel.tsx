"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import type { ShopContent } from "./schema"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { toast } from "sonner"

export function ShopEditorPanel({ content, onSave }: EditorProps<ShopContent>) {
  const [draft, setDraft] = useState<ShopContent>(content)
  const [saving, setSaving] = useState(false)

  const update = <K extends keyof ShopContent>(key: K, value: ShopContent[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success("Bolt oldal mentve")
    } catch (error) {
      toast.error("Mentés sikertelen")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Cím</Label>
        <Input
          value={draft.heading}
          onChange={(e) => update("heading", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Alcím</Label>
        <textarea
          className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm min-h-20"
          value={draft.subheading}
          onChange={(e) => update("subheading", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Szűrők elhelyezése</Label>
          <select
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
            value={draft.filtersPosition}
            onChange={(e) =>
              update("filtersPosition", e.target.value as ShopContent["filtersPosition"])
            }
          >
            <option value="sidebar">Oldalt</option>
            <option value="top">Felül</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Termék rács oszlopok</Label>
          <select
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
            value={String(draft.productGridColumns)}
            onChange={(e) =>
              update("productGridColumns", Number(e.target.value) as ShopContent["productGridColumns"])
            }
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Üres állapot üzenet</Label>
        <Input
          value={draft.emptyStateMessage}
          onChange={(e) => update("emptyStateMessage", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Oldalanként megjelenített termékek</Label>
        <Input
          type="number"
          min={4}
          max={48}
          value={draft.pageSize}
          onChange={(e) => update("pageSize", Number(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SEO cím</Label>
          <Input
            value={draft.meta.seoTitle}
            onChange={(e) =>
              update("meta", { ...draft.meta, seoTitle: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>SEO leírás</Label>
          <Input
            value={draft.meta.seoDescription}
            onChange={(e) =>
              update("meta", { ...draft.meta, seoDescription: e.target.value })
            }
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Mentés..." : "Mentés"}
        </Button>
      </div>
    </div>
  )
}
