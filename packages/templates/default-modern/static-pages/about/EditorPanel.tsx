"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import type { AboutContent } from "./schema"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { toast } from "sonner"

export function AboutEditorPanel({ content, onSave }: EditorProps<AboutContent>) {
  const [draft, setDraft] = useState<AboutContent>(content)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success("Rólunk oldal mentve")
    } catch (error) {
      console.error(error)
      toast.error("Mentés sikertelen")
    } finally {
      setSaving(false)
    }
  }

  const updateHero = <K extends keyof AboutContent["hero"]>(
    key: K,
    value: AboutContent["hero"][K]
  ) => setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: value } }))

  const updateStoryHeading = (value: string) =>
    setDraft((d) => ({ ...d, story: { ...d.story, heading: value } }))

  const updateParagraph = (idx: number, value: string) =>
    setDraft((d) => ({
      ...d,
      story: {
        ...d.story,
        paragraphs: d.story.paragraphs.map((p, i) => (i === idx ? value : p)),
      },
    }))

  const addParagraph = () =>
    setDraft((d) => ({
      ...d,
      story: { ...d.story, paragraphs: [...d.story.paragraphs, ""] },
    }))

  const removeParagraph = (idx: number) =>
    setDraft((d) => ({
      ...d,
      story: {
        ...d.story,
        paragraphs: d.story.paragraphs.filter((_, i) => i !== idx),
      },
    }))

  const updateHighlight = (idx: number, key: "title" | "body", value: string) =>
    setDraft((d) => ({
      ...d,
      highlights: d.highlights.map((h, i) => (i === idx ? { ...h, [key]: value } : h)),
    }))

  const addHighlight = () =>
    setDraft((d) => ({
      ...d,
      highlights: [...d.highlights, { title: "Új előny", body: "" }],
    }))

  const removeHighlight = (idx: number) =>
    setDraft((d) => ({
      ...d,
      highlights: d.highlights.filter((_, i) => i !== idx),
    }))

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Hős szekció</h3>
        <div className="space-y-2">
          <Label>Cím</Label>
          <Input
            value={draft.hero.title}
            onChange={(e) => updateHero("title", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Alcím</Label>
          <textarea
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm min-h-20"
            value={draft.hero.subtitle}
            onChange={(e) => updateHero("subtitle", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Hős kép URL vagy /uploads útvonal</Label>
          <Input
            value={draft.hero.image}
            onChange={(e) => updateHero("image", e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Történet</h3>
        <div className="space-y-2">
          <Label>Cím</Label>
          <Input
            value={draft.story.heading}
            onChange={(e) => updateStoryHeading(e.target.value)}
          />
        </div>
        <div className="space-y-3">
          {draft.story.paragraphs.map((paragraph, idx) => (
            <div key={idx} className="space-y-2 rounded-md border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Bekezdés #{idx + 1}
                </span>
                <Button size="sm" variant="ghost" onClick={() => removeParagraph(idx)}>
                  Törlés
                </Button>
              </div>
              <textarea
                className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm min-h-24"
                value={paragraph}
                onChange={(e) => updateParagraph(idx, e.target.value)}
              />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addParagraph}>
            Új bekezdés
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Előnyök</h3>
          <Button size="sm" variant="outline" onClick={addHighlight}>
            Új előny
          </Button>
        </div>
        {draft.highlights.map((h, idx) => (
          <div key={idx} className="space-y-2 rounded-md border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Előny #{idx + 1}
              </span>
              <Button size="sm" variant="ghost" onClick={() => removeHighlight(idx)}>
                Törlés
              </Button>
            </div>
            <Input
              value={h.title}
              onChange={(e) => updateHighlight(idx, "title", e.target.value)}
              placeholder="Cím"
            />
            <textarea
              className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm min-h-20"
              value={h.body}
              onChange={(e) => updateHighlight(idx, "body", e.target.value)}
              placeholder="Leírás"
            />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Call-to-action gomb</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Felirat</Label>
            <Input
              value={draft.cta.label}
              onChange={(e) =>
                setDraft((d) => ({ ...d, cta: { ...d.cta, label: e.target.value } }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input
              value={draft.cta.href}
              onChange={(e) =>
                setDraft((d) => ({ ...d, cta: { ...d.cta, href: e.target.value } }))
              }
            />
          </div>
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
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Mentés..." : "Mentés"}
        </Button>
      </div>
    </div>
  )
}
