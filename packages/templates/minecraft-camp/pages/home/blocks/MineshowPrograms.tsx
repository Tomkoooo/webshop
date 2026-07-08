"use client"

import { useRef, useState } from "react"
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"
import { mediaImageSrc } from "@wse/core/lib/images"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"

const GALLERY_BLOCK_ID = "programs-gallery"
const INTRO_BLOCK_ID = "programs-intro"

type Item = { image: string; caption: string }

function patchItems(cms: ReturnType<typeof useCmsEdit>, items: Item[]) {
  cms.patchBlockData("gallery", { items }, GALLERY_BLOCK_ID)
}

export function MineshowPrograms({
  title,
  items,
  intro,
}: {
  title: string
  items: Item[]
  intro?: string
}) {
  const cms = useCmsEdit()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" })
  }

  const moveItem = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= items.length) return
    const nextItems = [...items]
    const current = nextItems[index]
    nextItems[index] = nextItems[nextIndex]!
    nextItems[nextIndex] = current!
    patchItems(cms, nextItems)
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const uploaded: Item[] = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file, file.name)
        const response = await fetch("/api/admin/uploads", { method: "POST", body: formData })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.url) {
          throw new Error(typeof data.error === "string" ? data.error : "Image upload failed")
        }
        uploaded.push({ image: data.url, caption: "" })
      }
      patchItems(cms, [...items, ...uploaded])
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Image upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="bg-[#b8d88a] px-4 py-12 border-t-4 border-[#3d2817]/20">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-minecraft text-[#78B7FF] text-lg md:text-xl mb-4 drop-shadow-[2px_2px_0_#1a3d5c]">
          <EditableTextInline
            blockType="gallery"
            blockId={GALLERY_BLOCK_ID}
            field="title"
            value={title}
            className="text-[#78B7FF] text-lg md:text-xl font-minecraft"
          />
        </h2>
        {intro || cms.enabled ? (
          <p className="font-minecraft text-[10px] md:text-xs text-[#2d2817] mb-8 max-w-4xl whitespace-pre-line leading-relaxed">
            <EditableTextInline
              blockType="richText"
              blockId={INTRO_BLOCK_ID}
              field="html"
              value={intro ?? ""}
              multiline
              className="text-[#2d2817] text-[10px] md:text-xs font-minecraft leading-relaxed"
              onCommit={(value) =>
                cms.patchBlockData(
                  "richText",
                  { html: value ? `<p>${value}</p>` : "" },
                  INTRO_BLOCK_ID
                )
              }
            />
          </p>
        ) : null}

        {cms.enabled ? (
          <div className="cms-admin-control relative z-20 mb-6 space-y-3 rounded border border-dashed border-[#3d2817]/50 bg-neutral-900/95 p-4 text-white">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">Galéria kártyák</p>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 border border-white/20 px-3 text-xs hover:border-white/40">
              <Plus className="h-3.5 w-3.5" />
              {uploading ? "Feltöltés…" : "Kép hozzáadása"}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                className="hidden"
                onChange={(event) => {
                  void uploadFiles(event.target.files)
                  event.target.value = ""
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <div key={`gallery-edit-${index}`} className="space-y-2 border border-white/10 p-2">
                  <EditableImage
                    src={mediaImageSrc(item.image || "/generic-hero.svg")}
                    alt={item.caption || `Gallery ${index + 1}`}
                    editMode
                    width={400}
                    height={400}
                    flexibleCrop
                    usageLabel="Galéria kártya kép"
                    className="h-28 w-full object-cover bg-black/30"
                    onChange={(next) => {
                      patchItems(
                        cms,
                        items.map((row, idx) => (idx === index ? { ...row, image: next } : row))
                      )
                    }}
                  />
                  <input
                    value={item.caption}
                    onChange={(event) =>
                      patchItems(
                        cms,
                        items.map((row, idx) =>
                          idx === index ? { ...row, caption: event.target.value } : row
                        )
                      )
                    }
                    className="h-8 w-full bg-neutral-800 border border-white/20 px-2 text-xs text-white"
                    placeholder="Felirat"
                  />
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                      className="inline-flex h-7 items-center gap-1 border border-white/20 px-2 text-[10px] disabled:opacity-40"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Fel
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, 1)}
                      className="inline-flex h-7 items-center gap-1 border border-white/20 px-2 text-[10px] disabled:opacity-40"
                    >
                      <ArrowDown className="h-3 w-3" />
                      Le
                    </button>
                    <button
                      type="button"
                      onClick={() => patchItems(cms, items.filter((_, idx) => idx !== index))}
                      className="ml-auto inline-flex h-7 items-center gap-1 border border-red-500/40 px-2 text-[10px] text-red-300"
                    >
                      <X className="h-3 w-3" />
                      Törlés
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-neutral-500">Még nincs kártya — tölts fel képet a fenti gombbal.</p>
            ) : null}
          </div>
        ) : null}

        <div className="relative">
          <button
            type="button"
            aria-label="Előző"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center bg-white/90 border-2 border-[#3d2817] font-bold"
            onClick={() => scroll(-1)}
          >
            ‹
          </button>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth md:px-12"
          >
            {items.map((item, i) => (
              <figure
                key={`${item.caption}-${i}`}
                className="snap-start shrink-0 w-40 md:w-44 group"
              >
                <div className="minecraft-map-frame aspect-square overflow-hidden bg-[#4e311f] transition-transform group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaImageSrc(item.image || "/generic-hero.svg")}
                    alt={item.caption}
                    className="h-full w-full object-cover pixelated"
                  />
                </div>
                <figcaption className="mt-2 font-minecraft text-[8px] text-center text-[#8b2500] drop-shadow-sm">
                  {cms.enabled ? (
                    <EditableTextInline
                      blockType="gallery"
                      blockId={GALLERY_BLOCK_ID}
                      field="items"
                      value={item.caption}
                      className="text-[#8b2500] text-[8px] text-center font-minecraft"
                      onCommit={(value) => {
                        patchItems(
                          cms,
                          items.map((row, idx) => (idx === i ? { ...row, caption: value } : row))
                        )
                      }}
                    />
                  ) : (
                    item.caption
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
          <button
            type="button"
            aria-label="Következő"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center bg-white/90 border-2 border-[#3d2817] font-bold"
            onClick={() => scroll(1)}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
