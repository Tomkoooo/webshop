"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import type { ImportantInfoContent } from "./schema"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"
import { toast } from "sonner"

function asRichHtml(value: string | undefined): string {
  const trimmed = (value || "").trim()
  if (!trimmed) return "<p></p>"
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed
  return `<p>${trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</p>`
}

export function ImportantInfoEditorPanel({
  content,
  onSave,
}: EditorProps<ImportantInfoContent>) {
  const [draft, setDraft] = useState<ImportantInfoContent>(() => ({
    ...content,
    title: asRichHtml(content.title),
    subtitle: asRichHtml(content.subtitle),
    body: asRichHtml(content.body),
  }))
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
          <RichTextEditor
            value={draft.title || "<p></p>"}
            onChange={(html) => setDraft((d) => ({ ...d, title: html }))}
            editorClassName="min-h-[72px] !p-3"
          />
          <p className="text-xs text-muted-foreground">
            Use color and bold for the header. Inline colors override the default heading style.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <RichTextEditor
            value={draft.subtitle || "<p></p>"}
            onChange={(html) => setDraft((d) => ({ ...d, subtitle: html }))}
            editorClassName="min-h-[96px] !p-3"
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
            Enter creates a new paragraph; Shift+Enter inserts a line break. Pasted text keeps line
            breaks. You can also edit on the page at{" "}
            <strong>/admin/cms/fontos-informaciok</strong>.
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
