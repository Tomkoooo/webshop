"use client"

import * as React from "react"
import { Reveal, RevealSwap, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import Link from "next/link"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"
import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"
import { DynamicLucideIcon, IconPicker } from "@wse/core/features/homepage-cms/components/primitives/IconPicker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@wse/core/components/ui/dropdown-menu"
import { Input } from "@wse/core/components/ui/input"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"

type HeroSlide = {
  title: string
  description: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  badges: string[]
  images: string[]
  imageDurationSeconds: number
  durationSeconds: number
}

function parseBadge(value: string): { icon: string; text: string } {
  const [rawIcon, ...rest] = value.split(":")
  const text = rest.length ? rest.join(":") : value
  if (rest.length) return { icon: rawIcon || "Star", text }
  return { icon: "Star", text: value }
}

function formatBadge(icon: string, text: string) {
  return `${icon}:${text}`
}

interface HeroProps {
  title?: string
  description?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  heroImage?: string
  badges?: string[]
  slides?: HeroSlide[]
}

export function Hero({
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  heroImage,
  badges,
  slides,
}: HeroProps) {
  const cms = useCmsEdit()
  const normalizedSlides = React.useMemo<HeroSlide[]>(() => {
    if (slides?.length) {
      return slides.map((slide) => ({
        ...slide,
        images: slide.images?.length ? slide.images : ["/generic-hero.svg"],
        imageDurationSeconds: Math.max(1, slide.imageDurationSeconds || 4),
        durationSeconds: Math.max(1, slide.durationSeconds || 6),
      }))
    }
    return [
      {
        title: title ?? "LOREM IPSUM DOLOR",
        description:
          description ??
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        primaryCtaLabel: primaryCtaLabel ?? "VIEW PRODUCTS",
        primaryCtaHref: primaryCtaHref ?? "/shop",
        secondaryCtaLabel: secondaryCtaLabel ?? "ABOUT",
        secondaryCtaHref: secondaryCtaHref ?? "/#about",
        badges: badges?.length ? badges : ["LOREM IPSUM", "DOLOR SIT", "AMET ELIT"],
        images: [heroImage ?? "/generic-hero.svg"],
        imageDurationSeconds: 4,
        durationSeconds: 6,
      },
    ]
  }, [badges, description, heroImage, primaryCtaHref, primaryCtaLabel, secondaryCtaHref, secondaryCtaLabel, slides, title])

  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0)
  const [activeImageIndex, setActiveImageIndex] = React.useState(0)
  const [openBadgeEditor, setOpenBadgeEditor] = React.useState<number | null>(null)
  const [openBadgeIconPicker, setOpenBadgeIconPicker] = React.useState<number | null>(null)

  const activeSlide = normalizedSlides[activeSlideIndex] ?? normalizedSlides[0]
  const activeImages = activeSlide?.images?.length ? activeSlide.images : ["/generic-hero.svg"]
  const displayHeroImage = activeImages[activeImageIndex % activeImages.length] || "/generic-hero.svg"
  const displayTitle = activeSlide?.title ?? "LOREM IPSUM DOLOR"
  const displayDescription = activeSlide?.description ?? ""
  const primaryLabel = activeSlide?.primaryCtaLabel ?? "VIEW PRODUCTS"
  const primaryHref = activeSlide?.primaryCtaHref ?? "/shop"
  const secondaryLabel = activeSlide?.secondaryCtaLabel ?? "ABOUT"
  const secondaryHref = activeSlide?.secondaryCtaHref ?? "/#about"
  const displayBadges = activeSlide?.badges?.length ? activeSlide.badges : ["star:LOREM IPSUM", "shield:DOLOR SIT", "zap:AMET ELIT"]

  const commitHeroSlides = (nextSlides: HeroSlide[], mirrorSlideIndex = activeSlideIndex) => {
    if (!cms.enabled) return
    const current = nextSlides[mirrorSlideIndex] ?? nextSlides[0]
    if (!current) return
    cms.patchBlockData("hero", {
      heroSlides: nextSlides,
      title: current.title,
      description: current.description,
      primaryCtaLabel: current.primaryCtaLabel,
      primaryCtaHref: current.primaryCtaHref,
      secondaryCtaLabel: current.secondaryCtaLabel,
      secondaryCtaHref: current.secondaryCtaHref,
      badges: current.badges,
      heroImage: current.images[0] ?? "/generic-hero.svg",
      heroImages: current.images,
      imageDurationSeconds: current.imageDurationSeconds,
      heroDurationSeconds: current.durationSeconds,
    })
  }

  const patchActiveSlide = (patch: Partial<HeroSlide>) => {
    const nextSlides = normalizedSlides.map((slide, idx) =>
      idx === activeSlideIndex ? { ...slide, ...patch } : slide
    )
    commitHeroSlides(nextSlides)
  }

  React.useEffect(() => {
    setActiveImageIndex(0)
  }, [activeSlideIndex])

  React.useEffect(() => {
    if (cms.enabled) return
    if (activeImages.length <= 1) return
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % activeImages.length)
    }, (activeSlide?.imageDurationSeconds || 4) * 1000)
    return () => clearInterval(timer)
  }, [activeImages.length, activeSlide?.imageDurationSeconds, cms.enabled])

  React.useEffect(() => {
    if (cms.enabled) return
    if (normalizedSlides.length <= 1) return
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % normalizedSlides.length)
    }, (activeSlide?.durationSeconds || 6) * 1000)
    return () => clearInterval(timer)
  }, [activeSlide?.durationSeconds, normalizedSlides.length, cms.enabled])

  // To maintain the "Krausz Barkácsmester" structure even with dynamic text, 
  // we check if the title is the default one and then split it.
  // If it's a new title, we just display it.
  const isDefaultTitle = !title || title === "LOREM IPSUM DOLOR"

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Dynamic Industrial Background Layers */}
      <div className="absolute inset-0 bg-background-dark z-0" />
      <div
        className="absolute inset-0 z-1 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, color-mix(in oklab, var(--theme-foreground) 6%, transparent) 0 1px, transparent 1px 4px)",
        }}
        aria-hidden
      />
      
      {/* Radical Glow Effects */}
      <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[180px] opacity-40" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[150px] opacity-20" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 min-h-[calc(100vh-80px)]">
          {/* Side Logo with Premium Floating Animation */}
          <Reveal mode="mount" className="flex justify-center lg:justify-start pt-10 lg:pt-0">
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-[400px] md:h-[400px] lg:w-[450px] lg:h-[450px] xl:w-[550px] xl:h-[550px] sf-hero-float">
              <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-110 animate-pulse" />
              <RevealSwap
                swapKey={`${activeSlideIndex}-${activeImageIndex}-${displayHeroImage}`}
                className="absolute inset-0 z-10"
              >
                {cms.enabled ? (
                  <div className="absolute inset-0 flex flex-col overflow-auto">
                    <EditableImage
                      src={displayHeroImage}
                      alt={displayTitle}
                      editMode
                      width={1200}
                      height={480}
                      flexibleCrop
                      className="mx-auto max-h-[min(420px,55vh)] w-full object-contain"
                      usageLabel="Hero banner / logó (aktív dia)"
                      onChange={(next) => {
                        const idx =
                          activeImages.length > 0
                            ? activeImageIndex % activeImages.length
                            : 0
                        const nextImages = activeImages.map((img, i) =>
                          i === idx ? next : img
                        )
                        patchActiveSlide({ images: nextImages })
                      }}
                    />
                  </div>
                ) : (
                  <FallbackImage
                    src={displayHeroImage}
                    alt="Placeholder hero image"
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 550px"
                    className="object-contain"
                    priority
                  />
                )}
              </RevealSwap>
            </div>
          </Reveal>

          {/* Typography Section */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <Reveal mode="mount" delayMs={REVEAL_STAGGER_MS} className="w-full">
              {cms.enabled ? (
                <div className="space-y-3">
                  <EditableTextInline
                    blockType="hero"
                    field="title"
                    value={displayTitle}
                    onCommit={(next) => patchActiveSlide({ title: next })}
                    className="text-3xl sm:text-4xl md:text-6xl lg:text-6xl xl:text-7xl font-heading font-black tracking-tighter text-foreground leading-[0.9] uppercase"
                  />
                  <EditableTextInline
                    blockType="hero"
                    field="description"
                    value={displayDescription}
                    onCommit={(next) => patchActiveSlide({ description: next })}
                    multiline
                    className="text-base sm:text-lg md:text-xl text-neutral-400 font-medium tracking-tight max-w-xl mx-auto lg:mx-0"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-6xl xl:text-7xl font-heading font-black mb-6 tracking-tighter text-foreground leading-[0.9] uppercase selection:bg-primary">
                    {isDefaultTitle ? (
                      <>
                        LOREM
                        <span className="block text-primary-foreground">IPSUM DOLOR</span>
                      </>
                    ) : (
                      <span className="block">
                        {(() => {
                          const words = displayTitle.split(" ")
                          if (words.length <= 1) return displayTitle
                          const firstPart = words.slice(0, -1).join(" ")
                          const lastWord = words[words.length - 1]
                          return (
                            <>
                              <span className="block">{firstPart}</span>
                              <span className="inline-block bg-primary-foreground/10 text-primary-foreground mt-2">{lastWord}</span>
                            </>
                          )
                        })()}
                      </span>
                    )}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-neutral-400 mb-10 font-medium tracking-tight max-w-xl mx-auto lg:mx-0">
                    {displayDescription}
                  </p>
                </>
              )}
            </Reveal>

            {/* Buttons */}
            <Reveal
              mode="mount"
              delayMs={REVEAL_STAGGER_MS * 2}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              {cms.enabled ? (
                <>
                  <EditableLinkInline
                    blockType="hero"
                    labelField="primaryCtaLabel"
                    hrefField="primaryCtaHref"
                    label={primaryLabel}
                    href={primaryHref}
                    onCommitLabel={(next) => patchActiveSlide({ primaryCtaLabel: next })}
                    onCommitHref={(next) => patchActiveSlide({ primaryCtaHref: next })}
                    className="btn-krausz w-full sm:w-auto bg-primary hover:bg-foreground hover:text-background text-primary-foreground h-14 sm:h-16 px-8 sm:px-10 text-lg border-none group transition-all duration-300"
                  />
                  <EditableLinkInline
                    blockType="hero"
                    labelField="secondaryCtaLabel"
                    hrefField="secondaryCtaHref"
                    label={secondaryLabel}
                    href={secondaryHref}
                    onCommitLabel={(next) => patchActiveSlide({ secondaryCtaLabel: next })}
                    onCommitHref={(next) => patchActiveSlide({ secondaryCtaHref: next })}
                    className="btn-krausz w-full sm:w-auto border-border text-foreground hover:bg-secondary hover:text-secondary-foreground h-14 sm:h-16 px-8 sm:px-10 text-lg group transition-all duration-300 bg-muted/40 backdrop-blur-sm"
                    buttonVariant="outline"
                  />
                </>
              ) : (
                <>
                  <Link href={primaryHref} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="btn-krausz w-full sm:w-auto bg-primary hover:bg-foreground hover:text-background text-primary-foreground h-14 sm:h-16 px-8 sm:px-10 text-lg border-none group transition-all duration-300"
                    >
                      {primaryLabel}
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href={secondaryHref} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="btn-krausz w-full sm:w-auto border-border text-foreground hover:bg-secondary hover:text-secondary-foreground h-14 sm:h-16 px-8 sm:px-10 text-lg group transition-all duration-300 bg-muted/40 backdrop-blur-sm"
                    >
                      {secondaryLabel}
                    </Button>
                  </Link>
                </>
              )}
            </Reveal>

            {/* Micro-Features */}
            <Reveal
              mode="mount"
              delayMs={REVEAL_STAGGER_MS * 3}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-12 w-full lg:max-w-xl"
            >
              {displayBadges.map((badge, i) => {
                const parsed = parseBadge(badge)
                return (
                <div key={i} className="flex flex-row sm:flex-col items-center lg:items-start justify-center sm:justify-start gap-3 sm:gap-1 p-3 border border-border/40 rounded-xl bg-muted/40 hover:border-primary-foreground/30 transition-all duration-300">
                  <DynamicLucideIcon name={parsed.icon} className="w-4 h-4 text-primary-foreground" />
                  <div className="flex flex-col">
                    {cms.enabled ? (
                      <DropdownMenu
                        open={openBadgeEditor === i}
                        onOpenChange={(open) => setOpenBadgeEditor(open ? i : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" size="xs">Szerkesztés</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 p-3 bg-surface border-border text-foreground shadow-xl opacity-100" align="start">
                          <div className="space-y-2">
                            <Input
                              value={parsed.text}
                              onChange={(event) => {
                                const nextBadges = displayBadges.map((item, idx) =>
                                  idx === i ? formatBadge(parsed.icon, event.target.value) : item
                                )
                                patchActiveSlide({ badges: nextBadges })
                              }}
                              className="h-8"
                            />
                            <IconPicker
                              value={parsed.icon}
                              triggerLabel="Ikon választás"
                              open={openBadgeIconPicker === i}
                              onOpenChange={(open) => setOpenBadgeIconPicker(open ? i : null)}
                              onChange={(iconName) => {
                                const nextBadges = displayBadges.map((item, idx) =>
                                  idx === i ? formatBadge(iconName, parsed.text) : item
                                )
                                patchActiveSlide({ badges: nextBadges })
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="xs"
                              onClick={() => {
                                const nextBadges = displayBadges.filter((_, idx) => idx !== i)
                                patchActiveSlide({ badges: nextBadges.length ? nextBadges : ["Star:Uj jelveny"] })
                                setOpenBadgeEditor(null)
                              }}
                            >
                              Badge törlése
                            </Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-[10px] font-black tracking-widest text-foreground leading-none">{parsed.text}</span>
                    )}
                  </div>
                </div>
                )
              })}
            </Reveal>
            {cms.enabled ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => patchActiveSlide({ badges: [...displayBadges, "Star:Uj jelveny"] })}
                >
                  Jelvény hozzáadása
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextSlides: HeroSlide[] = [
                      ...normalizedSlides,
                      {
                        title: "Új hero",
                        description: "",
                        primaryCtaLabel: "VIEW PRODUCTS",
                        primaryCtaHref: "/shop",
                        secondaryCtaLabel: "ABOUT",
                        secondaryCtaHref: "/#about",
                        badges: ["Star:Uj jelveny"],
                        images: ["/generic-hero.svg"],
                        imageDurationSeconds: 4,
                        durationSeconds: 6,
                      },
                    ]
                    commitHeroSlides(nextSlides, nextSlides.length - 1)
                    setActiveSlideIndex(nextSlides.length - 1)
                  }}
                >
                  Hero hozzáadása
                </Button>
                {normalizedSlides.length > 1 ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const nextSlides = normalizedSlides.filter(
                        (_, idx) => idx !== activeSlideIndex
                      )
                      commitHeroSlides(nextSlides, 0)
                      setActiveSlideIndex((prev) =>
                        Math.min(prev, Math.max(0, nextSlides.length - 1))
                      )
                    }}
                  >
                    Aktív hero törlése
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {(normalizedSlides.length > 1 || activeImages.length > 1) ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous"
            onClick={() => {
              if (normalizedSlides.length > 1) {
                setActiveSlideIndex((prev) => (prev - 1 + normalizedSlides.length) % normalizedSlides.length)
                return
              }
              setActiveImageIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length)
            }}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background-dark/70 border-border text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next"
            onClick={() => {
              if (normalizedSlides.length > 1) {
                setActiveSlideIndex((prev) => (prev + 1) % normalizedSlides.length)
                return
              }
              setActiveImageIndex((prev) => (prev + 1) % activeImages.length)
            }}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background-dark/70 border-border text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </>
      ) : null}



      {/* Industrial Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hidden md:block sf-scroll-nudge">
        <div className="w-px h-12 bg-linear-to-b from-primary to-transparent" />
      </div>
    </section>
  )
}
