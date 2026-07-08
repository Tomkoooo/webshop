"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { SeoSettings } from "@wse/core/services/seo-settings"
import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
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
    <div className="space-y-2 md:col-span-2">
      <span className="text-xs uppercase tracking-widest text-neutral-400">{label}</span>
      <p className="text-[11px] text-neutral-500">{description}</p>
      {previewSrc ? (
        <FallbackImage
          src={previewSrc}
          alt={label}
          width={recommendedSize.width}
          height={recommendedSize.height}
          className="max-h-40 w-auto border border-white/20 bg-white/5 object-contain"
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
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-9 px-2 bg-black border border-white/20 text-white text-sm"
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
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-white">Alap meta</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-widest text-neutral-400">siteTitle</span>
            <input
              value={state.siteTitle}
              onChange={(e) => patch("siteTitle", e.target.value)}
              className="w-full h-9 px-2 bg-black border border-white/20 text-white text-sm"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-widest text-neutral-400">siteDescription</span>
            <textarea
              value={state.siteDescription}
              onChange={(e) => patch("siteDescription", e.target.value)}
              className="w-full min-h-[72px] px-2 py-2 bg-black border border-white/20 text-white text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-neutral-400">defaultLocale</span>
            <input
              value={state.defaultLocale}
              onChange={(e) => patch("defaultLocale", e.target.value)}
              className="w-full h-9 px-2 bg-black border border-white/20 text-white text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-neutral-400">canonicalBaseUrl</span>
            <input
              value={state.canonicalBaseUrl}
              onChange={(e) => patch("canonicalBaseUrl", e.target.value)}
              placeholder="https://shop.example.com"
              className="w-full h-9 px-2 bg-black border border-white/20 text-white text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400">
            <input
              type="checkbox"
              checked={state.robotsIndex}
              onChange={(e) => patch("robotsIndex", e.target.checked)}
            />
            robotsIndex
          </label>
          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400">
            <input
              type="checkbox"
              checked={state.robotsFollow}
              onChange={(e) => patch("robotsFollow", e.target.checked)}
            />
            robotsFollow
          </label>
        </div>
      </section>

      <section className="space-y-3 border-t border-white/10 pt-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-white">Megosztási képek</h3>
        <p className="text-xs text-neutral-500 max-w-2xl">
          Ezek jelennek meg, ha valaki linket oszt (Facebook, LinkedIn, iMessage, X / Twitter). A{" "}
          <code className="text-neutral-400">layout.tsx</code> Open Graph és Twitter meta mezőibe kerülnek.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <SeoImageField
            label="Open Graph kép (og:image)"
            description="Ajánlott: 1200×630 px (1.91:1). Közösségi feed előnézet."
            value={state.ogImage}
            onChange={(url) => patch("ogImage", url)}
            recommendedSize={{ width: 1200, height: 630 }}
            aspect={1200 / 630}
          />
          <SeoImageField
            label="Twitter / X kártya kép"
            description="Ajánlott: 1200×600 px vagy ugyanaz mint az OG. summary_large_image."
            value={state.twitterImage}
            onChange={(url) => patch("twitterImage", url)}
            recommendedSize={{ width: 1200, height: 600 }}
            aspect={2}
          />
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-neutral-400">Favicon</span>
            <FallbackImage
              src={mediaImageSrc(state.favicon)}
              alt="favicon"
              width={40}
              height={40}
              className="w-10 h-10 border border-white/20 bg-white"
            />
            <UploadSheet
              onUploaded={(url) => patch("favicon", url)}
              label="Favicon feltöltése"
              usageLabel="Favicon"
              recommendedSize={{ width: 512, height: 512 }}
              aspect={1}
            />
            <input
              value={state.favicon}
              onChange={(e) => patch("favicon", e.target.value)}
              className="w-full h-9 px-2 bg-black border border-white/20 text-white text-sm"
            />
          </div>
        </div>
      </section>

      <button
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
        className="px-3 h-10 bg-primary text-white text-xs uppercase"
      >
        SEO mentése
      </button>
    </div>
  )
}
