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
      toast.success("Important information saved")
    } catch (error) {
      console.error(error)
      toast.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Page content</h3>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <textarea
            className="min-h-20 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            value={draft.subtitle}
            onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Rules / content</Label>
          <RichTextEditor
            value={draft.body || "<p></p>"}
            onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
            editorClassName="min-h-[280px]"
          />
          <p className="text-xs text-muted-foreground">
            In the visual CMS (
            <strong>/admin/cms/fontos-informaciok</strong>
            ) the title, subtitle, and rich text can also be edited on the page.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">SEO</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>SEO title</Label>
            <Input
              value={draft.meta.seoTitle}
              onChange={(e) =>
                setDraft((d) => ({ ...d, meta: { ...d.meta, seoTitle: e.target.value } }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>SEO description</Label>
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
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  )
}
