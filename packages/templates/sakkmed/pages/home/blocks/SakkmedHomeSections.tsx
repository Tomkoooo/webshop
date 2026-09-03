"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { SiteContactEmailsList } from "@wse/core/components/site-contact/SiteContactEmailsList"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import type { HomepageBlock, HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import { PROJECT_LINKS, SERVICE_LINKS } from "../../../lib/constants"
import { ChapterRail } from "../../../components/ChapterRail"
import { Followspot } from "../../../components/Followspot"
import { DarkroomLightbox, useLightbox } from "../../../components/Lightbox"
import { LogoMarquee } from "../../../components/LogoMarquee"
import { MagneticGoldButton } from "../../../components/MagneticGoldButton"
import { StatOdometer } from "../../../components/StatOdometer"
import { padIndex, splitPipeItems } from "../../../components/utils"
import "../../../sakkmed.css"

const HERO_BACKGROUND_FALLBACK = ""
const HERO_BLOCK_ID = "hero-sakkmed"
const SERVICES_BLOCK_ID = "services-sakkmed"
const ABOUT_BLOCK_ID = "about-sakkmed"
const PROJECTS_BLOCK_ID = "projects-sakkmed"
const CLIENTS_BLOCK_ID = "clients-sakkmed"
const GALLERY_BLOCK_ID = "gallery-sakkmed"
const CONTACT_BLOCK_ID = "contact-sakkmed"

type Props = {
  snapshot: HomepageSnapshot
  siteContact: { emails: Array<{ id: string; label: string; email: string }> }
}

function block<T extends { type: string }>(snapshot: HomepageSnapshot, type: T["type"], id?: string) {
  return snapshot.blocks.find(
    (b) => b.type === type && b.enabled !== false && (!id || b.id === id)
  )
}

function patchBlockArray<T extends Record<string, unknown>>(
  cms: ReturnType<typeof useCmsEdit>,
  blockType: HomepageBlock["type"],
  blockId: string,
  field: string,
  items: T[],
  index: number,
  patch: Partial<T>
) {
  cms.patchBlockData(
    blockType,
    {
      [field]: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    },
    blockId
  )
}

function setBlockArray<T>(
  cms: ReturnType<typeof useCmsEdit>,
  blockType: HomepageBlock["type"],
  blockId: string,
  field: string,
  items: T[]
) {
  cms.patchBlockData(blockType, { [field]: items }, blockId)
}

function HeadlineReveal({ text, className }: { text: string; className?: string }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <span className={cn(ready && "sakkmed-headline--ready", className)} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="sakkmed-headline-word" style={{ ["--word-i" as string]: i }}>
          <span className="pr-[0.2em]">{word}</span>
        </span>
      ))}
    </span>
  )
}

function PipeChips({ value }: { value: string }) {
  const chips = splitPipeItems(value)
  if (chips.length <= 1) {
    return <span className="whitespace-pre-line">{value}</span>
  }
  return (
    <ul className="mt-3 space-y-2">
      {chips.map((chip) => (
        <li
          key={chip}
          className="flex gap-2 border-b border-border/30 pb-2 text-sm text-[var(--sm-body-muted,#C4C4CC)] last:border-0 last:pb-0"
        >
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
          <span>{chip}</span>
        </li>
      ))}
    </ul>
  )
}

