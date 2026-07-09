"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Save, Trash2, ClipboardPaste } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { ImageUpload } from "@wse/core/components/admin/ImageUpload"
import { PopupCampaignBody } from "@wse/core/components/storefront/popups/PopupCampaignBody"
import {
  POPUP_TEMPLATE_OPTIONS,
  type PopupCampaign,
  type PopupCampaignInput,
  type PopupTemplateId,
} from "@wse/core/lib/popup-campaign-schema"
import { adminFieldHint, adminInputClass } from "@wse/core/lib/admin-ui"
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
      <div className="max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="popup-enabled"
            type="checkbox"
            className="size-4 accent-primary"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          />
          <label htmlFor="popup-enabled" className="cursor-pointer text-sm font-medium">
            Aktív (megjelenik a webshopon)
          </label>
        </div>

        <AdminFormField label="Belső név">
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={cn(adminInputClass, "h-10")}
          />
        </AdminFormField>

        <AdminFormField label="Prioritás" hint="Kisebb szám = előbb a sorban">
          <Input
            type="number"
            min={0}
            max={9999}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
            className={cn(adminInputClass, "h-10 w-32")}
          />
        </AdminFormField>

        <AdminFormField label="Sablon">
          <div className="grid gap-2 sm:grid-cols-3">
            {POPUP_TEMPLATE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, templateId: opt.id as PopupTemplateId }))}
                className={cn(
                  "rounded-lg px-3 py-3 text-left shadow-sm transition",
                  form.templateId === opt.id
                    ? "bg-primary/10 text-foreground ring-2 ring-primary/30"
                    : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <span className="block text-sm font-medium">{opt.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{opt.description}</span>
              </button>
            ))}
          </div>
        </AdminFormField>

        <AdminFormField label="Kép">
          <ImageUpload
            currentImage={form.imageUrl}
            onUpload={(filename) => setForm((f) => ({ ...f, imageUrl: filename }))}
            aspect={16 / 10}
          />
        </AdminFormField>

        <AdminFormField label="Cím">
          <Input
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={cn(adminInputClass, "h-10")}
          />
        </AdminFormField>

        <AdminFormField label="Szöveg">
          <textarea
            value={form.body ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
            className={cn(
              adminInputClass,
              "min-h-24 resize-y py-2"
            )}
          />
        </AdminFormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField label="Gomb szövege">
            <Input
              value={form.buttonText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
              className={cn(adminInputClass, "h-10")}
              placeholder="Pl. Megnézem"
            />
          </AdminFormField>
          <AdminFormField label="Gomb linkje">
            <Input
              value={form.buttonHref ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, buttonHref: e.target.value }))}
              className={cn(adminInputClass, "h-10")}
              placeholder="/shop vagy https://…"
            />
          </AdminFormField>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="popup-close"
            type="checkbox"
            className="size-4 accent-primary"
            checked={form.showCloseButton}
            onChange={(e) => setForm((f) => ({ ...f, showCloseButton: e.target.checked }))}
          />
          <label htmlFor="popup-close" className="cursor-pointer text-sm">
            Bezárás gomb (X) megjelenítése
          </label>
        </div>

        <AdminFormField
          label="Megjelenés ezeken az URL-eken"
          hint="Illeszd be a böngésző címsorából a teljes útvonalat. Főoldal: / (nem /home). Kategória: /shop?category=…, termék: /products/…"
        >
          <div className="flex flex-wrap gap-2">
            {QUICK_PATHS.map((q) => (
              <Button
                key={q.path}
                type="button"
                variant="outline"
                size="sm"
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
                className={cn(adminInputClass, "h-10 font-mono text-sm")}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Beillesztés"
                onClick={() => pasteToPath(index)}
              >
                <ClipboardPaste className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={form.targetPaths.length <= 1}
                onClick={() => removePath(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => addPath()}>
            <Plus className="mr-1 size-4" /> URL hozzáadása
          </Button>
        </AdminFormField>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="default" onClick={save} disabled={saving}>
            {saving ? <LoadingSpinner className="size-4" /> : <Save className="size-4" />}
            Mentés
          </Button>
          <Button type="button" variant="destructive" onClick={remove} disabled={deleting}>
            <Trash2 className="size-4" />
            Törlés
          </Button>
          {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Előnézet</p>
        <div className="rounded-lg bg-neutral-950 p-4 shadow-sm">
          <PopupCampaignBody campaign={previewCampaign} preview />
        </div>
      </div>
    </div>
  )
}
