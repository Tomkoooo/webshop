"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, Upload, X } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@wse/core/components/ui/carousel"
import { Button } from "@wse/core/components/ui/button"
import { MediaLightbox, useMediaLightbox, type MediaLightboxItem } from "@wse/core/components/common/MediaLightbox"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { mediaImageSrc } from "@wse/core/lib/images"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"

export type GalleryItem = {
  image: string
  caption: string
}

type GalleryProps = {
  title?: string
  items?: GalleryItem[]
}

export function Gallery({ title, items = [] }: GalleryProps) {
  const cms = useCmsEdit()
  const [uploading, setUploading] = React.useState(false)
  const visibleItems = items.filter((item) => item.image?.trim())
  const lightboxItems = React.useMemo<MediaLightboxItem[]>(
    () =>
      visibleItems.map((item, index) => ({
        src: item.image,
        alt: item.caption || `Gallery image ${index + 1}`,
      })),
    [visibleItems]
  )
  const lightbox = useMediaLightbox({ images: lightboxItems })

  if (!cms.enabled && visibleItems.length === 0) return null

  const updateItems = (nextItems: GalleryItem[]) => {
    cms.updateField("gallery", "items", nextItems)
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const uploadedItems: GalleryItem[] = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file, file.name)
        const response = await fetch("/api/admin/uploads", { method: "POST", body: formData })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.url) {
          throw new Error(typeof data.error === "string" ? data.error : "Image upload failed")
        }
        uploadedItems.push({ image: data.url, caption: "" })
      }
      updateItems([...items, ...uploadedItems])
    } catch (error) {
      console.error("[gallery upload]", error)
      window.alert(error instanceof Error ? error.message : "Image upload failed")
    } finally {
      setUploading(false)
    }
  }

  const moveItem = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= items.length) return
    const nextItems = [...items]
    const current = nextItems[index]
    nextItems[index] = nextItems[nextIndex]!
    nextItems[nextIndex] = current!
    updateItems(nextItems)
  }

  return (
    <section id="gallery" className="relative overflow-hidden border-y border-border/40 bg-background-dark py-24">
      <div className="absolute left-0 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="container relative z-10 mx-auto px-6">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            {cms.enabled || title ? (
              <Reveal
                as="h2"
                className="text-4xl font-heading font-black uppercase tracking-tighter text-foreground md:text-7xl"
              >
                {cms.enabled ? (
                  <EditableTextInline
                    blockType="gallery"
                    field="title"
                    value={title ?? "Gallery"}
                    className="text-4xl font-heading font-black uppercase tracking-tighter text-foreground md:text-7xl"
                  />
                ) : (
                  title
                )}
              </Reveal>
            ) : null}
            {cms.enabled ? (
              <p className="mt-4 max-w-xl text-sm text-neutral-500">
                Upload multiple images at once. The storefront keeps their natural ratios and arranges them automatically.
              </p>
            ) : null}
          </div>

          {cms.enabled ? (
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 border border-border/60 px-4 text-xs font-black uppercase tracking-widest text-foreground transition-colors hover:border-primary-foreground/50">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload images"}
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
          ) : null}
        </div>

        {visibleItems.length > 0 ? (
          <>
            <div className="hidden gap-4 md:block md:columns-2 xl:columns-3">
              {items.map((item, index) => {
                if (!item.image?.trim()) return null
                const visibleIndex = items
                  .slice(0, index)
                  .filter((entry) => entry.image?.trim()).length
                return (
                  <Reveal
                    key={`${item.image}-${index}`}
                    delayMs={visibleIndex * REVEAL_STAGGER_MS}
                    className="mb-4 break-inside-avoid"
                  >
                    <GalleryTile
                      item={item}
                      index={index}
                      editable={cms.enabled}
                      onOpen={() =>
                        lightbox.openAt(lightboxItems.findIndex((image) => image.src === item.image))
                      }
                      onCaptionChange={(caption) =>
                        updateItems(items.map((current, idx) => (idx === index ? { ...current, caption } : current)))
                      }
                      onMoveUp={() => moveItem(index, -1)}
                      onMoveDown={() => moveItem(index, 1)}
                      onRemove={() => updateItems(items.filter((_, idx) => idx !== index))}
                      canMoveUp={index > 0}
                      canMoveDown={index < items.length - 1}
                    />
                  </Reveal>
                )
              })}
            </div>

            <div className="md:hidden">
              <Carousel opts={{ align: "start", loop: visibleItems.length > 1 }} className="mx-auto max-w-sm">
                <CarouselContent>
                  {visibleItems.map((item, index) => (
                    <CarouselItem key={`${item.image}-${index}`}>
                      <Reveal delayMs={index * REVEAL_STAGGER_MS}>
                        <button
                          type="button"
                          onClick={() => lightbox.openAt(index)}
                          className="block w-full overflow-hidden border border-border/40 bg-surface/40 text-left"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mediaImageSrc(item.image)}
                            alt={item.caption || `Gallery image ${index + 1}`}
                            className="max-h-[70vh] w-full object-contain"
                            loading="lazy"
                          />
                          {item.caption ? (
                            <span className="block px-4 py-3 text-sm text-muted-foreground">{item.caption}</span>
                          ) : null}
                        </button>
                      </Reveal>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {visibleItems.length > 1 ? (
                  <>
                    <CarouselPrevious className="left-2 border-border bg-background/90 text-foreground" />
                    <CarouselNext className="right-2 border-border bg-background/90 text-foreground" />
                  </>
                ) : null}
              </Carousel>
            </div>
          </>
        ) : cms.enabled ? (
          <div className="flex min-h-64 items-center justify-center border border-dashed border-border/60 bg-surface/30 p-8 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              No gallery images yet. Use the upload button to add a batch of images.
            </p>
          </div>
        ) : null}
      </div>

      <MediaLightbox
        open={lightbox.open}
        onOpenChange={lightbox.setOpen}
        images={lightboxItems}
        index={lightbox.index}
        onIndexChange={lightbox.setIndex}
      />
    </section>
  )
}

function GalleryTile({
  item,
  index,
  editable,
  onOpen,
  onCaptionChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
}: {
  item: GalleryItem
  index: number
  editable: boolean
  onOpen: () => void
  onCaptionChange: (caption: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  return (
    <figure className="overflow-hidden border border-border/40 bg-surface/40">
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaImageSrc(item.image)}
          alt={item.caption || `Gallery image ${index + 1}`}
          className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </button>
      {editable ? (
        <div className="space-y-2 border-t border-border/40 p-3">
          <input
            value={item.caption}
            onChange={(event) => onCaptionChange(event.target.value)}
            placeholder="Caption / alt text"
            className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="xs" variant="outline" disabled={!canMoveUp} onClick={onMoveUp}>
              <ArrowUp className="h-3 w-3" />
              Up
            </Button>
            <Button type="button" size="xs" variant="outline" disabled={!canMoveDown} onClick={onMoveDown}>
              <ArrowDown className="h-3 w-3" />
              Down
            </Button>
            <Button
              type="button"
              size="xs"
              variant="destructive"
              className="ml-auto"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      ) : item.caption ? (
        <figcaption className="border-t border-border/40 px-4 py-3 text-sm text-muted-foreground">
          {item.caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
