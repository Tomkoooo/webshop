"use client"

import { useMemo, useState } from "react"
import { EditableDocImage } from "@wse/core/features/template-cms/primitives/EditableDocImage"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { Reveal } from "@wse/core/components/motion/css-reveal"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { SakkmedPageContent } from "./schema"
import { DarkroomLightbox, useLightbox } from "../../components/Lightbox"
import { Followspot } from "../../components/Followspot"
import { looksLikeSpecBody } from "../../components/utils"
import { PROJECT_LINKS, SERVICE_LINKS } from "../../lib/constants"
import "../../sakkmed.css"

const EMPTY_SECTION = { heading: "", body: "", image: "" }
const EMPTY_GALLERY_ITEM = { image: "", caption: "" }

function sectionKicker(title: string): string {
  if (PROJECT_LINKS.some((p) => p.label.toLowerCase() === title.toLowerCase() || title.includes("VIP") || title.includes("konténer") || title.includes("Konténer"))) {
    return "Projekt"
  }
  if (SERVICE_LINKS.some((s) => title.toLowerCase().includes(s.label.toLowerCase().slice(0, 4)))) {
    return "Szolgáltatás"
  }
  return "Szolgáltatás"
}

export function SakkmedPageRender({ content }: RenderProps<SakkmedPageContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()
  const lightbox = useLightbox()
  const [activeHeading, setActiveHeading] = useState<string | null>(null)

  const toc = useMemo(
    () =>
      content.sections
        .map((s, idx) => ({ idx, heading: s.heading?.trim() || "" }))
        .filter((s) => s.heading),
    [content.sections]
  )

  const galleryIndices = content.gallery.map((_, idx) => idx)
  const rootClass = cn("sakkmed-root bg-background text-foreground", cms.enabled && "sakkmed-cms-static")

  return (
    <main className={rootClass}>
      {!cms.enabled ? <Followspot /> : null}

      {/* Editorial hero */}
      <section className="sakkmed-grain relative overflow-hidden border-b border-border/40 pt-28 md:pt-32">
        <div className="sakkmed-page grid gap-10 pb-16 md:grid-cols-[1.1fr_0.9fr] md:items-end md:pb-24">
          <div className="relative z-10 space-y-5">
            <p className="sakkmed-kicker">{sectionKicker(content.hero.title)}</p>
            <h1 className="sakkmed-display text-[clamp(2.5rem,6vw,5.5rem)] tracking-tight">
              <EditableDocText path="hero.title" value={content.hero.title} />
            </h1>
            {(content.hero.subtitle || cms.enabled) && (
              <p className="max-w-xl text-lg leading-relaxed text-[var(--sm-body-muted,#C4C4CC)]">
                <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
              </p>
            )}
            {(content.contactEmail || cms.enabled) && (
              <div className="sakkmed-glass sakkmed-gold-rim inline-block rounded-xl px-4 py-3 text-sm">
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
            <div className="relative md:-mr-8 lg:-mr-16">
              <div
                className="relative overflow-hidden rounded-2xl border border-border/40 shadow-2xl"
                style={{ clipPath: "polygon(8% 0, 100% 0, 100% 92%, 0 100%)" }}
              >
                <EditableDocImage
                  path="hero.image"
                  src={content.hero.image}
                  alt={content.hero.title}
                  flexibleCrop
                  usageLabel="Oldal hero kép"
                  width={1200}
                  height={800}
                  frameClassName="relative aspect-[3/2] bg-muted/20"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sticky TOC */}
      {toc.length > 1 ? (
        <nav
          aria-label="Oldal szekciók"
          className="sticky top-[72px] z-20 border-b border-border/30 bg-background/80 backdrop-blur-md"
        >
          <div className="sakkmed-page flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {toc.map((item) => (
              <a
                key={item.idx}
                href={`#section-${item.idx}`}
                onClick={() => setActiveHeading(item.heading)}
                className={cn(
                  "sakkmed-focus shrink-0 rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors",
                  activeHeading === item.heading
                    ? "border-primary text-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary"
                )}
              >
                {item.heading}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      {/* Chapters */}
      {(content.sections.length > 0 || cms.enabled) && (
        <section className="sakkmed-section border-b border-border/40 py-16 md:py-24">
          <div className="sakkmed-page space-y-16 md:space-y-24">
            {cms.enabled ? (
              <CmsListAddButton
                label="Új szekció"
                onClick={() => cms.setPath("sections", [...content.sections, { ...EMPTY_SECTION }])}
              />
            ) : null}
            {content.sections.map((section, idx) => {
              if (!cms.enabled && !section.body.trim() && !section.heading.trim()) return null
              const reverse = idx % 2 === 1
              const isSpec = looksLikeSpecBody(section.body)
              const hasImage = Boolean(section.image) || cms.enabled
              const fullWidth = !section.heading.trim() && !hasImage

              return (
                <Reveal key={idx} id={`section-${idx}`}>
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.sections.length - 1}
                      onMoveUp={() => cms.setPath("sections", moveArrayItem(content.sections, idx, -1))}
                      onMoveDown={() => cms.setPath("sections", moveArrayItem(content.sections, idx, 1))}
                      onRemove={() =>
                        cms.setPath(
                          "sections",
                          content.sections.filter((_, itemIdx) => itemIdx !== idx)
                        )
                      }
                    />
                  ) : null}

                  {fullWidth ? (
                    <div className="mx-auto max-w-3xl space-y-4">
                      <div className="whitespace-pre-line text-lg leading-relaxed text-[var(--sm-body-muted,#C4C4CC)]">
                        <EditableDocText path={`sections.${idx}.body`} value={section.body} multiline />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "grid items-start gap-8 md:gap-12",
                        hasImage ? "md:grid-cols-2" : "max-w-3xl"
                      )}
                    >
                      <div className={cn("space-y-4", reverse && hasImage && "md:order-2")}>
                        {(section.heading || cms.enabled) && (
                          <h2 className="sakkmed-display text-[clamp(1.5rem,2.5vw,2.5rem)]">
                            <EditableDocText path={`sections.${idx}.heading`} value={section.heading} />
                          </h2>
                        )}
                        {isSpec && !cms.enabled ? (
                          <div className="sakkmed-spec-hud rounded-r-xl">
                            {section.body}
                          </div>
                        ) : (
                          <div className="whitespace-pre-line leading-relaxed text-[var(--sm-body-muted,#C4C4CC)]">
                            <EditableDocText path={`sections.${idx}.body`} value={section.body} multiline />
                          </div>
                        )}
                      </div>
                      {hasImage ? (
                        <div className={cn(reverse && "md:order-1")}>
                          <EditableDocImage
                            path={`sections.${idx}.image`}
                            src={section.image}
                            alt={section.heading || content.hero.title}
                            usageLabel={`Szekció ${idx + 1} kép`}
                            width={800}
                            height={800}
                            frameClassName="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/40 bg-muted/20"
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {/* Gallery */}
      {(content.gallery.length > 0 || cms.enabled) && (
        <section className="sakkmed-section bg-[var(--sm-deep,#070708)] py-16 md:py-24">
          <div className="space-y-6">
            {cms.enabled ? (
              <div className="sakkmed-page">
                <CmsListAddButton
                  label="Új galéria kép"
                  onClick={() =>
                    cms.setPath("gallery", [...content.gallery, { ...EMPTY_GALLERY_ITEM }])
                  }
                />
              </div>
            ) : null}

            {cms.enabled ? (
              <div className="sakkmed-page grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryIndices.map((idx) => {
                  const item = content.gallery[idx] ?? EMPTY_GALLERY_ITEM
                  return (
                    <figure key={idx} className="space-y-2 rounded-xl border border-border/60 bg-surface/30 p-2">
                      <CmsListItemToolbar
                        canMoveUp={idx > 0}
                        canMoveDown={idx < content.gallery.length - 1}
                        onMoveUp={() => cms.setPath("gallery", moveArrayItem(content.gallery, idx, -1))}
                        onMoveDown={() => cms.setPath("gallery", moveArrayItem(content.gallery, idx, 1))}
                        onRemove={() =>
                          cms.setPath(
                            "gallery",
                            content.gallery.filter((_, itemIdx) => itemIdx !== idx)
                          )
                        }
                      />
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
                      <figcaption className="px-1 text-sm text-muted-foreground">
                        <EditableDocText path={`gallery.${idx}.caption`} value={item.caption} />
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            ) : (
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:px-8">
                {content.gallery.map((item, idx) => {
                  if (!item.image) return null
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => lightbox.open(idx)}
                      className="sakkmed-focus relative w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/40 sm:w-[48vw] lg:w-[32vw]"
                    >
                      <div className="relative aspect-[4/3]">
                        <FallbackImage
                          src={mediaImageSrc(item.image)}
                          alt={item.caption || content.hero.title}
                          fill
                          className="object-cover"
                          sizes="40vw"
                          loading="lazy"
                        />
                      </div>
                      {item.caption ? (
                        <span className="absolute bottom-3 left-3 text-sm text-foreground drop-shadow">{item.caption}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <DarkroomLightbox
            items={content.gallery}
            index={lightbox.index}
            onClose={lightbox.close}
            onIndexChange={lightbox.setIndex}
          />
        </section>
      )}

      {/* Contact strip */}
      {content.contactEmail && !cms.enabled ? (
        <div className="sticky bottom-0 z-30 border-t border-primary/30 bg-background/90 backdrop-blur-md">
          <div className="sakkmed-page flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span className="font-medium">{content.contactLabel}</span>
            <a href={`mailto:${content.contactEmail}`} className="sakkmed-focus text-accent hover:underline">
              {content.contactEmail}
            </a>
          </div>
        </div>
      ) : null}
    </main>
  )
}
