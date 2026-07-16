"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import type { ImportantInfoContent } from "./schema"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"
import { toast } from "sonner"

export function ImportantInfoEditorPanel({
  content,
  onSave,
}: EditorProps<ImportantInfoContent>) {
  const [draft, setDraft] = useState<ImportantInfoContent>(content)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success("Fontos információk mentve")
    } catch (error) {
      console.error(error)
      toast.error("Mentés sikertelen")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Oldal szövege</h3>
        <div className="space-y-2">
          <Label>Cím</Label>
          <Input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Alcím</Label>
          <textarea
            className="min-h-20 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            value={draft.subtitle}
            onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Szabályok / tartalom</Label>
          <RichTextEditor
            value={draft.body || "<p></p>"}
            onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
            editorClassName="min-h-[280px]"
          />
          <p className="text-xs text-muted-foreground">
            A vizuális CMS-ben (
            <strong>/admin/cms/fontos-informaciok</strong>
            ) a cím, alcím és a rich text a felületen is szerkeszthető.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">SEO</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>SEO cím</Label>
            <Input
              value={draft.meta.seoTitle}
              onChange={(e) =>
                setDraft((d) => ({ ...d, meta: { ...d.meta, seoTitle: e.target.value } }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>SEO leírás</Label>
            <Input
              value={draft.meta.seoDescription}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  meta: { ...d.meta, seoDescription: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !onSave}>
          {saving ? "Mentés..." : "Mentés"}
        </Button>
      </div>
    </div>
  )
}
