"use client"

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
import type { EsPageContent } from "./schema"
import { DarkroomLightbox, useLightbox } from "../../components/Lightbox"
import "../../esv2.css"

const EMPTY_SECTION = { heading: "", body: "", image: "" }
const EMPTY_GALLERY_ITEM = { image: "", caption: "" }

export function EsPageRender({ content }: RenderProps<EsPageContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()
  const lightbox = useLightbox()

  const listOnly =
    !cms.enabled &&
    !content.hero.image &&
    content.gallery.every((item) => !item.image) &&
    content.sections.every((section) => !section.image)

  const rootClass = cn("esv2-root bg-background text-foreground", !cms.enabled && "esv2-cursor-on")

  if (listOnly) {
    return (
      <main className={rootClass}>
        <section className="esv2-page flex min-h-[62vh] flex-col items-center justify-center py-20">
          <Reveal variant="up">
            <h1 className="esv2-display text-center text-[clamp(2.4rem,6vw,4.6rem)]">
              {content.hero.title}
            </h1>
          </Reveal>
          <Reveal variant="left" delayMs={120} className="mt-12 w-full max-w-xl self-center md:self-start md:pl-[8%]">
            <ul className="space-y-2 text-left text-lg">
              {content.sections.map((section, idx) =>
                section.heading ? (
                  <li key={idx}>{section.heading}</li>
                ) : null
              )}
            </ul>
          </Reveal>
        </section>
      </main>
    )
  }

  return (
    <main className={rootClass}>
      <section className="esv2-page grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-end md:py-24">
        <div className="space-y-5">
          <Reveal variant="left">
            <h1 className="esv2-display text-[clamp(2.5rem,6vw,5.5rem)] tracking-tight">
              <EditableDocText path="hero.title" value={content.hero.title} />
            </h1>
          </Reveal>
          {(content.hero.subtitle || cms.enabled) && (
            <Reveal variant="up" delayMs={80}>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
              </p>
            </Reveal>
          )}
        </div>
        {(content.hero.image || cms.enabled) && (
          <Reveal variant="right">
            <EditableDocImage
              path="hero.image"
              src={content.hero.image}
              alt={content.hero.title}
              flexibleCrop
              usageLabel="Page hero"
              width={1600}
              height={1000}
              frameClassName="relative aspect-[3/2] overflow-hidden bg-muted/20"
            />
          </Reveal>
        )}
      </section>

      {(content.sections.length > 0 || cms.enabled) && (
        <section className="esv2-section py-8 md:py-16">
          <div className="esv2-page space-y-16 md:space-y-24">
            {cms.enabled ? (
              <CmsListAddButton
                label="Add section"
                onClick={() => cms.setPath("sections", [...content.sections, { ...EMPTY_SECTION }])}
              />
            ) : null}
            {content.sections.map((section, idx) => {
              if (!cms.enabled && !section.body.trim() && !section.heading.trim()) return null
              const reverse = idx % 2 === 1
              const hasImage = Boolean(section.image) || cms.enabled
              return (
                <Reveal key={idx} id={`section-${idx}`} variant={reverse ? "right" : "left"}>
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
                  <div
                    className={cn(
                      "grid items-start gap-8 md:gap-12",
                      hasImage ? "md:grid-cols-2" : "max-w-3xl"
                    )}
                  >
                    <div className={cn("space-y-4", reverse && hasImage && "md:order-2")}>
                      {(section.heading || cms.enabled) && (
                        <h2 className="text-[clamp(1.35rem,2.2vw,1.9rem)] font-bold">
                          <EditableDocText path={`sections.${idx}.heading`} value={section.heading} />
                        </h2>
                      )}
                      <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
                        <EditableDocText path={`sections.${idx}.body`} value={section.body} multiline />
                      </div>
                    </div>
                    {hasImage ? (
                      <div className={cn(reverse && "md:order-1")}>
                        <EditableDocImage
                          path={`sections.${idx}.image`}
                          src={section.image}
                          alt={section.heading || content.hero.title}
                          usageLabel={`Section ${idx + 1} image`}
                          width={1200}
                          height={900}
                          frameClassName="relative aspect-[4/3] overflow-hidden bg-muted/20"
                        />
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {(content.gallery.length > 0 || cms.enabled) && (
        <section className="esv2-section py-12 md:py-20">
          {cms.enabled ? (
            <div className="esv2-page mb-6">
              <CmsListAddButton
                label="Add gallery image"
                onClick={() => cms.setPath("gallery", [...content.gallery, { ...EMPTY_GALLERY_ITEM }])}
              />
            </div>
          ) : null}
          {cms.enabled ? (
            <div className="esv2-page grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.gallery.map((item, idx) => (
                <figure key={idx} className="space-y-2 border border-border p-2">
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
                    usageLabel={`Gallery ${idx + 1}`}
                    width={1200}
                    height={800}
                    frameClassName="relative aspect-[4/3] overflow-hidden bg-muted/20"
                  />
                  <figcaption className="px-1 text-sm text-muted-foreground">
                    <EditableDocText path={`gallery.${idx}.caption`} value={item.caption} />
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="esv2-service-grid px-2 md:px-3">
              {content.gallery.map((item, idx) => {
                if (!item.image) return null
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => lightbox.open(idx)}
                    className="esv2-focus esv2-labeled-tile relative aspect-[16/10] overflow-hidden"
                  >
                    <FallbackImage
                      src={mediaImageSrc(item.image)}
                      alt={item.caption || content.hero.title}
                      fill
                      quality={90}
                      className="esv2-labeled-tile__media object-cover"
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                    <span className="esv2-labeled-tile__veil" />
                    {item.caption ? (
                      <span className="esv2-labeled-tile__label text-[clamp(1rem,2vw,1.5rem)]">{item.caption}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
          <DarkroomLightbox
            items={content.gallery}
            index={lightbox.index}
            onClose={lightbox.close}
            onIndexChange={lightbox.setIndex}
          />
        </section>
      )}
    </main>
  )
}
