"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import type { HouseRulesContent } from "./schema"
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

export function HouseRulesEditorPanel({ content, onSave }: EditorProps<HouseRulesContent>) {
  const [draft, setDraft] = useState<HouseRulesContent>(() => ({
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
      toast.success("Házirend mentve")
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
        <h3 className="text-lg font-semibold">Tartalom</h3>
        <div className="space-y-2">
          <Label>Cím</Label>
          <RichTextEditor
            value={draft.title || "<p></p>"}
            onChange={(html) => setDraft((d) => ({ ...d, title: html }))}
            editorClassName="min-h-[72px] !p-3"
          />
        </div>
        <div className="space-y-2">
          <Label>Alcím</Label>
          <RichTextEditor
            value={draft.subtitle || "<p></p>"}
            onChange={(html) => setDraft((d) => ({ ...d, subtitle: html }))}
            editorClassName="min-h-[96px] !p-3"
          />
        </div>
        <div className="space-y-2">
          <Label>Házirend szövege</Label>
          <RichTextEditor
            value={draft.body || "<p></p>"}
            onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
            editorClassName="min-h-[280px]"
          />
          <p className="text-xs text-muted-foreground">
            Szerkeszthető a vásznon is: <strong>/admin/cms/hazirend</strong>
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
          {saving ? "Mentés…" : "Mentés"}
        </Button>
      </div>
    </div>
  )
}