function TypeWall({ value }: { value: string }) {
  const chips = splitPipeItems(value)
  if (chips.length <= 1) {
    return <p className="mt-3 text-sm leading-relaxed text-[var(--sm-body-muted,#C4C4CC)] whitespace-pre-line">{value}</p>
  }
  const row = chips.join("  ·  ") + "  ·  "
  return (
    <div className="mt-4 space-y-2 overflow-hidden">
      <div className="sakkmed-marquee hidden w-max gap-8 whitespace-nowrap text-sm uppercase tracking-[0.18em] text-primary/80 md:flex">
        <span>{row}</span>
        <span aria-hidden>{row}</span>
      </div>
      <div className="flex flex-wrap gap-2 md:hidden">
        {chips.map((c) => (
          <span key={c} className="rounded-full border border-border/40 px-2.5 py-1 text-xs text-[var(--sm-body-muted,#C4C4CC)]">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function AboutDisclosure({
  items,
  cms,
}: {
  items: Array<{ title: string; content: string }>
  cms: ReturnType<typeof useCmsEdit>
}) {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <div className="mt-12 space-y-2 border-t border-border/40">
      {cms.enabled ? (
        <CmsListAddButton
          label="Új accordion"
          className="mb-4"
          onClick={() =>
            setBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", [
              ...items,
              { title: "Új blokk", content: "" },
            ])
          }
        />
      ) : null}
      {items.map((item, idx) => {
        const open = openIdx === idx
        return (
          <div key={idx} className="border-b border-border/40">
            {cms.enabled ? (
              <CmsListItemToolbar
                canMoveUp={idx > 0}
                canMoveDown={idx < items.length - 1}
                onMoveUp={() =>
                  setBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", moveArrayItem(items, idx, -1))
                }
                onMoveDown={() =>
                  setBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", moveArrayItem(items, idx, 1))
                }
                onRemove={() =>
                  setBlockArray(
                    cms,
                    "about",
                    ABOUT_BLOCK_ID,
                    "accordions",
                    items.filter((_, i) => i !== idx)
                  )
                }
              />
            ) : null}
            <h3>
              <button
                type="button"
                className="sakkmed-focus flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left"
                aria-expanded={open}
                onClick={() => setOpenIdx(open ? -1 : idx)}
              >
                <span className="font-semibold text-primary">
                  <EditableTextInline
                    blockType="about"
                    blockId={ABOUT_BLOCK_ID}
                    field={`accordions.${idx}.title`}
                    value={item.title}
                    onCommit={(value) =>
                      patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", items, idx, {
                        title: value,
                      })
                    }
                  />
                </span>
                <span className="sakkmed-mono text-xs text-muted-foreground">{open ? "−" : "+"}</span>
              </button>
            </h3>
            {open || cms.enabled ? (
              <div className={cn("pb-5", !open && cms.enabled && "opacity-60")}>
                {cms.enabled ? (
                  <EditableTextInline
                    blockType="about"
                    blockId={ABOUT_BLOCK_ID}
                    field={`accordions.${idx}.content`}
                    value={item.content.replace(/\s*\|\s*/g, "\n")}
                    multiline
                    onCommit={(value) =>
                      patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", items, idx, {
                        content: value,
                      })
                    }
                  />
                ) : (
                  <TypeWall value={item.content} />
                )}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function SakkmedHomeSections({ snapshot, siteContact }: Props) {
  const cms = useCmsEdit()
  const lightbox = useLightbox()
  const hero = block(snapshot, "hero", HERO_BLOCK_ID)
  const services = block(snapshot, "features", SERVICES_BLOCK_ID)
  const about = block(snapshot, "about", ABOUT_BLOCK_ID)
  const projects = block(snapshot, "gallery", PROJECTS_BLOCK_ID)
  const clients = block(snapshot, "gallery", CLIENTS_BLOCK_ID)
  const gallery = block(snapshot, "gallery", GALLERY_BLOCK_ID)
  const contact = block(snapshot, "contact", CONTACT_BLOCK_ID)

  const heroData = hero?.type === "hero" ? hero.data : null
  const servicesData = services?.type === "features" ? services.data : null
  const aboutData = about?.type === "about" ? about.data : null
  const projectsData = projects?.type === "gallery" ? projects.data : null
  const clientsData = clients?.type === "gallery" ? clients.data : null
  const galleryData = gallery?.type === "gallery" ? gallery.data : null
  const contactData = contact?.type === "contact" ? contact.data : null

  const heroBackground = heroData?.heroImage || HERO_BACKGROUND_FALLBACK
  const heroBadge = heroData?.badges?.[0] || "SAKKMED 2005 Kft."
  const galleryItems = galleryData?.items || []
  const galleryCaptions = useMemo(
    () => [...new Set(galleryItems.map((i) => i.caption).filter(Boolean))] as string[],
    [galleryItems]
  )
  const [galleryFilter, setGalleryFilter] = useState<string | null>(null)
  const filteredGallery = galleryFilter
    ? galleryItems.map((item, idx) => ({ item, idx })).filter(({ item }) => item.caption === galleryFilter)
    : galleryItems.map((item, idx) => ({ item, idx }))

  const chapters = [
    { id: "services", label: servicesData?.title || "Szolgáltatásaink" },
    { id: "about", label: aboutData?.title || "Rólunk" },
    { id: "projects", label: projectsData?.title || "Projektjeink" },
    { id: "clients", label: clientsData?.title || "Ügyfeleink" },
    { id: "gallery", label: galleryData?.title || "Galéria" },
    { id: "contact", label: contactData?.title || "Kapcsolat" },
  ]

  const rootClass = cn("sakkmed-root", cms.enabled && "sakkmed-cms-static")

  return (
    <div className={rootClass}>
      {!cms.enabled ? <Followspot /> : null}
      {!cms.enabled ? <ChapterRail chapters={chapters} /> : null}

      {/* HERO */}
      <section className="sakkmed-grain relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <div className={cn("absolute inset-0", !cms.enabled && "sakkmed-kenburns")}>
            <FallbackImage
              src={mediaImageSrc(heroBackground)}
              alt=""
              fill
              priority={!cms.enabled}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-[var(--sm-deep,#070708)]" aria-hidden />
        <div className="absolute inset-0 bg-black/30" aria-hidden />

        {cms.enabled ? (
          <div className="cms-admin-control absolute left-4 top-24 z-20 max-w-md rounded-lg border border-dashed border-foreground/30 bg-black/70 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-foreground/70">Hero háttérkép</p>
            <EditableImage
              src={mediaImageSrc(heroBackground)}
              alt=""
              editMode
              flexibleCrop
              separateControls
              usageLabel="Hero háttérkép"
              className="h-28 w-full object-cover"
              width={2048}
              height={1365}
              onChange={(next) => cms.patchBlockData("hero", { heroImage: next }, HERO_BLOCK_ID)}
            />
          </div>
        ) : null}

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:pb-24">
          <div className="max-w-3xl space-y-6">
            {cms.enabled ? (
              <p className="sakkmed-kicker">
                <EditableTextInline
                  blockType="hero"
                  blockId={HERO_BLOCK_ID}
                  field="badges"
                  value={heroBadge}
                  onCommit={(value) => cms.patchBlockData("hero", { badges: [value] }, HERO_BLOCK_ID)}
                />
              </p>
            ) : (
              <>
                <p className="sakkmed-kicker md:hidden">{heroBadge}</p>
                <p
                  className="pointer-events-none absolute right-4 top-1/2 hidden origin-center -translate-y-1/2 rotate-90 sakkmed-kicker whitespace-nowrap md:block"
                  aria-hidden
                >
                  {heroBadge}
                </p>
              </>
            )}
            <div className="space-y-2">
              <h1 className="sakkmed-display text-[clamp(2.75rem,8vw,7.5rem)] uppercase text-foreground drop-shadow-md">
                {cms.enabled ? (
                  <EditableTextInline
                    blockType="hero"
                    blockId={HERO_BLOCK_ID}
                    field="title"
                    value={heroData?.title || "A SIKERES"}
                  />
                ) : (
                  <HeadlineReveal text={heroData?.title || "A SIKERES"} />
                )}
              </h1>
              <p className="sakkmed-display text-[clamp(1.75rem,4.5vw,3.75rem)] font-light uppercase tracking-[0.12em] text-foreground/90 whitespace-pre-line">
                <EditableTextInline
                  blockType="hero"
                  blockId={HERO_BLOCK_ID}
                  field="description"
                  value={heroData?.description || "RENDEZVÉNY\nKIVITELEZŐJE"}
                  multiline
                />
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {cms.enabled ? (
                <>
                  <EditableLinkInline
                    blockType="hero"
                    blockId={HERO_BLOCK_ID}
                    labelField="primaryCtaLabel"
                    hrefField="primaryCtaHref"
                    label={heroData?.primaryCtaLabel || "Kapcsolat"}
                    href={heroData?.primaryCtaHref || "#contact"}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
                  />
                  <EditableLinkInline
                    blockType="hero"
                    blockId={HERO_BLOCK_ID}
                    labelField="secondaryCtaLabel"
                    hrefField="secondaryCtaHref"
                    label={heroData?.secondaryCtaLabel || "Szolgáltatások"}
                    href={heroData?.secondaryCtaHref || "#services"}
                    buttonVariant="outline"
                    className="rounded-full border border-foreground/30 bg-black/30 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm"
                  />
                </>
              ) : (
                <>
                  <MagneticGoldButton href={heroData?.primaryCtaHref || "#contact"}>
                    {heroData?.primaryCtaLabel || "Kapcsolat"}
                  </MagneticGoldButton>
                  <MagneticGoldButton href={heroData?.secondaryCtaHref || "#services"} variant="ghost" magnetic={false}>
                    {heroData?.secondaryCtaLabel || "Szolgáltatások"}
                  </MagneticGoldButton>
                </>
              )}
            </div>
          </div>

          {!cms.enabled ? (
            <div className="pointer-events-none absolute bottom-10 right-6 hidden flex-col items-center gap-2 md:flex">
              <span className="sakkmed-kicker text-[10px] tracking-[0.35em] text-foreground/70">görgess</span>
              <span className="sakkmed-scroll-line" />
            </div>
          ) : null}
        </div>
      </section>

      {/* SERVICES — equal card grid, header full-width (no sticky empty column) */}
      <section id="services" className="sakkmed-section border-b border-border/40 py-20 md:py-28">
        <div className="sakkmed-page">
          <Reveal>
            <div className="mb-12 max-w-2xl">
              <h2 className="sakkmed-display text-[clamp(1.75rem,3.2vw,3.25rem)]">
                <EditableTextInline
                  blockType="features"
                  blockId={SERVICES_BLOCK_ID}
                  field="title"
                  value={servicesData?.title || "Szolgáltatásaink"}
                />
              </h2>
              <p className="mt-4 text-[var(--sm-body-muted,#C4C4CC)]">
                <EditableTextInline
                  blockType="features"
                  blockId={SERVICES_BLOCK_ID}
                  field="subtitle"
                  value={servicesData?.subtitle || ""}
                  multiline
                />
              </p>
            </div>
          </Reveal>

          {cms.enabled ? (
            <CmsListAddButton
              label="Új szolgáltatás kártya"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", [
                  ...(servicesData?.cards || []),
                  { title: "Új szolgáltatás", description: "", icon: "" },
                ])
              }
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(servicesData?.cards || []).map((card, idx) => (
              <Reveal
                key={idx}
                delayMs={idx * REVEAL_STAGGER_MS}
                className="sakkmed-tilt sakkmed-glass flex h-full flex-col rounded-2xl p-6"
              >
                {cms.enabled ? (
                  <CmsListItemToolbar
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (servicesData?.cards?.length || 0) - 1}
                    onMoveUp={() =>
                      setBlockArray(
                        cms,
                        "features",
                        SERVICES_BLOCK_ID,
                        "cards",
                        moveArrayItem(servicesData?.cards || [], idx, -1)
                      )
                    }
                    onMoveDown={() =>
                      setBlockArray(
                        cms,
                        "features",
                        SERVICES_BLOCK_ID,
                        "cards",
                        moveArrayItem(servicesData?.cards || [], idx, 1)
                      )
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "features",
                        SERVICES_BLOCK_ID,
                        "cards",
                        (servicesData?.cards || []).filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                  />
                ) : null}
                <p className="sakkmed-mono mb-3 text-[10px] text-muted-foreground">{padIndex(idx + 1)}</p>
                <h3 className="text-lg font-semibold uppercase tracking-wide text-primary">
                  <EditableTextInline
                    blockType="features"
                    blockId={SERVICES_BLOCK_ID}
                    field={`cards.${idx}.title`}
                    value={card.title}
                    onCommit={(value) =>
                      patchBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", servicesData?.cards || [], idx, {
                        title: value,
                      })
                    }
                  />
                </h3>
                <div className="mt-3 flex-1 text-sm leading-relaxed text-[var(--sm-body-muted,#C4C4CC)]">
                  {cms.enabled ? (
                    <EditableTextInline
                      blockType="features"
                      blockId={SERVICES_BLOCK_ID}
                      field={`cards.${idx}.description`}
                      value={card.description.replace(/\s*\|\s*/g, "\n")}
                      multiline
                      onCommit={(value) =>
                        patchBlockArray(
                          cms,
                          "features",
                          SERVICES_BLOCK_ID,
                          "cards",
                          servicesData?.cards || [],
                          idx,
                          { description: value }
                        )
                      }
                    />
                  ) : (
                    <PipeChips value={card.description} />
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-x-8 border-t border-primary/30 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="sakkmed-focus group flex min-h-12 items-center justify-between border-b border-border/40 py-3 text-sm uppercase tracking-[0.14em] transition-colors hover:text-primary"
              >
                <span className="flex items-center gap-3">
                  <span className="sakkmed-mono text-xs text-muted-foreground">{padIndex(i + 1)}</span>
                  {link.label}
                </span>
                <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT — stats row + manifesto (no overlapping orbs) */}
      <section id="about" className="sakkmed-section border-b border-border/40 bg-muted/10 py-20 md:py-28">
        <div className="sakkmed-page">
          <Reveal>
            <h2 className="sakkmed-display mb-12 text-[clamp(1.75rem,3.2vw,3.25rem)]">
              <EditableTextInline
                blockType="about"
                blockId={ABOUT_BLOCK_ID}
                field="title"
                value={aboutData?.title || "Rólunk"}
              />
            </h2>
          </Reveal>

          {cms.enabled ? (
            <CmsListAddButton
              label="Új statisztika"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", [
                  ...(aboutData?.cards || []),
                  { title: "0", description: "Új elem", icon: "" },
                ])
              }
            />
          ) : null}

          <div className="mb-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {(aboutData?.cards || []).map((card, idx) => (
              <div key={idx} className="sakkmed-glass rounded-2xl px-4 py-6 text-center md:px-6">
                {cms.enabled ? (
                  <CmsListItemToolbar
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (aboutData?.cards?.length || 0) - 1}
                    onMoveUp={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "cards",
                        moveArrayItem(aboutData?.cards || [], idx, -1)
                      )
                    }
                    onMoveDown={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "cards",
                        moveArrayItem(aboutData?.cards || [], idx, 1)
                      )
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "cards",
                        (aboutData?.cards || []).filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                  />
                ) : null}
                <p className="sakkmed-display text-[clamp(2rem,4vw,3.25rem)] text-primary">
                  {cms.enabled ? (
                    <EditableTextInline
                      blockType="about"
                      blockId={ABOUT_BLOCK_ID}
                      field={`cards.${idx}.title`}
                      value={card.title}
                      onCommit={(value) =>
                        patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", aboutData?.cards || [], idx, {
                          title: value,
                        })
                      }
                    />
                  ) : (
                    <StatOdometer value={card.title} />
                  )}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <EditableTextInline
                    blockType="about"
                    blockId={ABOUT_BLOCK_ID}
                    field={`cards.${idx}.description`}
                    value={card.description}
                    onCommit={(value) =>
                      patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", aboutData?.cards || [], idx, {
                        description: value,
                      })
                    }
                  />
                </p>
              </div>
            ))}
          </div>

          {(aboutData?.paragraph || cms.enabled) && (
            <Reveal>
              <p className="mx-auto mb-14 max-w-3xl text-center text-lg font-light leading-relaxed text-foreground md:text-xl md:leading-[1.65]">
                <EditableTextInline
                  blockType="about"
                  blockId={ABOUT_BLOCK_ID}
                  field="paragraph"
                  value={aboutData?.paragraph || ""}
                  multiline
                />
              </p>
            </Reveal>
          )}

          <AboutDisclosure items={aboutData?.accordions || []} cms={cms} />
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="sakkmed-section">
        <div className="sakkmed-page py-16 md:py-20">
          <h2 className="sakkmed-display mb-8 text-[clamp(1.75rem,3.2vw,3.25rem)]">
            <EditableTextInline
              blockType="gallery"
              blockId={PROJECTS_BLOCK_ID}
              field="title"
              value={projectsData?.title || "Projektjeink"}
            />
          </h2>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új projekt"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", [
                  ...(projectsData?.items || []),
                  { image: "", caption: "Új projekt" },
                ])
              }
            />
          ) : null}
        </div>
        <div className="space-y-0">
          {(projectsData?.items || []).map((item, idx) => {
            const href = PROJECT_LINKS[idx]?.href || "#"
            const tall = idx === 0
            const inner = (
              <>
                {cms.enabled ? (
                  <CmsListItemToolbar
                    className="absolute left-3 top-3 z-20"
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (projectsData?.items?.length || 0) - 1}
                    onMoveUp={() =>
                      setBlockArray(
                        cms,
                        "gallery",
                        PROJECTS_BLOCK_ID,
                        "items",
                        moveArrayItem(projectsData?.items || [], idx, -1)
                      )
                    }
                    onMoveDown={() =>
                      setBlockArray(
                        cms,
                        "gallery",
                        PROJECTS_BLOCK_ID,
                        "items",
                        moveArrayItem(projectsData?.items || [], idx, 1)
                      )
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "gallery",
                        PROJECTS_BLOCK_ID,
                        "items",
                        (projectsData?.items || []).filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                  />
                ) : null}
                <div className={cn("relative overflow-hidden", tall ? "min-h-[70svh]" : "min-h-[55svh]", "md:min-h-[80svh]")}>
                  {cms.enabled ? (
                    <EditableImage
                      src={mediaImageSrc(item.image)}
                      alt={item.caption || ""}
                      editMode
                      flexibleCrop
                      separateControls
                      className="absolute inset-0 h-full w-full object-cover"
                      width={1600}
                      height={1000}
                      onChange={(next) =>
                        patchBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", projectsData?.items || [], idx, {
                          image: next,
                        })
                      }
                    />
                  ) : (
                    <div className="sakkmed-poster-media absolute inset-0">
                      <FallbackImage
                        src={mediaImageSrc(item.image)}
                        alt={item.caption || ""}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-8 left-6 md:bottom-12 md:left-12">
                    <p className="sakkmed-display sakkmed-underline-draw text-3xl text-foreground md:text-5xl">
                      <EditableTextInline
                        blockType="gallery"
                        blockId={PROJECTS_BLOCK_ID}
                        field={`items.${idx}.caption`}
                        value={item.caption || ""}
                        onCommit={(value) =>
                          patchBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", projectsData?.items || [], idx, {
                            caption: value,
                          })
                        }
                      />
                    </p>
                  </div>
                </div>
              </>
            )
            return cms.enabled ? (
              <div key={idx} className="relative">{inner}</div>
            ) : (
              <Link key={idx} href={href} className="group relative block">
                {inner}
              </Link>
            )
          })}
        </div>
      </section>

      {/* CLIENTS */}
      <section id="clients" className="sakkmed-section border-y border-border/40 py-16 md:py-20">
        <div className="sakkmed-page mb-8">
          <h2 className="text-center sakkmed-kicker tracking-[0.28em]">
            <EditableTextInline
              blockType="gallery"
              blockId={CLIENTS_BLOCK_ID}
              field="title"
              value={clientsData?.title || "Ügyfeleink"}
            />
          </h2>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új partner logó"
              className="mt-4"
              onClick={() =>
                setBlockArray(cms, "gallery", CLIENTS_BLOCK_ID, "items", [
                  ...(clientsData?.items || []),
                  { image: "", caption: "" },
                ])
              }
            />
          ) : null}
        </div>
        {cms.enabled ? (
          <div className="sakkmed-page grid grid-cols-2 gap-6 md:grid-cols-4">
            {(clientsData?.items || []).map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 rounded-lg border border-border/40 p-4">
                <CmsListItemToolbar
                  canMoveUp={idx > 0}
                  canMoveDown={idx < (clientsData?.items?.length || 0) - 1}
                  onMoveUp={() =>
                    setBlockArray(
                      cms,
                      "gallery",
                      CLIENTS_BLOCK_ID,
                      "items",
                      moveArrayItem(clientsData?.items || [], idx, -1)
                    )
                  }
                  onMoveDown={() =>
                    setBlockArray(
                      cms,
                      "gallery",
                      CLIENTS_BLOCK_ID,
                      "items",
                      moveArrayItem(clientsData?.items || [], idx, 1)
                    )
                  }
                  onRemove={() =>
                    setBlockArray(
                      cms,
                      "gallery",
                      CLIENTS_BLOCK_ID,
                      "items",
                      (clientsData?.items || []).filter((_, itemIdx) => itemIdx !== idx)
                    )
                  }
                />
                <EditableImage
                  src={mediaImageSrc(item.image)}
                  alt={item.caption || "Partner"}
                  editMode
                  separateControls
                  className="h-12 w-auto max-w-[160px] object-contain"
                  width={160}
                  height={80}
                  onChange={(next) =>
                    patchBlockArray(cms, "gallery", CLIENTS_BLOCK_ID, "items", clientsData?.items || [], idx, {
                      image: next,
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <LogoMarquee>
              {(clientsData?.items || []).map((item, idx) => (
                <FallbackImage
                  key={`a-${idx}`}
                  src={mediaImageSrc(item.image)}
                  alt={item.caption || "Partner"}
                  width={160}
                  height={80}
                  className="h-10 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-12"
                />
              ))}
            </LogoMarquee>
            <LogoMarquee reverse>
              {[...(clientsData?.items || [])].reverse().map((item, idx) => (
                <FallbackImage
                  key={`b-${idx}`}
                  src={mediaImageSrc(item.image)}
                  alt={item.caption || "Partner"}
                  width={160}
                  height={80}
                  className="h-10 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-12"
                />
              ))}
            </LogoMarquee>
          </div>
        )}
      </section>

      {/* GALLERY */}
      <section id="gallery" className="sakkmed-section bg-[var(--sm-deep,#070708)] py-20 md:py-28">
        <div className="sakkmed-page">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="sakkmed-display text-[clamp(1.75rem,3.2vw,3.25rem)]">
              <EditableTextInline
                blockType="gallery"
                blockId={GALLERY_BLOCK_ID}
                field="title"
                value={galleryData?.title || "Galéria"}
              />
            </h2>
            {!cms.enabled && galleryCaptions.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setGalleryFilter(null)}
                  className={cn(
                    "sakkmed-focus rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide",
                    !galleryFilter ? "border-primary text-primary" : "border-border/50 text-muted-foreground"
                  )}
                >
                  Mind
                </button>
                {galleryCaptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setGalleryFilter(c)}
                    className={cn(
                      "sakkmed-focus rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide",
                      galleryFilter === c ? "border-primary text-primary" : "border-border/50 text-muted-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új galéria kép"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "gallery", GALLERY_BLOCK_ID, "items", [
                  ...(galleryData?.items || []),
                  { image: "", caption: "" },
                ])
              }
            />
          ) : null}
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
            {(cms.enabled ? galleryItems.map((item, idx) => ({ item, idx })) : filteredGallery).map(
              ({ item, idx }) => (
                <figure
                  key={idx}
                  className={cn(
                    "group relative mb-3 break-inside-avoid overflow-hidden rounded-xl",
                    idx % 5 === 0 ? "sm:mt-8" : ""
                  )}
                >
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < galleryItems.length - 1}
                      onMoveUp={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          GALLERY_BLOCK_ID,
                          "items",
                          moveArrayItem(galleryItems, idx, -1)
                        )
                      }
                      onMoveDown={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          GALLERY_BLOCK_ID,
                          "items",
                          moveArrayItem(galleryItems, idx, 1)
                        )
                      }
                      onRemove={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          GALLERY_BLOCK_ID,
                          "items",
                          galleryItems.filter((_, itemIdx) => itemIdx !== idx)
                        )
                      }
                    />
                  ) : null}
                  {cms.enabled ? (
                    <EditableImage
                      src={mediaImageSrc(item.image)}
                      alt={item.caption || ""}
                      editMode
                      flexibleCrop
                      separateControls
                      className="aspect-[4/3] h-auto w-full object-cover"
                      width={800}
                      height={600}
                      onChange={(next) =>
                        patchBlockArray(cms, "gallery", GALLERY_BLOCK_ID, "items", galleryItems, idx, {
                          image: next,
                        })
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      className="sakkmed-focus relative block w-full text-left"
                      onClick={() => lightbox.open(idx)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <FallbackImage
                          src={mediaImageSrc(item.image)}
                          alt={item.caption || ""}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width:768px) 100vw, 33vw"
                          loading="lazy"
                        />
                      </div>
                      {item.caption ? (
                        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-foreground opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                          {item.caption}
                        </figcaption>
                      ) : null}
                    </button>
                  )}
                  {cms.enabled ? (
                    <figcaption className="px-2 py-2 text-sm text-muted-foreground">
                      <EditableTextInline
                        blockType="gallery"
                        blockId={GALLERY_BLOCK_ID}
                        field={`items.${idx}.caption`}
                        value={item.caption || ""}
                        onCommit={(value) =>
                          patchBlockArray(cms, "gallery", GALLERY_BLOCK_ID, "items", galleryItems, idx, {
                            caption: value,
                          })
                        }
                      />
                    </figcaption>
                  ) : (
                    <figcaption className="sr-only">{item.caption}</figcaption>
                  )}
                </figure>
              )
            )}
          </div>
        </div>
        <DarkroomLightbox
          items={galleryItems}
          index={lightbox.index}
          onClose={lightbox.close}
          onIndexChange={lightbox.setIndex}
        />
      </section>

      {/* CONTACT */}
      <section id="contact" className="sakkmed-section relative py-20 md:py-28">
        <div className="sakkmed-page relative z-10">
          <h2 className="sakkmed-display mb-10 text-[clamp(1.75rem,3.2vw,3.25rem)]">
            <EditableTextInline
              blockType="contact"
              blockId={CONTACT_BLOCK_ID}
              field="title"
              value={contactData?.title || "Kapcsolat"}
            />
          </h2>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <Reveal delayMs={0}>
                <div className="sakkmed-glass sakkmed-gold-rim rounded-2xl p-5 text-sm">
                  <h3 className="font-semibold text-primary">
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="warehouseTitle"
                      value={contactData?.warehouseTitle || "Raktár, árukiadás"}
                    />
                  </h3>
                  <div className="mt-2 whitespace-pre-line text-[var(--sm-body-muted,#C4C4CC)]">
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="warehouseBody"
                      value={
                        contactData?.warehouseBody ||
                        "1194 Budapest, Vásár tér 1.\nNyitvatartás: Hétfő – Péntek 7:15 – 15:15\nBencs János | Logisztikai vezető — bencs.janos@esemenyszervezes.hu\nTömöri Gyula | Technikai vezető — tomori.gyula@esemenyszervezes.hu"
                      }
                      multiline
                    />
                  </div>
                </div>
              </Reveal>
              <Reveal delayMs={80}>
                <div className="sakkmed-glass rounded-2xl p-5 text-sm">
                  <h3 className="font-semibold text-primary">Központi iroda</h3>
                  <p className="mt-2">
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="companyName"
                      value={contactData?.companyName || "SAKKMED 2005 Kft."}
                    />
                  </p>
                  <p>
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="address"
                      value={contactData?.address || "1095 Budapest, Soroksári út 48."}
                    />
                  </p>
                  <p className="text-muted-foreground">
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="officeTaxId"
                      value={contactData?.officeTaxId || "Adószám: 13543011-2-43"}
                    />
                  </p>
                  <p className="mt-2">
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="officeManagerLine"
                      value={
                        contactData?.officeManagerLine ||
                        "Balázs Gábor | ügyvezető — balazs.gabor@esemenyszervezes.hu"
                      }
                    />
                  </p>
                </div>
              </Reveal>
              <Reveal delayMs={160}>
                <div className="sakkmed-glass rounded-2xl p-5 text-sm">
                  <h3 className="font-semibold text-primary">BTL Ügynökség Kft.</h3>
                  <div className="mt-2 whitespace-pre-line text-[var(--sm-body-muted,#C4C4CC)]">
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="btlBlock"
                      value={
                        contactData?.btlBlock ||
                        "1095 Budapest, Soroksári út 48. · Adószám: 23729825-2-43\nKovács Henriette | ügyvezető — kovacs.henriette@esemenyszervezes.hu"
                      }
                      multiline
                    />
                  </div>
                </div>
              </Reveal>
              <Reveal delayMs={240}>
                <div className="sakkmed-glass rounded-2xl p-5 text-sm">
                  <h3 className="font-semibold text-primary">Pénzügy</h3>
                  <p className="mt-2 text-[var(--sm-body-muted,#C4C4CC)]">
                    <EditableTextInline
                      blockType="contact"
                      blockId={CONTACT_BLOCK_ID}
                      field="financeBlock"
                      value={
                        contactData?.financeBlock ||
                        "Marti Csillag | Pénzügyi vezető — marti.csillag@esemenyszervezes.hu"
                      }
                    />
                  </p>
                </div>
              </Reveal>
              <p className="border-l-2 border-primary/60 pl-4 text-sm text-[var(--sm-body-muted,#C4C4CC)]">
                <EditableTextInline
                  blockType="contact"
                  blockId={CONTACT_BLOCK_ID}
                  field="description"
                  value={contactData?.description || ""}
                  multiline
                />
              </p>
              {siteContact.emails.length > 0 ? (
                <SiteContactEmailsList emails={siteContact.emails} className="text-accent" itemClassName="underline" />
              ) : null}
            </div>

            {siteContact.emails.length > 0 ? (
              <div className="sakkmed-glass sakkmed-gold-rim rounded-2xl p-6 lg:sticky lg:top-28 lg:self-start space-y-4">
                {cms.enabled ? (
                  <div className="grid gap-2 text-sm">
                    <label className="text-muted-foreground">
                      Űrlap — név mező
                      <EditableTextInline
                        blockType="contact"
                        blockId={CONTACT_BLOCK_ID}
                        field="nameLabel"
                        value={contactData?.nameLabel || "Név"}
                        className="mt-1"
                      />
                    </label>
                    <label className="text-muted-foreground">
                      Űrlap — e-mail mező
                      <EditableTextInline
                        blockType="contact"
                        blockId={CONTACT_BLOCK_ID}
                        field="emailLabel"
                        value={contactData?.emailLabel || "E-mail"}
                        className="mt-1"
                      />
                    </label>
                    <label className="text-muted-foreground">
                      Űrlap — üzenet mező
                      <EditableTextInline
                        blockType="contact"
                        blockId={CONTACT_BLOCK_ID}
                        field="messageLabel"
                        value={contactData?.messageLabel || "Üzenet"}
                        className="mt-1"
                      />
                    </label>
                    <label className="text-muted-foreground">
                      Küldés gomb
                      <EditableTextInline
                        blockType="contact"
                        blockId={CONTACT_BLOCK_ID}
                        field="sendButtonLabel"
                        value={contactData?.sendButtonLabel || "Küldés"}
                        className="mt-1"
                      />
                    </label>
                  </div>
                ) : null}
                <ContactInquiryForm
                  contactEmails={siteContact.emails}
                  nameLabel={contactData?.nameLabel || "Név"}
                  emailLabel={contactData?.emailLabel || "E-mail"}
                  messageLabel={contactData?.messageLabel || "Üzenet"}
                  sendButtonLabel={contactData?.sendButtonLabel || "Küldés"}
                  recipientLabel="Címzett"
                  className="[&_input]:bg-background/60 [&_textarea]:bg-background/60 [&_input]:focus-visible:ring-accent [&_textarea]:focus-visible:ring-accent"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Kapcsolatfelvételi űrlaphoz adj meg címzett e-mailt a CMS → Weboldal beállítások → Kapcsolat e-mailek
                menüben.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
