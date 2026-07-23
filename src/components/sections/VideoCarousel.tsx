"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ClipboardPaste, Plus, X } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { EditableTextInline } from "@/features/homepage-cms/components/primitives/EditableTextInline"
import { useCmsEdit } from "@/features/homepage-cms/components/editor/cms-edit-context"
import { Reveal, REVEAL_STAGGER_MS } from "@/components/motion/css-reveal"
import {
  mergeVideoEmbedItems,
  parseVideoEmbedBulk,
  parseVideoEmbedUrl,
} from "@/lib/video-embed"

export type VideoCarouselItem = {
  url: string
  caption?: string
}

type VideoCarouselProps = {
  title?: string
  items?: VideoCarouselItem[]
}

export function VideoCarousel({ title, items = [] }: VideoCarouselProps) {
  const cms = useCmsEdit()
  const [bulkText, setBulkText] = React.useState("")
  const [bulkMessage, setBulkMessage] = React.useState<string | null>(null)

  const visibleItems = items
    .map((item) => ({ ...item, parsed: parseVideoEmbedUrl(item.url) }))
    .filter((item) => item.parsed.embedUrl)

  if (!cms.enabled && visibleItems.length === 0) return null

  const updateItems = (nextItems: VideoCarouselItem[]) => {
    cms.updateField("videoCarousel", "items", nextItems)
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

  const applyBulkPaste = () => {
    const parsed = parseVideoEmbedBulk(bulkText)
    if (parsed.length === 0) {
      setBulkMessage("Nem találtunk YouTube/TikTok linket vagy embed kódot.")
      return
    }
    const next = mergeVideoEmbedItems(items, parsed)
    const added = next.length - items.length
    updateItems(next)
    setBulkText("")
    setBulkMessage(
      added > 0
        ? `${added} videó hozzáadva.`
        : "A beillesztett videók már szerepelnek a listában."
    )
  }

  return (
    <section id="videos" className="relative overflow-hidden border-y border-border/40 bg-background-dark py-24">
      <div className="absolute right-0 top-1/3 h-72 w-72 translate-x-1/3 rounded-full bg-primary/5 blur-[120px]" />
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
                    blockType="videoCarousel"
                    field="title"
                    value={title ?? "Videók"}
                    className="text-4xl font-heading font-black uppercase tracking-tighter text-foreground md:text-7xl"
                  />
                ) : (
                  title
                )}
              </Reveal>
            ) : null}
            {cms.enabled ? (
              <p className="mt-4 max-w-xl text-sm text-neutral-500">
                Illeszd be YouTube/TikTok URL-eket vagy a TikTok „Embed” HTML kódot. Többet egyszerre is be lehet másolni.
              </p>
            ) : null}
          </div>

          {cms.enabled ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-none border-border/60 px-4 text-xs font-black uppercase tracking-widest"
              onClick={() => updateItems([...items, { url: "", caption: "" }])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Videó hozzáadása
            </Button>
          ) : null}
        </div>

        {cms.enabled ? (
          <div className="mb-10 space-y-4">
            <div className="space-y-2 border border-border/40 bg-surface/30 p-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Tömeges beillesztés (URL-ek vagy TikTok embed HTML)
              </label>
              <textarea
                value={bulkText}
                onChange={(event) => {
                  setBulkText(event.target.value)
                  setBulkMessage(null)
                }}
                rows={5}
                placeholder={'Illeszd be a TikTok embed kódot vagy pl.\nhttps://www.tiktok.com/@…/video/…\nhttps://www.youtube.com/watch?v=…'}
                className="w-full border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-none border-border/60 px-3 text-xs font-black uppercase tracking-widest"
                  onClick={applyBulkPaste}
                  disabled={!bulkText.trim()}
                >
                  <ClipboardPaste className="mr-2 h-3.5 w-3.5" />
                  Beillesztés feldolgozása
                </Button>
                {bulkMessage ? <p className="text-xs text-muted-foreground">{bulkMessage}</p> : null}
              </div>
            </div>

            {items.map((item, index) => {
              const parsed = parseVideoEmbedUrl(item.url)
              return (
                <div
                  key={`video-edit-${index}`}
                  className="grid gap-2 border border-border/40 bg-surface/30 p-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    value={item.url}
                    onChange={(event) =>
                      updateItems(
                        items.map((current, idx) =>
                          idx === index ? { ...current, url: event.target.value } : current
                        )
                      )
                    }
                    onBlur={() => {
                      if (!item.url.trim() || !parsed.embedUrl) return
                      if (item.url.trim() === parsed.sourceUrl) return
                      updateItems(
                        items.map((current, idx) =>
                          idx === index ? { ...current, url: parsed.sourceUrl } : current
                        )
                      )
                    }}
                    placeholder="YouTube / TikTok URL vagy embed HTML"
                    className="h-10 border border-border bg-background px-3 text-sm text-foreground"
                  />
                  <input
                    value={item.caption ?? ""}
                    onChange={(event) =>
                      updateItems(
                        items.map((current, idx) =>
                          idx === index ? { ...current, caption: event.target.value } : current
                        )
                      )
                    }
                    placeholder="Felirat (opcionális)"
                    className="h-10 border border-border bg-background px-3 text-sm text-foreground"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => updateItems(items.filter((_, idx) => idx !== index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {item.url.trim() && !parsed.embedUrl ? (
                    <p className="text-xs text-rose-400 md:col-span-3">
                      Nem ismert videó. YouTube/TikTok URL vagy TikTok embed HTML kell.
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}

        {visibleItems.length > 0 ? (
          <Carousel
            opts={{ align: "start", loop: visibleItems.length > 1 }}
            className="mx-auto w-full max-w-5xl"
          >
            <CarouselContent>
              {visibleItems.map((item, index) => (
                <CarouselItem
                  key={`${item.parsed.embedUrl}-${index}`}
                  className={visibleItems.length > 1 ? "md:basis-4/5 lg:basis-3/5" : "basis-full"}
                >
                  <Reveal delayMs={index * REVEAL_STAGGER_MS}>
                    <figure className="overflow-hidden border border-border/40 bg-surface/40">
                      <div
                        className={
                          item.parsed.provider === "tiktok"
                            ? "relative mx-auto aspect-[9/16] max-h-[70vh] w-full max-w-sm bg-black"
                            : "relative aspect-video w-full bg-black"
                        }
                      >
                        <iframe
                          src={item.parsed.embedUrl!}
                          title={item.caption || `Videó ${index + 1}`}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                      {item.caption ? (
                        <figcaption className="border-t border-border/40 px-4 py-3 text-sm text-muted-foreground">
                          {item.caption}
                        </figcaption>
                      ) : null}
                    </figure>
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
        ) : cms.enabled ? (
          <div className="flex min-h-48 items-center justify-center border border-dashed border-border/60 bg-surface/30 p-8 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Még nincs videó. Illeszd be a TikTok embed kódot tömegesen, vagy add hozzá URL-ként.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
