"use client"

import type { HeroBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"
import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"

type Props = {
  block: HeroBlock
  onPatch: (field: keyof HeroBlock["data"], value: unknown) => void
  onPatchData?: (patch: Partial<HeroBlock["data"]>) => void
}

type HeroSlide = NonNullable<HeroBlock["data"]["heroSlides"]>[number]

function createSlide(seed?: Partial<HeroSlide>): HeroSlide {
  return {
    title: seed?.title ?? "New hero title",
    description: seed?.description ?? "Hero description",
    primaryCtaLabel: seed?.primaryCtaLabel ?? "Primary action",
    primaryCtaHref: seed?.primaryCtaHref ?? "/shop",
    secondaryCtaLabel: seed?.secondaryCtaLabel ?? "Secondary action",
    secondaryCtaHref: seed?.secondaryCtaHref ?? "#about",
    badges: seed?.badges?.length ? seed.badges : ["New badge"],
    images: seed?.images?.length ? seed.images : [seed?.images?.[0] ?? "/generic-hero.svg"],
    imageDurationSeconds: Math.max(1, seed?.imageDurationSeconds ?? 4),
    durationSeconds: Math.max(1, seed?.durationSeconds ?? 6),
  }
}

export function HeroBlockEditor({ block, onPatch, onPatchData }: Props) {
  const slides = Array.isArray(block.data.heroSlides) && block.data.heroSlides.length
    ? block.data.heroSlides
    : [
        createSlide({
          title: block.data.title,
          description: block.data.description,
          primaryCtaLabel: block.data.primaryCtaLabel,
          primaryCtaHref: block.data.primaryCtaHref,
          secondaryCtaLabel: block.data.secondaryCtaLabel,
          secondaryCtaHref: block.data.secondaryCtaHref,
          badges: block.data.badges,
          images: block.data.heroImages?.length ? block.data.heroImages : [block.data.heroImage || "/generic-hero.svg"],
          imageDurationSeconds: block.data.imageDurationSeconds,
          durationSeconds: block.data.heroDurationSeconds,
        }),
      ]

  const patchSlides = (nextSlides: HeroSlide[]) => {
    const normalized = nextSlides.length ? nextSlides : [createSlide()]
    const first = normalized[0]
    const payload: Partial<HeroBlock["data"]> = {
      heroSlides: normalized,
      title: first.title,
      description: first.description,
      primaryCtaLabel: first.primaryCtaLabel,
      primaryCtaHref: first.primaryCtaHref,
      secondaryCtaLabel: first.secondaryCtaLabel,
      secondaryCtaHref: first.secondaryCtaHref,
      badges: first.badges,
      heroImage: first.images[0] || "/generic-hero.svg",
      heroImages: first.images,
      imageDurationSeconds: first.imageDurationSeconds,
      heroDurationSeconds: first.durationSeconds,
    }
    if (onPatchData) {
      onPatchData(payload)
      return
    }
    onPatch("heroSlides", normalized)
    onPatch("title", first.title)
    onPatch("description", first.description)
    onPatch("primaryCtaLabel", first.primaryCtaLabel)
    onPatch("primaryCtaHref", first.primaryCtaHref)
    onPatch("secondaryCtaLabel", first.secondaryCtaLabel)
    onPatch("secondaryCtaHref", first.secondaryCtaHref)
    onPatch("badges", first.badges)
    onPatch("heroImage", first.images[0] || "/generic-hero.svg")
    onPatch("heroImages", first.images)
    onPatch("imageDurationSeconds", first.imageDurationSeconds)
    onPatch("heroDurationSeconds", first.durationSeconds)
  }

  return (
    <section className="py-16 border-b border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 text-left space-y-4">
        <p className="text-xs font-medium text-muted-foreground">Hero slides</p>
        {slides.map((slide, slideIndex) => (
          <div key={`hero-slide-${slideIndex}`} className="space-y-4 rounded-lg bg-muted/40 p-4 ring-1 ring-border/40">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Hero {slideIndex + 1}</p>
              <button
                type="button"
                onClick={() => patchSlides(slides.filter((_, idx) => idx !== slideIndex))}
                className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-destructive ring-1 ring-destructive/40"
              >
                Remove hero
              </button>
            </div>
            <EditableHeading
              value={slide.title}
              onChange={(value) => patchSlides(slides.map((item, idx) => (idx === slideIndex ? { ...item, title: value } : item)))}
              editMode
              className="text-4xl font-black text-white"
            />
            <EditableText
              value={slide.description}
              onChange={(value) => patchSlides(slides.map((item, idx) => (idx === slideIndex ? { ...item, description: value } : item)))}
              editMode
              multiline
              className="text-neutral-300 max-w-2xl"
            />
            <div className="grid md:grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Hero duration (seconds)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={slide.durationSeconds}
                  onChange={(event) =>
                    patchSlides(
                      slides.map((item, idx) =>
                        idx === slideIndex ? { ...item, durationSeconds: Math.max(1, Number(event.target.value) || 6) } : item
                      )
                    )
                  }
                  className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Image duration (seconds)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={slide.imageDurationSeconds}
                  onChange={(event) =>
                    patchSlides(
                      slides.map((item, idx) =>
                        idx === slideIndex ? { ...item, imageDurationSeconds: Math.max(1, Number(event.target.value) || 4) } : item
                      )
                    )
                  }
                  className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                />
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Slide images</p>
              {slide.images.map((image, imageIndex) => (
                <div key={`hero-slide-${slideIndex}-image-${imageIndex}`} className="space-y-2 rounded-lg bg-muted/40 p-3 ring-1 ring-border/40">
                  <EditableImage
                    src={image}
                    alt={slide.title}
                    editMode
                    flexibleCrop
                    width={1200}
                    height={480}
                    onChange={(value) =>
                      patchSlides(
                        slides.map((item, idx) =>
                          idx === slideIndex
                            ? { ...item, images: item.images.map((img, imgIdx) => (imgIdx === imageIndex ? value : img)) }
                            : item
                        )
                      )
                    }
                    usageLabel={`Hero ${slideIndex + 1} - image ${imageIndex + 1}`}
                    className="w-full h-52 object-cover ring-1 ring-border/40"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchSlides(
                        slides.map((item, idx) =>
                          idx === slideIndex ? { ...item, images: item.images.filter((_, imgIdx) => imgIdx !== imageIndex) } : item
                        )
                      )
                    }
                    className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-destructive ring-1 ring-destructive/40"
                  >
                    Remove image
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchSlides(
                    slides.map((item, idx) =>
                      idx === slideIndex ? { ...item, images: [...item.images, "/generic-hero.svg"] } : item
                    )
                  )
                }
                className="inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"
              >
                Add image
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-2 text-left">
              <input
                value={slide.primaryCtaLabel}
                onChange={(event) =>
                  patchSlides(slides.map((item, idx) => (idx === slideIndex ? { ...item, primaryCtaLabel: event.target.value } : item)))
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                placeholder="Elsődleges gomb felirat"
              />
              <input
                value={slide.primaryCtaHref}
                onChange={(event) =>
                  patchSlides(slides.map((item, idx) => (idx === slideIndex ? { ...item, primaryCtaHref: event.target.value } : item)))
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                placeholder="Elsődleges gomb link"
              />
              <input
                value={slide.secondaryCtaLabel}
                onChange={(event) =>
                  patchSlides(slides.map((item, idx) => (idx === slideIndex ? { ...item, secondaryCtaLabel: event.target.value } : item)))
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                placeholder="Másodlagos gomb felirat"
              />
              <input
                value={slide.secondaryCtaHref}
                onChange={(event) =>
                  patchSlides(slides.map((item, idx) => (idx === slideIndex ? { ...item, secondaryCtaHref: event.target.value } : item)))
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                placeholder="Másodlagos gomb link"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Jelvények</p>
              {slide.badges.map((badge, badgeIndex) => (
                <div key={`hero-slide-${slideIndex}-badge-${badgeIndex}`} className="flex gap-2">
                  <input
                    value={badge}
                    onChange={(event) =>
                      patchSlides(
                        slides.map((item, idx) =>
                          idx === slideIndex
                            ? { ...item, badges: item.badges.map((current, currentIdx) => (currentIdx === badgeIndex ? event.target.value : current)) }
                            : item
                        )
                      )
                    }
                    className="flex-1 h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchSlides(
                        slides.map((item, idx) =>
                          idx === slideIndex ? { ...item, badges: item.badges.filter((_, currentIdx) => currentIdx !== badgeIndex) } : item
                        )
                      )
                    }
                    className="inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-destructive ring-1 ring-destructive/40"
                  >
                    Törlés
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchSlides(
                    slides.map((item, idx) =>
                      idx === slideIndex ? { ...item, badges: [...item.badges, "New badge"] } : item
                    )
                  )
                }
                className="inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"
              >
                Jelvény hozzáadása
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => patchSlides([...slides, createSlide()])}
          className="inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"
        >
          Add hero
        </button>
        <div className="text-xs text-neutral-500">
          Tip: remove the top "Hero logo" uploader and manage hero visuals only here in the Hero block.
        </div>
      </div>
    </section>
  )
}
