"use client"

import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { EditorialContent } from "./schema"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { EditableDocRichText } from "@wse/core/features/template-cms/primitives/EditableDocRichText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { cn } from "@wse/core/lib/utils"
import { Button } from "@wse/core/components/ui/button"

export function EditorialRender({ content }: RenderProps<EditorialContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()
  const sectionSlots = cms.enabled
    ? Array.from({ length: Math.max(3, content.sections.length) }, (_, i) => i)
    : content.sections.map((_, i) => i)

  return (
    <main className="min-h-screen bg-background pb-24 pt-28 text-foreground">
      <section className="border-b border-border">
        <div className="container mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              <EditableDocText path="hero.title" value={content.hero.title} />
            </h1>
            {(content.hero.subtitle || cms.enabled) && (
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
              </p>
            )}
          </div>
          {content.hero.image || cms.enabled ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
              {content.hero.image ? (
                <FallbackImage
                  src={mediaImageSrc(content.hero.image)}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : null}
              {cms.enabled ? (
                <div className="absolute bottom-2 left-2 right-2 rounded bg-black/50 p-2 text-xs text-white">
                  <span className="block text-[10px] uppercase tracking-widest opacity-80">Cover URL</span>
                  <EditableDocText path="hero.image" value={content.hero.image} placeholder="/uploads/..." />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="container mx-auto max-w-4xl space-y-20 px-4 py-20">
        {cms.enabled ? (
          <div className="flex flex-wrap gap-2 border-b border-border pb-6">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                cms.setPath("sections", [
                  ...content.sections,
                  { heading: "New section", body: "<p></p>", image: "", layout: "imageRight" as const },
                ])
              }
            >
              Add section
            </Button>
            {content.sections.length > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => cms.setPath("sections", content.sections.slice(0, -1))}
              >
                Remove last
              </Button>
            ) : null}
          </div>
        ) : null}

        {sectionSlots.map((idx) => {
          const s = content.sections[idx] ?? {
            heading: "",
            body: "",
            image: "",
            layout: "imageRight" as const,
          }
          if (!cms.enabled && !s.heading?.trim() && !s.body?.trim() && !s.image) return null
          const layout = s.layout ?? "imageRight"
          const imageBlock =
            s.image || cms.enabled ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                {s.image ? (
                  <FallbackImage src={mediaImageSrc(s.image)} alt="" fill className="object-cover" />
                ) : null}
                {cms.enabled ? (
                  <div className="absolute bottom-2 left-2 right-2 rounded bg-black/50 p-2 text-xs text-white">
                    <EditableDocText path={`sections.${idx}.image`} value={s.image} placeholder="/uploads/..." />
                  </div>
                ) : null}
              </div>
            ) : null

          return (
            <section
              key={idx}
              className={cn(
                "grid gap-10 border-b border-border pb-16 last:border-0 md:gap-14 md:pb-20",
                layout === "fullBleed" ? "md:grid-cols-1" : "md:grid-cols-2 md:items-center",
                layout === "imageLeft" && "md:[&>div:first-child]:order-2"
              )}
            >
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-semibold md:text-3xl">
                  <EditableDocText path={`sections.${idx}.heading`} value={s.heading} />
                </h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground dark:prose-invert">
                  {cms.enabled ? (
                    <EditableDocRichText path={`sections.${idx}.body`} html={s.body || "<p></p>"} />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: s.body || "" }} />
                  )}
                </div>
                {cms.enabled ? (
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                    Layout
                    <select
                      className="mt-1 block w-full rounded border border-border bg-background px-2 py-2 text-sm"
                      value={layout}
                      onChange={(e) =>
                        cms.setPath(
                          `sections.${idx}.layout`,
                          e.target.value as "imageRight" | "imageLeft" | "fullBleed"
                        )
                      }
                    >
                      <option value="imageRight">Image right</option>
                      <option value="imageLeft">Image left</option>
                      <option value="fullBleed">Full width image</option>
                    </select>
                  </label>
                ) : null}
              </div>
              {layout !== "fullBleed" ? imageBlock : null}
              {layout === "fullBleed" ? <div className="md:col-span-2">{imageBlock}</div> : null}
            </section>
          )
        })}
      </div>
    </main>
  )
}
