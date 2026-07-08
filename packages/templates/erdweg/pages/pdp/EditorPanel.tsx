"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import type { PdpContent } from "./schema"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { toast } from "sonner"

export function PdpEditorPanel({ content, onSave }: EditorProps<PdpContent>) {
  const [draft, setDraft] = useState<PdpContent>(content)
  const [saving, setSaving] = useState(false)

  const update = <K extends keyof PdpContent>(key: K, value: PdpContent[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success("Termékoldal beállítások mentve")
    } catch (error) {
      toast.error("Mentés sikertelen")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kosárba gomb felirata</Label>
          <Input
            value={draft.ctaLabel}
            onChange={(e) => update("ctaLabel", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Elfogyott felirat</Label>
          <Input
            value={draft.outOfStockLabel}
            onChange={(e) => update("outOfStockLabel", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Galéria stílusa</Label>
        <select
          className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
          value={draft.galleryStyle}
          onChange={(e) =>
            update("galleryStyle", e.target.value as PdpContent["galleryStyle"])
          }
        >
          <option value="thumbs">Bélyegképek</option>
          <option value="carousel">Karusszel</option>
        </select>
      </div>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={draft.showRelatedProducts}
          onChange={(e) => update("showRelatedProducts", e.target.checked)}
        />
        <span className="text-sm">Kapcsolódó termékek megjelenítése</span>
      </label>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={draft.showRecentlyViewed}
          onChange={(e) => update("showRecentlyViewed", e.target.checked)}
        />
        <span className="text-sm">Nemrég megtekintett termékek</span>
      </label>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Mentés..." : "Mentés"}
        </Button>
      </div>
    </div>
  )
}
