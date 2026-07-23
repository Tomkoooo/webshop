"use client"

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VideoCarouselBlock } from "@/features/homepage-cms/types/block-types"
import { EditableHeading } from "@/features/homepage-cms/components/primitives/EditableHeading"
import { parseVideoEmbedUrl } from "@/lib/video-embed"

type Props = {
  block: VideoCarouselBlock
  onPatch: (field: keyof VideoCarouselBlock["data"], value: unknown) => void
}

export function VideoCarouselBlockEditor({ block, onPatch }: Props) {
  const items = Array.isArray(block.data.items) ? block.data.items : []

  const moveItem = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= items.length) return
    const nextItems = [...items]
    const current = nextItems[index]
    nextItems[index] = nextItems[nextIndex]!
    nextItems[nextIndex] = current!
    onPatch("items", nextItems)
  }

  return (
    <section className="border-b border-white/10 bg-black/20 py-20">
      <div className="container mx-auto space-y-4 px-4">
        <EditableHeading
          value={block.data.title}
          onChange={(value) => onPatch("title", value)}
          editMode
          className="text-3xl font-black text-white"
        />
        <p className="text-xs text-neutral-500">
          YouTube vagy TikTok videó URL-ek — a bolton karusszelként jelennek meg.
        </p>
        <div className="space-y-3">
          {items.map((item, index) => {
            const parsed = parseVideoEmbedUrl(item.url)
            return (
              <div key={`video-carousel-item-${index}`} className="space-y-2 border border-white/10 p-3">
                <input
                  value={item.url}
                  onChange={(event) =>
                    onPatch(
                      "items",
                      items.map((current, idx) =>
                        idx === index ? { ...current, url: event.target.value } : current
                      )
                    )
                  }
                  className="h-9 w-full border border-white/20 bg-black px-2 text-sm text-white"
                  placeholder="https://www.youtube.com/watch?v=… vagy TikTok link"
                />
                <input
                  value={item.caption ?? ""}
                  onChange={(event) =>
                    onPatch(
                      "items",
                      items.map((current, idx) =>
                        idx === index ? { ...current, caption: event.target.value } : current
                      )
                    )
                  }
                  className="h-9 w-full border border-white/20 bg-black px-2 text-sm text-white"
                  placeholder="Felirat (opcionális)"
                />
                {item.url.trim() && !parsed.embedUrl ? (
                  <p className="text-xs text-rose-400">Nem ismert videó link.</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="xs" variant="outline" disabled={index === 0} onClick={() => moveItem(index, -1)}>
                    <ArrowUp className="h-3 w-3" />
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    <ArrowDown className="h-3 w-3" />
                    Down
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    className="ml-auto"
                    onClick={() => onPatch("items", items.filter((_, idx) => idx !== index))}
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-none border-white/20 px-3 text-xs uppercase text-white"
          onClick={() => onPatch("items", [...items, { url: "", caption: "" }])}
        >
          <Plus className="mr-2 h-3 w-3" />
          Videó hozzáadása
        </Button>
      </div>
    </section>
  )
}
