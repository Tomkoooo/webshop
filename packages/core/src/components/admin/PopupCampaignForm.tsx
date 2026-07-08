"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Save, Trash2, ClipboardPaste } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { ImageUpload } from "@wse/core/components/admin/ImageUpload"
import { PopupCampaignBody } from "@wse/core/components/storefront/popups/PopupCampaignBody"
import {
  POPUP_TEMPLATE_OPTIONS,
  type PopupCampaign,
  type PopupCampaignInput,
  type PopupTemplateId,
} from "@wse/core/lib/popup-campaign-schema"
import { cn } from "@wse/core/lib/utils"

const QUICK_PATHS = [
  { label: "Főoldal", path: "/" },
  { label: "Bolt", path: "/shop" },
] as const

export function PopupCampaignForm({
  campaign,
}: {
  campaign: PopupCampaign
}) {
  const router = useRouter()
  const [form, setForm] = React.useState<PopupCampaignInput>({
    name: campaign.name,
    enabled: campaign.enabled,
    priority: campaign.priority,
    templateId: campaign.templateId,
    title: campaign.title,
    body: campaign.body,
    imageUrl: campaign.imageUrl,
    buttonText: campaign.buttonText,
    buttonHref: campaign.buttonHref,
    showCloseButton: campaign.showCloseButton,
    targetPaths: [...campaign.targetPaths],
  })
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const updatePath = (index: number, value: string) => {
    setForm((f) => {
      const targetPaths = [...f.targetPaths]
      targetPaths[index] = value
      return { ...f, targetPaths }
    })
  }

  const addPath = (path = "") => {
    setForm((f) => ({ ...f, targetPaths: [...f.targetPaths, path] }))
  }

  const removePath = (index: number) => {
    setForm((f) => {
      if (f.targetPaths.length <= 1) return f
      return { ...f, targetPaths: f.targetPaths.filter((_, i) => i !== index) }
    })
  }

  const pasteToPath = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) updatePath(index, text.trim())
    } catch {
      setMessage("Nem sikerült beolvasni a vágólapot.")
    }
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const targetPaths = form.targetPaths.map((p) => p.trim()).filter(Boolean)
      if (targetPaths.length === 0) {
        throw new Error("Legalább egy cél URL szükséges.")
      }
      const res = await fetch(`/api/admin/popup-campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, targetPaths }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || err?.error || "Mentés sikertelen")
      }
      setMessage("Elmentve.")
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm("Biztosan törlöd ezt a popup kampányt?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/popup-campaigns/${campaign.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Törlés sikertelen")
      router.push("/admin/cms/popups")
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hiba")
      setDeleting(false)
    }
  }

  const previewCampaign: PopupCampaign = {
    ...campaign,
    ...form,
    id: campaign.id,
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr,minmax(280px,360px)]">
      <div className="space-y-8 max-w-2xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <input
              id="popup-enabled"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            <Label htmlFor="popup-enabled" className="cursor-pointer text-xs font-black uppercase tracking-widest text-white">
              Aktív (megjelenik a webshopon)
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Belső név</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-black/40 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
            Prioritás (kisebb = előbb a sorban)
          </Label>
          <Input
            type="number"
            min={0}
            max={9999}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
            className="bg-black/40 border-white/10 w-32"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Sablon</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {POPUP_TEMPLATE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, templateId: opt.id as PopupTemplateId }))}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition",
                  form.templateId === opt.id
                    ? "border-violet-400/50 bg-violet-500/15"
                    : "border-white/10 bg-white/5 hover:border-white/25"
                )}
              >
                <span className="block text-xs font-black uppercase tracking-widest text-white">{opt.label}</span>
                <span className="mt-1 block text-[10px] font-normal normal-case text-neutral-500">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Kép</Label>
          <ImageUpload
            currentImage={form.imageUrl}
            onUpload={(filename) => setForm((f) => ({ ...f, imageUrl: filename }))}
            aspect={16 / 10}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Cím</Label>
          <Input
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="bg-black/40 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Szöveg</Label>
          <textarea
            value={form.body ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
            className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Gomb szövege</Label>
            <Input
              value={form.buttonText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
              className="bg-black/40 border-white/10"
              placeholder="Pl. Megnézem"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Gomb linkje</Label>
            <Input
              value={form.buttonHref ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, buttonHref: e.target.value }))}
              className="bg-black/40 border-white/10"
              placeholder="/shop vagy https://…"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="popup-close"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={form.showCloseButton}
            onChange={(e) => setForm((f) => ({ ...f, showCloseButton: e.target.checked }))}
          />
          <Label htmlFor="popup-close" className="cursor-pointer text-xs text-neutral-300">
            Bezárás gomb (X) megjelenítése
          </Label>
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
            Megjelenés ezeken az URL-eken
          </Label>
          <p className="text-xs text-neutral-500">
            Illeszd be a böngésző címsorából a teljes útvonalat. Főoldal: <code className="text-neutral-400">/</code>
            (nem /home). Kategória: <code className="text-neutral-400">/shop?category=…</code>, termék:{" "}
            <code className="text-neutral-400">/products/…</code>
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PATHS.map((q) => (
              <Button
                key={q.path}
                type="button"
                variant="outline"
                size="sm"
                className="text-[10px] uppercase tracking-widest"
                onClick={() => addPath(q.path)}
              >
                + {q.label}
              </Button>
            ))}
          </div>
          {form.targetPaths.map((path, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={path}
                onChange={(e) => updatePath(index, e.target.value)}
                placeholder="/ vagy /shop?category=id"
                className="bg-black/40 border-white/10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Beillesztés"
                onClick={() => pasteToPath(index)}
              >
                <ClipboardPaste className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={form.targetPaths.length <= 1}
                onClick={() => removePath(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => addPath()}>
            <Plus className="h-4 w-4 mr-1" /> URL hozzáadása
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <Button variant="krausz" onClick={save} disabled={saving}>
            {saving ? <LoadingSpinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Mentés
          </Button>
          <Button type="button" variant="destructive" onClick={remove} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
            Törlés
          </Button>
          {message ? <span className="text-xs text-neutral-400">{message}</span> : null}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">Előnézet</p>
        <div className="rounded-lg border border-white/10 bg-neutral-950 p-4">
          <PopupCampaignBody campaign={previewCampaign} preview />
        </div>
      </div>
    </div>
  )
}
