"use client"

import * as React from "react"
import { Reveal, REVEAL_STAGGER_MS } from "@/components/motion/css-reveal"
import { Quote, Star } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel"
import { useCmsEdit } from "@/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@/features/homepage-cms/components/primitives/EditableTextInline"
import { FallbackImage } from "@/components/common/FallbackImage"
import { PlainTextWithLinks } from "@/lib/linkify-plain-text"
import { TestimonialSourceLink } from "@/lib/testimonial-source-link"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@/features/template-cms/primitives/CmsListItemToolbar"
type ReviewItem = {
  id: string
  name: string
  role: string
  content: string
  rating: number
  avatar: string
  sourceUrl?: string
}

type TestimonialItem = {
  quote: string
  name: string
  role: string
  sourceUrl?: string
  rating: number
}

type Cms = ReturnType<typeof useCmsEdit>

function patchTestimonialItems(
  cms: Cms,
  blockId: string,
  items: TestimonialItem[],
  index: number,
  patch: Partial<TestimonialItem>
) {
  cms.patchBlockData(
    "testimonials",
    {
      items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    },
    blockId
  )
}

function setTestimonialItems(cms: Cms, blockId: string, items: TestimonialItem[]) {
  cms.patchBlockData("testimonials", { items }, blockId)
}

export function Reviews({
  blockId,
  reviews = [],
  items = [],
  title,
  subtitle,
}: {
  blockId?: string
  reviews?: ReviewItem[]
  items?: TestimonialItem[]
  title?: string
  subtitle?: string
}) {
  const cms = useCmsEdit()
  const isCmsBlock = Boolean(blockId)
  const cmsItems = isCmsBlock ? items : []
  const showSection = reviews.length > 0 || (cms.enabled && isCmsBlock)

  if (!showSection) {
    return null
  }

  return (
    <section id="reviews" className="py-32 bg-background-dark border-t border-border/40 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-24">
          <Reveal
            as="h2"
            className="text-4xl md:text-7xl font-heading font-black mb-6 text-foreground uppercase tracking-tighter"
          >
            {cms.enabled && isCmsBlock ? (
              <EditableTextInline
                blockType="testimonials"
                blockId={blockId}
                field="title"
                value={title ?? "Vásárlói vélemények"}
                className="text-4xl md:text-7xl font-heading font-black text-white uppercase tracking-tighter text-center"
              />
            ) : (
              title ?? "LOREM REVIEWS"
            )}
          </Reveal>
          <Reveal as="p" delayMs={REVEAL_STAGGER_MS} className="text-neutral-400 text-xl max-w-2xl mx-auto leading-relaxed">
            {cms.enabled && isCmsBlock ? (
              <EditableTextInline
                blockType="testimonials"
                blockId={blockId}
                field="subtitle"
                value={
                  subtitle ??
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                }
                className="text-neutral-400 text-xl max-w-2xl mx-auto leading-relaxed text-center"
              />
            ) : (
              subtitle ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            )}
          </Reveal>
        </div>

        {cms.enabled && isCmsBlock && blockId ? (
          <CmsListAddButton
            label="Vélemény hozzáadása"
            className="mb-6"
            onClick={() =>
              setTestimonialItems(cms, blockId, [
                ...cmsItems,
                { quote: "Vásárlói idézet", name: "Vásárló", role: "Szerepkör", sourceUrl: "", rating: 5 },
              ])
            }
          />
        ) : null}

        {reviews.length > 0 ? (
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {reviews.map((review, idx) => (
                <CarouselItem key={review.id} className="p-4">
                  <Reveal delayMs={idx * REVEAL_STAGGER_MS} className="h-full">
                    <div className="glass-card p-12 md:p-16 relative overflow-hidden h-full border-border group hover:border-primary-foreground/30 transition-all duration-500">
                      {cms.enabled && isCmsBlock && blockId ? (
                        <CmsListItemToolbar
                          className="absolute right-4 top-4 z-20"
                          canMoveUp={idx > 0}
                          canMoveDown={idx < reviews.length - 1}
                          onMoveUp={() =>
                            setTestimonialItems(cms, blockId, moveArrayItem(cmsItems, idx, -1))
                          }
                          onMoveDown={() =>
                            setTestimonialItems(cms, blockId, moveArrayItem(cmsItems, idx, 1))
                          }
                          onRemove={() =>
                            setTestimonialItems(
                              cms,
                              blockId,
                              cmsItems.filter((_, itemIdx) => itemIdx !== idx)
                            )
                          }
                        />
                      ) : null}

                      <Quote className="w-24 h-24 text-primary-foreground/10 absolute -top-4 -right-4 transition-transform group-hover:scale-110" />

                      <div className="flex gap-1.5 mb-10">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < review.rating ? "fill-highlight text-highlight" : "text-white/10"}`}
                          />
                        ))}
                      </div>

                      <p className="text-foreground text-2xl md:text-3xl italic mb-14 relative z-10 font-medium leading-normal tracking-tight">
                        &ldquo;
                        {cms.enabled && isCmsBlock && blockId ? (
                          <EditableTextInline
                            blockType="testimonials"
                            blockId={blockId}
                            field={`items.${idx}.quote`}
                            value={review.content}
                            multiline
                            onCommit={(value) =>
                              patchTestimonialItems(cms, blockId, cmsItems, idx, { quote: value })
                            }
                          />
                        ) : (
                          <PlainTextWithLinks text={review.content} />
                        )}
                        &rdquo;
                      </p>

                      <div className="flex items-center gap-6 border-t border-border/40 pt-10">
                        <div className="relative w-16 h-16 rounded-none overflow-hidden border-2 border-primary-foreground/30">
                          <FallbackImage
                            src={review.avatar}
                            alt={review.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-foreground text-xl font-heading font-black tracking-wider uppercase mb-1">
                            {cms.enabled && isCmsBlock && blockId ? (
                              <EditableTextInline
                                blockType="testimonials"
                                blockId={blockId}
                                field={`items.${idx}.name`}
                                value={review.name}
                                onCommit={(value) =>
                                  patchTestimonialItems(cms, blockId, cmsItems, idx, { name: value })
                                }
                              />
                            ) : (
                              <TestimonialSourceLink name={review.name} sourceUrl={review.sourceUrl} />
                            )}
                          </h4>
                          {(review.role || (cms.enabled && isCmsBlock)) ? (
                            <p className="text-primary-foreground text-sm font-black uppercase tracking-[0.2em]">
                              {cms.enabled && isCmsBlock && blockId ? (
                                <EditableTextInline
                                  blockType="testimonials"
                                  blockId={blockId}
                                  field={`items.${idx}.role`}
                                  value={review.role}
                                  onCommit={(value) =>
                                    patchTestimonialItems(cms, blockId, cmsItems, idx, { role: value })
                                  }
                                />
                              ) : review.role ? (
                                <PlainTextWithLinks text={review.role} />
                              ) : null}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-16 gap-6">
              <CarouselPrevious className="relative left-0 translate-y-0 h-16 w-16 bg-muted/40 border-border text-foreground hover:bg-primary hover:border-primary-foreground/40 rounded-none" />
              <CarouselNext className="relative right-0 translate-y-0 h-16 w-16 bg-muted/40 border-border text-foreground hover:bg-primary hover:border-primary-foreground/40 rounded-none" />
            </div>
          </Carousel>
        ) : cms.enabled && isCmsBlock ? (
          <p className="text-center text-sm text-neutral-500">
            Még nincs vélemény. Kattints a „Vélemény hozzáadása” gombra.
          </p>
        ) : null}
      </div>
    </section>
  )
}
