"use client"

import { EditableDocImage } from "@wse/core/features/template-cms/primitives/EditableDocImage"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { SakkmedPageContent } from "./schema"

const EMPTY_SECTION = { heading: "", body: "", image: "" }
const EMPTY_GALLERY_ITEM = { image: "", caption: "" }

export function SakkmedPageRender({ content }: RenderProps<SakkmedPageContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()

  const sectionIndices = cms.enabled
    ? content.sections.map((_, idx) => idx)
    : content.sections.map((_, idx) => idx)

  const galleryIndices = cms.enabled
    ? content.gallery.map((_, idx) => idx)
    : content.gallery.map((_, idx) => idx)

  return (
    <main className="bg-background text-foreground pt-28">
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-start">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Szolgáltatás</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              <EditableDocText path="hero.title" value={content.hero.title} />
            </h1>
            {(content.hero.subtitle || cms.enabled) && (
              <p className="text-lg text-muted-foreground">
                <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
              </p>
            )}
            {(content.contactEmail || cms.enabled) && (
              <div className="rounded-lg border border-border/60 bg-surface/40 p-4 text-sm">
                <p className="font-semibold text-foreground">
                  <EditableDocText path="contactLabel" value={content.contactLabel} />
                </p>
                <p className="mt-1 text-accent">
                  <EditableDocText path="contactEmail" value={content.contactEmail} />
                </p>
              </div>
            )}
          </div>
          {(content.hero.image || cms.enabled) && (
            <EditableDocImage
              path="hero.image"
              src={content.hero.image}
              alt={content.hero.title}
              flexibleCrop
              usageLabel="Oldal hero kép"
              width={1200}
              height={800}
              frameClassName="relative aspect-[3/2] overflow-hidden rounded-xl border border-border/60 bg-muted/20"
            />
          )}
        </div>
      </section>

      {(content.sections.length > 0 || cms.enabled) && (
        <section className="border-b border-border/60 py-16">
          <div className="mx-auto max-w-4xl space-y-10 px-4">
            {cms.enabled ? (
              <CmsListAddButton
                label="Új szekció"
                onClick={() =>
                  cms.setPath("sections", [...content.sections, { ...EMPTY_SECTION }])
                }
              />
            ) : null}
            {sectionIndices.map((idx) => {
              const section = content.sections[idx] ?? EMPTY_SECTION
              if (!cms.enabled && !section.body.trim() && !section.heading.trim()) return null
              return (
                <article
                  key={idx}
                  className="space-y-3 rounded-xl border border-dashed border-border/50 p-4 md:border-0 md:p-0"
                >
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.sections.length - 1}
                      onMoveUp={() =>
                        cms.setPath("sections", moveArrayItem(content.sections, idx, -1))
                      }
                      onMoveDown={() =>
                        cms.setPath("sections", moveArrayItem(content.sections, idx, 1))
                      }
                      onRemove={() =>
                        cms.setPath(
                          "sections",
                          content.sections.filter((_, itemIdx) => itemIdx !== idx)
                        )
                      }
                    />
                  ) : null}
                  <div className="grid gap-6 md:grid-cols-[1fr_180px] md:items-start">
                    <div className="space-y-3">
                      {(section.heading || cms.enabled) && (
                        <h2 className="text-2xl font-semibold">
                          <EditableDocText path={`sections.${idx}.heading`} value={section.heading} />
                        </h2>
                      )}
                      <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
                        <EditableDocText path={`sections.${idx}.body`} value={section.body} multiline />
                      </div>
                    </div>
                    {(section.image || cms.enabled) && (
                      <EditableDocImage
                        path={`sections.${idx}.image`}
                        src={section.image}
                        alt={section.heading || content.hero.title}
                        usageLabel={`Szekció ${idx + 1} kép`}
                        width={360}
                        height={360}
                        frameClassName="relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted/20"
                      />
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {(content.gallery.length > 0 || cms.enabled) && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl space-y-4 px-4">
            {cms.enabled ? (
              <CmsListAddButton
                label="Új galéria kép"
                onClick={() =>
                  cms.setPath("gallery", [...content.gallery, { ...EMPTY_GALLERY_ITEM }])
                }
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryIndices.map((idx) => {
                const item = content.gallery[idx] ?? EMPTY_GALLERY_ITEM
                if (!cms.enabled && !item.image) return null
                return (
                  <figure
                    key={idx}
                    className="space-y-2 rounded-xl border border-border/60 bg-surface/30 p-2"
                  >
                    {cms.enabled ? (
                      <CmsListItemToolbar
                        canMoveUp={idx > 0}
                        canMoveDown={idx < content.gallery.length - 1}
                        onMoveUp={() =>
                          cms.setPath("gallery", moveArrayItem(content.gallery, idx, -1))
                        }
                        onMoveDown={() =>
                          cms.setPath("gallery", moveArrayItem(content.gallery, idx, 1))
                        }
                        onRemove={() =>
                          cms.setPath(
                            "gallery",
                            content.gallery.filter((_, itemIdx) => itemIdx !== idx)
                          )
                        }
                      />
                    ) : null}
                    {(item.image || cms.enabled) && (
                      <EditableDocImage
                        path={`gallery.${idx}.image`}
                        src={item.image}
                        alt={item.caption || content.hero.title}
                        flexibleCrop
                        usageLabel={`Galéria ${idx + 1}`}
                        width={800}
                        height={600}
                        frameClassName="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted/20"
                      />
                    )}
                    {(item.caption || cms.enabled) && (
                      <figcaption className="px-1 text-sm text-muted-foreground">
                        <EditableDocText path={`gallery.${idx}.caption`} value={item.caption} />
                      </figcaption>
                    )}
                  </figure>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
