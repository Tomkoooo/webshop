"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { SeoSettings } from "@wse/core/services/seo-settings"
import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { Checkbox } from "@wse/core/components/ui/checkbox"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Textarea } from "@wse/core/components/ui/textarea"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { mediaImageSrc } from "@wse/core/lib/images"

function SeoImageField({
  label,
  description,
  value,
  onChange,
  recommendedSize,
  aspect,
}: {
  label: string
  description: string
  value: string
  onChange: (url: string) => void
  recommendedSize: { width: number; height: number }
  aspect: number
}) {
  const previewSrc = mediaImageSrc(value)
  return (
    <div className="space-y-3 md:col-span-2">
      <div className="space-y-1">
        <Label className={adminFieldLabel}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {previewSrc ? (
        <FallbackImage
          src={previewSrc}
          alt={label}
          width={recommendedSize.width}
          height={recommendedSize.height}
          className="max-h-40 w-auto rounded-md bg-muted object-contain ring-1 ring-border/60"
        />
      ) : null}
      <UploadSheet
        onUploaded={onChange}
        label={`${label} feltöltése`}
        usageLabel={label}
        recommendedSize={recommendedSize}
        aspect={aspect}
        allowRectangleCrop
        allowSkipCrop
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="URL vagy feltöltés után automatikus"
      />
    </div>
  )
}

export function SeoEditor({ initial, onSaved }: { initial: SeoSettings; onSaved?: (settings: SeoSettings) => void }) {
  const [state, setState] = useState(initial)

  useEffect(() => {
    setState(initial)
  }, [initial])

  const patch = <K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alap meta</CardTitle>
          <CardDescription>Oldalcím, leírás és indexelési beállítások.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className={adminFieldLabel}>Oldal címe</Label>
            <Input value={state.siteTitle} onChange={(e) => patch("siteTitle", e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className={adminFieldLabel}>Oldal leírása</Label>
            <Textarea
              value={state.siteDescription}
              onChange={(e) => patch("siteDescription", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Alapértelmezett nyelv</Label>
            <Input value={state.defaultLocale} onChange={(e) => patch("defaultLocale", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Kanonikus URL</Label>
            <Input
              value={state.canonicalBaseUrl}
              onChange={(e) => patch("canonicalBaseUrl", e.target.value)}
              placeholder="https://shop.example.com"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={state.robotsIndex} onCheckedChange={(v) => patch("robotsIndex", v === true)} />
            Keresők indexelhetik
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={state.robotsFollow} onCheckedChange={(v) => patch("robotsFollow", v === true)} />
            Keresők követhetik a linkeket
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Megosztási képek</CardTitle>
          <CardDescription>
            Facebook, LinkedIn, iMessage és X előnézet képei (Open Graph és Twitter meta).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <SeoImageField
            label="Open Graph kép"
            description="Ajánlott: 1200×630 px (1.91:1)."
            value={state.ogImage}
            onChange={(url) => patch("ogImage", url)}
            recommendedSize={{ width: 1200, height: 630 }}
            aspect={1200 / 630}
          />
          <SeoImageField
            label="Twitter / X kártya kép"
            description="Ajánlott: 1200×600 px vagy ugyanaz mint az OG."
            value={state.twitterImage}
            onChange={(url) => patch("twitterImage", url)}
            recommendedSize={{ width: 1200, height: 600 }}
            aspect={2}
          />
          <div className="space-y-3">
            <Label className={adminFieldLabel}>Favicon</Label>
            <FallbackImage
              src={mediaImageSrc(state.favicon)}
              alt="favicon"
              width={40}
              height={40}
              className="size-10 rounded-md bg-muted ring-1 ring-border/60"
            />
            <UploadSheet
              onUploaded={(url) => patch("favicon", url)}
              label="Favicon feltöltése"
              usageLabel="Favicon"
              recommendedSize={{ width: 512, height: 512 }}
              aspect={1}
            />
            <Input value={state.favicon} onChange={(e) => patch("favicon", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        onClick={async () => {
          const response = await fetch("/api/admin/seo", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(state),
          })
          if (!response.ok) {
            toast.error("SEO mentés sikertelen")
            return
          }
          const updated = (await response.json()) as SeoSettings
          setState(updated)
          onSaved?.(updated)
          toast.success("SEO mentve")
        }}
      >
        SEO mentése
      </Button>
    </div>
  )
}
