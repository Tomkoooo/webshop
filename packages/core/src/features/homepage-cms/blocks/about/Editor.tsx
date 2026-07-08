"use client"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import type { AboutBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"

const ICON_OPTIONS = ["Shield", "Hammer", "Users", "Lightbulb", "Star", "Award"]

export function AboutBlockEditor({
  block,
  onPatch,
}: {
  block: AboutBlock
  onPatch: (field: keyof AboutBlock["data"], value: unknown) => void
}) {
  const [uploading, setUploading] = useState(false)
  const image = typeof block.data.image === "string" ? block.data.image : ""

  const uploadImage = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file, file.name)
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) {
        throw new Error(typeof data.error === "string" ? data.error : "Képfeltöltés sikertelen")
      }
      onPatch("image", data.url as string)
    } catch (error) {
      console.error("[about image upload]", error)
      window.alert(error instanceof Error ? error.message : "Képfeltöltés sikertelen")
    } finally {
      setUploading(false)
    }
  }

  const isStoryBlock =
    block.id === "story-zsdav" ||
    Boolean(block.data.image?.trim()) ||
    Boolean(block.data.ctaLabel?.trim()) ||
    Boolean(block.data.boxHeading?.trim())
  const isFaqBlock =
    block.id === "faq-mineshow" ||
    (block.data.accordions.length > 0 && !isStoryBlock)
  const isPricingBlock = block.id === "pricing-info"

  return (
    <section className="py-20 border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading
          value={block.data.title}
          onChange={(value) => onPatch("title", value)}
          editMode
          className="text-3xl text-white font-black"
        />

        {isStoryBlock ? (
          <>
            <p className="text-xs uppercase tracking-widest text-emerald-300/90">
              Történet blokk (kép, szöveg, gomb)
            </p>
            <EditableText
              value={block.data.paragraph}
              onChange={(value) => onPatch("paragraph", value)}
              editMode
              multiline
              className="text-neutral-400 min-h-[80px]"
            />
            <input
              value={block.data.boxHeading ?? ""}
              onChange={(e) => onPatch("boxHeading", e.target.value)}
              className="w-full h-9 px-2 bg-black border border-white/20 text-sm text-white"
              placeholder="Doboz címsor (pl. Alkoss, játssz, programozz!)"
            />
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative w-40 h-40 border border-white/20 bg-black/40 overflow-hidden">
                {image ? (
                  <FallbackImage
                    src={mediaImageSrc(image)}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                    Nincs kép
                  </div>
                )}
                {image ? (
                  <button
                    type="button"
                    onClick={() => onPatch("image", "")}
                    className="absolute top-1 right-1 p-1 bg-black/80 text-white"
                    aria-label="Kép törlése"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
              <label className="inline-flex items-center gap-2 px-3 h-9 border border-white/20 text-white text-xs uppercase cursor-pointer">
                <Upload className="h-4 w-4" />
                {uploading ? "Feltöltés…" : "Kép feltöltése"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => void uploadImage(e.target.files)}
                />
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <input
                value={block.data.ctaLabel ?? ""}
                onChange={(e) => onPatch("ctaLabel", e.target.value)}
                className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
                placeholder="Gomb felirat (pl. Jelentkezés)"
              />
              <input
                value={block.data.ctaHref ?? ""}
                onChange={(e) => onPatch("ctaHref", e.target.value)}
                className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
                placeholder="Gomb link (pl. /jegyvasarlas)"
              />
            </div>
            <input
              value={block.data.bannerText ?? ""}
              onChange={(e) => onPatch("bannerText", e.target.value)}
              className="w-full h-9 px-2 bg-black border border-white/20 text-sm text-white"
              placeholder="Zöld sáv szövege alul"
            />
            <input
              value={block.data.bannerHref ?? ""}
              onChange={(e) => onPatch("bannerHref", e.target.value)}
              className="w-full h-9 px-2 bg-black border border-white/20 text-xs text-white font-mono"
              placeholder="Facebook esemény URL (zöld sáv + oldalsó tab)"
            />
          </>
        ) : isPricingBlock ? (
          <EditableText
            value={block.data.paragraph}
            onChange={(value) => onPatch("paragraph", value)}
            editMode
            multiline
            className="text-neutral-400 min-h-[120px]"
          />
        ) : !isFaqBlock ? (
          <EditableText
            value={block.data.paragraph}
            onChange={(value) => onPatch("paragraph", value)}
            editMode
            multiline
            className="text-neutral-400"
          />
        ) : null}

        {isFaqBlock ? (
          <>
        <p className="text-xs uppercase tracking-widest text-neutral-400 pt-4">
          Gyakori kérdések (accordion)
        </p>
        {block.data.accordions.map((item, index) => (
          <div key={`accordion-${index}`} className="grid md:grid-cols-2 gap-2">
            <input
              value={item.title}
              onChange={(event) =>
                onPatch(
                  "accordions",
                  block.data.accordions.map((current, idx) =>
                    idx === index ? { ...current, title: event.target.value } : current
                  )
                )
              }
              className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
              placeholder="Kérdés (cím)"
            />
            <div className="flex gap-2">
              <textarea
                value={item.content}
                onChange={(event) =>
                  onPatch(
                    "accordions",
                    block.data.accordions.map((current, idx) =>
                      idx === index ? { ...current, content: event.target.value } : current
                    )
                  )
                }
                className="flex-1 min-h-[72px] px-2 py-1 bg-black border border-white/20 text-sm text-white resize-y"
                placeholder="Válasz (tartalom)"
              />
              <button
                type="button"
                onClick={() =>
                  onPatch(
                    "accordions",
                    block.data.accordions.filter((_, idx) => idx !== index)
                  )
                }
                className="px-3 h-9 border border-red-500/60 text-red-200 text-xs uppercase shrink-0 self-start"
              >
                Törlés
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onPatch("accordions", [
              ...block.data.accordions,
              { title: "Új kérdés", content: "Válasz szövege…" },
            ])
          }
          className="px-3 h-9 border border-white/20 text-white text-xs uppercase"
        >
          Kérdés hozzáadása
        </button>
          </>
        ) : null}

        {isStoryBlock ? null : !isFaqBlock && !isPricingBlock ? (
          <>
            <p className="text-xs uppercase tracking-widest text-neutral-500 pt-4">
              Kártyák (opcionális, régi elrendezés)
            </p>
            {block.data.cards.map((item, index) => (
              <div key={`about-card-${index}`} className="grid md:grid-cols-3 gap-2">
                <input
                  value={item.title}
                  onChange={(event) =>
                    onPatch(
                      "cards",
                      block.data.cards.map((current, idx) =>
                        idx === index ? { ...current, title: event.target.value } : current
                      )
                    )
                  }
                  className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
                  placeholder="Cím"
                />
                <input
                  value={item.description}
                  onChange={(event) =>
                    onPatch(
                      "cards",
                      block.data.cards.map((current, idx) =>
                        idx === index ? { ...current, description: event.target.value } : current
                      )
                    )
                  }
                  className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
                  placeholder="Leírás"
                />
                <div className="flex gap-2">
                  <select
                    value={item.icon ?? ""}
                    onChange={(event) =>
                      onPatch(
                        "cards",
                        block.data.cards.map((current, idx) =>
                          idx === index
                            ? { ...current, icon: event.target.value || undefined }
                            : current
                        )
                      )
                    }
                    className="flex-1 h-9 px-2 bg-black border border-white/20 text-sm text-white"
                  >
                    <option value="">Nincs ikon</option>
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      onPatch(
                        "cards",
                        block.data.cards.filter((_, idx) => idx !== index)
                      )
                    }
                    className="px-3 h-9 border border-red-500/60 text-red-200 text-xs uppercase"
                  >
                    Törlés
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPatch("cards", [
                  ...block.data.cards,
                  { title: "Új kártya", description: "Kártya leírás", icon: "Shield" },
                ])
              }
              className="px-3 h-9 border border-white/20 text-white text-xs uppercase"
            >
              Kártya hozzáadása
            </button>
          </>
        ) : null}
      </div>
    </section>
  )
}

