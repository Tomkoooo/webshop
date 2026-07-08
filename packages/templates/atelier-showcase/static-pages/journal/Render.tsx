"use client"

import { useState } from "react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { JournalContent } from "./schema"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { EditableDocRichText } from "@wse/core/features/template-cms/primitives/EditableDocRichText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { Button } from "@wse/core/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@wse/core/components/ui/dialog"
import { cn } from "@wse/core/lib/utils"

export function JournalRender({ content }: RenderProps<JournalContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const posts = content.posts

  const addPost = () => {
    cms.setPath("posts", [
      ...posts,
      {
        title: "Untitled",
        topic: "Topic",
        excerpt: "Short excerpt for the card.",
        bodyHtml: "<p>Full article HTML…</p>",
        coverImage: "",
      },
    ])
  }

  const removePost = (idx: number) => {
    cms.setPath(
      "posts",
      posts.filter((_, i) => i !== idx)
    )
  }

  const active = openIndex !== null ? posts[openIndex] : null

  return (
    <main className="min-h-screen bg-background pb-24 pt-28 text-foreground">
      <header className="container mx-auto max-w-3xl px-4 pb-12 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          <EditableDocText path="intro.title" value={content.intro.title} />
        </h1>
        {(content.intro.lede || cms.enabled) && (
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            <EditableDocText path="intro.lede" value={content.intro.lede} multiline />
          </p>
        )}
      </header>

      {cms.enabled ? (
        <div className="container mx-auto mb-8 flex flex-wrap justify-center gap-2 px-4">
          <Button type="button" size="sm" variant="outline" onClick={addPost}>
            Add post
          </Button>
        </div>
      ) : null}

      <div className="container mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {cms.enabled && posts.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center text-muted-foreground">
            <p className="mb-4 text-sm">No posts yet.</p>
            <Button type="button" variant="outline" onClick={addPost}>
              Add first post
            </Button>
          </div>
        ) : null}
        {posts.map((_, idx) => {
            const p = posts[idx] ?? {
              title: "",
              topic: "",
              excerpt: "",
              bodyHtml: "",
              coverImage: "",
            }
            if (!cms.enabled && !p.title?.trim() && !p.excerpt?.trim()) return null

            return (
              <article
                key={idx}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border border-border bg-surface/60 shadow-sm transition-shadow",
                  !cms.enabled && "cursor-pointer hover:shadow-md"
                )}
                onClick={() => {
                  if (!cms.enabled) setOpenIndex(idx)
                }}
                onKeyDown={(e) => {
                  if (!cms.enabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    setOpenIndex(idx)
                  }
                }}
                role={!cms.enabled ? "button" : undefined}
                tabIndex={!cms.enabled ? 0 : undefined}
              >
                {p.coverImage ? (
                  <div className="relative aspect-[16/10] w-full border-b border-border bg-muted">
                    <FallbackImage
                      src={mediaImageSrc(p.coverImage)}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : cms.enabled ? (
                  <div className="border-b border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <EditableDocText path={`posts.${idx}.coverImage`} value={p.coverImage} placeholder="/uploads/…" />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col gap-2 p-5 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    <EditableDocText path={`posts.${idx}.topic`} value={p.topic} />
                  </p>
                  <h2 className="font-serif text-xl font-semibold leading-snug">
                    <EditableDocText path={`posts.${idx}.title`} value={p.title} />
                  </h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    <EditableDocText path={`posts.${idx}.excerpt`} value={p.excerpt} multiline />
                  </p>
                  {cms.enabled ? (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Article HTML</p>
                      <EditableDocRichText path={`posts.${idx}.bodyHtml`} html={p.bodyHtml || "<p></p>"} />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="self-start"
                        onClick={(e) => {
                          e.stopPropagation()
                          removePost(idx)
                        }}
                      >
                        Remove post
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-auto pt-2 text-xs text-muted-foreground">Click to read</p>
                  )}
                </div>
              </article>
            )
          }
        )}
      </div>

      {!cms.enabled && active ? (
        <Dialog open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-border bg-background">
            <DialogHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{active.topic}</p>
              <DialogTitle className="font-serif text-2xl">{active.title}</DialogTitle>
            </DialogHeader>
            {active.coverImage ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                <FallbackImage
                  src={mediaImageSrc(active.coverImage)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
            <div
              className="prose prose-neutral max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: active.bodyHtml || "" }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </main>
  )
}
