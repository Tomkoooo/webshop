"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { toast } from "sonner"
import type { EsPageContent } from "./schema"

export function EsPageEditorPanel({ content, onSave }: EditorProps<EsPageContent>) {
  const [draft, setDraft] = useState(content)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success("Page saved")
    } catch (error) {
      console.error(error)
      toast.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (idx: number, key: "heading" | "body" | "image", value: string) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    }))

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Header</h3>
        <Label>Title</Label>
        <Input
          value={draft.hero.title}
          onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, title: e.target.value } }))}
        />
        <Label>Subtitle</Label>
        <textarea
          className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={draft.hero.subtitle}
          onChange={(e) =>
            setDraft((d) => ({ ...d, hero: { ...d.hero, subtitle: e.target.value } }))
          }
        />
      </section>
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Sections</h3>
        {draft.sections.map((section, idx) => (
          <div key={idx} className="space-y-2 rounded-md border border-border p-4">
            <Input
              placeholder="Heading"
              value={section.heading}
              onChange={(e) => updateSection(idx, "heading", e.target.value)}
            />
            <textarea
              className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={section.body}
              onChange={(e) => updateSection(idx, "body", e.target.value)}
            />
          </div>
        ))}
      </section>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  )
}
