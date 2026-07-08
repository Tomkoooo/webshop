"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { toast } from "sonner"
import type { SakkmedPageContent } from "./schema"

export function SakkmedPageEditorPanel({ content, onSave }: EditorProps<SakkmedPageContent>) {
  const [draft, setDraft] = useState(content)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success("Oldal mentve")
    } catch (error) {
      console.error(error)
      toast.error("Mentés sikertelen")
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (idx: number, key: "heading" | "body" | "image", value: string) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    }))

  const addSection = () =>
    setDraft((d) => ({ ...d, sections: [...d.sections, { heading: "", body: "", image: "" }] }))

  const removeSection = (idx: number) =>
    setDraft((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== idx) }))

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Fejléc</h3>
        <Label>Cím</Label>
        <Input
          value={draft.hero.title}
          onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, title: e.target.value } }))}
        />
        <Label>Alcím</Label>
        <textarea
          className="min-h-20 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
          value={draft.hero.subtitle}
          onChange={(e) =>
            setDraft((d) => ({ ...d, hero: { ...d.hero, subtitle: e.target.value } }))
          }
        />
        <Label>Fejléc kép URL</Label>
        <Input
          value={draft.hero.image}
          onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, image: e.target.value } }))}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Szöveges szekciók</h3>
          <Button size="sm" variant="outline" onClick={addSection}>
            Új szekció
          </Button>
        </div>
        {draft.sections.map((section, idx) => (
          <div key={idx} className="space-y-2 rounded-md border border-white/10 p-4">
            <div className="flex justify-between">
              <span className="text-xs uppercase text-muted-foreground">Szekció #{idx + 1}</span>
              <Button size="sm" variant="ghost" onClick={() => removeSection(idx)}>
                Törlés
              </Button>
            </div>
            <Input
              placeholder="Cím"
              value={section.heading}
              onChange={(e) => updateSection(idx, "heading", e.target.value)}
            />
            <textarea
              className="min-h-24 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
              value={section.body}
              onChange={(e) => updateSection(idx, "body", e.target.value)}
            />
            <Input
              placeholder="Kép URL"
              value={section.image}
              onChange={(e) => updateSection(idx, "image", e.target.value)}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Kapcsolat</h3>
        <Input
          value={draft.contactLabel}
          onChange={(e) => setDraft((d) => ({ ...d, contactLabel: e.target.value }))}
        />
        <Input
          value={draft.contactEmail}
          onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">SEO</h3>
        <Input
          value={draft.meta.seoTitle}
          onChange={(e) =>
            setDraft((d) => ({ ...d, meta: { ...d.meta, seoTitle: e.target.value } }))
          }
        />
        <Input
          value={draft.meta.seoDescription}
          onChange={(e) =>
            setDraft((d) => ({ ...d, meta: { ...d.meta, seoDescription: e.target.value } }))
          }
        />
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Mentés..." : "Mentés"}
        </Button>
      </div>
    </div>
  )
}
