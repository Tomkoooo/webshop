"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Building2,
  Factory,
  Hammer,
  Mail,
  MapPin,
  Phone,
  Quote,
  Wrench,
} from "lucide-react"
import { useState } from "react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
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

const HERO_BLOCK_ID = "hero-erdweg"
const HERO_LEAD_BLOCK_ID = "hero-lead-erdweg"
const MARQUEE_BLOCK_ID = "marquee-erdweg"
const LABEL_SERVICES_ID = "label-services-erdweg"
const SERVICES_BLOCK_ID = "services-erdweg"
const SERVICES_INTRO_BLOCK_ID = "services-intro-erdweg"
const LABEL_ABOUT_ID = "label-about-erdweg"
const ABOUT_BLOCK_ID = "about-erdweg"
const LABEL_PROJECTS_ID = "label-projects-erdweg"
const PROJECTS_BLOCK_ID = "projects-erdweg"
const PROJECTS_CTA_BLOCK_ID = "projects-cta-erdweg"
const LABEL_REFERENCES_ID = "label-references-erdweg"
const REFERENCES_BLOCK_ID = "references-erdweg"
const LABEL_CONTACT_ID = "label-contact-erdweg"
const CONTACT_BLOCK_ID = "contact-erdweg"

const SERVICE_ICON_COMPONENTS = [Hammer, Building2, Wrench, Factory] as const
const SERVICE_IMAGE_FALLBACKS = [
  "/templates/erdweg/service-residential.jpg",
  "/templates/erdweg/service-commercial.jpg",
  "/templates/erdweg/service-renovation.jpg",
  "/templates/erdweg/service-industrial.jpg",
]

type Props = {
  snapshot: HomepageSnapshot
  siteContact: {
    emails: Array<{ id: string; label: string; email: string }>
    phone?: string
    address?: string
  }
}

type Cms = ReturnType<typeof useCmsEdit>
type BlockType = HomepageBlock["type"]

function block<T extends { type: string }>(snapshot: HomepageSnapshot, type: T["type"], id?: string) {
  return snapshot.blocks.find(
    (b) => b.type === type && b.enabled !== false && (!id || b.id === id)
  )
}

function patchBlockArray<T extends Record<string, unknown>>(
  cms: Cms,
  blockType: BlockType,
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

function setBlockArray<T>(cms: Cms, blockType: BlockType, blockId: string, field: string, items: T[]) {
  cms.patchBlockData(blockType, { [field]: items }, blockId)
}

function serviceImage(card: { icon?: string }, index: number) {
  return card.icon?.trim() || SERVICE_IMAGE_FALLBACKS[index % SERVICE_IMAGE_FALLBACKS.length]
}

function EditableSectionLabel({ blockId, fallback }: { blockId: string; fallback: string }) {
  return (
    <div className="mb-8 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-primary">
      <EditableTextInline blockType="divider" blockId={blockId} field="label" value={fallback} />
    </div>
  )
}

export function ErdwegHomeSections({ snapshot, siteContact }: Props) {
  const cms = useCmsEdit()
  const hero = block(snapshot, "hero", HERO_BLOCK_ID)
  const heroLead = block(snapshot, "richText", HERO_LEAD_BLOCK_ID)
  const marquee = block(snapshot, "features", MARQUEE_BLOCK_ID)
  const services = block(snapshot, "features", SERVICES_BLOCK_ID)
  const servicesIntro = block(snapshot, "richText", SERVICES_INTRO_BLOCK_ID)
  const about = block(snapshot, "about", ABOUT_BLOCK_ID)
  const projects = block(snapshot, "gallery", PROJECTS_BLOCK_ID)
  const projectsCta = block(snapshot, "cta", PROJECTS_CTA_BLOCK_ID)
  const references = block(snapshot, "testimonials", REFERENCES_BLOCK_ID)
  const contact = block(snapshot, "contact", CONTACT_BLOCK_ID)

  const heroData = hero?.type === "hero" ? hero.data : null
  const heroLeadData = heroLead?.type === "richText" ? heroLead.data : null
  const marqueeData = marquee?.type === "features" ? marquee.data : null
  const servicesData = services?.type === "features" ? services.data : null
  const servicesIntroData = servicesIntro?.type === "richText" ? servicesIntro.data : null
  const aboutData = about?.type === "about" ? about.data : null
  const projectsData = projects?.type === "gallery" ? projects.data : null
  const projectsCtaData = projectsCta?.type === "cta" ? projectsCta.data : null
  const referencesData = references?.type === "testimonials" ? references.data : null
  const contactData = contact?.type === "contact" ? contact.data : null

  const heroBackground = heroData?.heroImage || "/templates/erdweg/hero.jpg"
  const [activeService, setActiveService] = useState(0)

  const phone = contactData?.phone || siteContact.phone || ""
  const address = contactData?.address || siteContact.address || ""
  const primaryEmail = contactData?.email || siteContact.emails[0]?.email || ""

  return (
    <>
      <HeroSection cms={cms} heroData={heroData} heroLeadData={heroLeadData} heroBackground={heroBackground} />
      <MarqueeSection cms={cms} marqueeData={marqueeData} />
      <ServicesSection
        cms={cms}
        servicesData={servicesData}
        servicesIntroData={servicesIntroData}
        activeService={activeService}
        setActiveService={setActiveService}
      />
      <AboutSection cms={cms} aboutData={aboutData} />
      <ProjectsSection cms={cms} projectsData={projectsData} projectsCtaData={projectsCtaData} />
      <ReferencesSection cms={cms} referencesData={referencesData} />
      <ContactSection
        cms={cms}
        contactData={contactData}
        siteContact={siteContact}
        phone={phone}
        address={address}
        primaryEmail={primaryEmail}
      />
    </>
  )
}

function HeroSection({
  cms,
  heroData,
  heroLeadData,
  heroBackground,
}: {
  cms: Cms
  heroData: Extract<HomepageBlock, { type: "hero" }>["data"] | null
  heroLeadData: Extract<HomepageBlock, { type: "richText" }>["data"] | null
  heroBackground: string
}) {
  return (
    <section id="top" className="relative -mt-[57px] min-h-[100svh] overflow-hidden pt-[57px]">
      <div className="absolute inset-0">
        <FallbackImage
          src={mediaImageSrc(heroBackground)}
          alt=""
          fill
          priority={!cms.enabled}
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(var(--erdweg-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--erdweg-grid-line) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-57px)] max-w-7xl flex-col justify-end px-6 pb-20 lg:px-10">
        {cms.enabled ? (
          <div className="cms-admin-control mb-6 max-w-md rounded-lg border border-dashed border-white/30 bg-black/70 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-white/70">Hero háttérkép</p>
            <EditableImage
              src={mediaImageSrc(heroBackground)}
              alt=""
              editMode
              flexibleCrop
              separateControls
              usageLabel="Hero háttérkép"
              className="h-28 w-full object-cover"
              width={1920}
              height={1080}
              onChange={(next) => cms.patchBlockData("hero", { heroImage: next }, HERO_BLOCK_ID)}
            />
          </div>
        ) : null}

        <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
          <span className="h-px w-10 bg-primary" />
          <EditableTextInline
            blockType="hero"
            blockId={HERO_BLOCK_ID}
            field="badges"
            value={heroData?.badges?.[0] || "1982 óta · Családi vállalkozás"}
            onCommit={(value) => cms.patchBlockData("hero", { badges: [value] }, HERO_BLOCK_ID)}
          />
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-[clamp(3.5rem,11vw,9rem)] leading-[0.85] tracking-tight">
          <EditableTextInline blockType="hero" blockId={HERO_BLOCK_ID} field="title" value={heroData?.title || "Építünk"} />
          <br />
          <span className="font-[family-name:var(--font-sans)] font-light italic text-primary">
            <EditableTextInline
              blockType="hero"
              blockId={HERO_BLOCK_ID}
              field="description"
              value={heroData?.description || "a tervek felett."}
            />
          </span>
        </h1>

        <div className="mt-10 flex max-w-5xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            <EditableTextInline
              blockType="richText"
              blockId={HERO_LEAD_BLOCK_ID}
              field="html"
              value={
                heroLeadData?.html ||
                "Négy évtizedes szakmai tapasztalat — családi házak, irodák és ipari létesítmények, amelyek túlélik a terveket."
              }
              multiline
            />
          </p>
          <div className="flex flex-wrap gap-3">
            {cms.enabled ? (
              <>
                <EditableLinkInline
                  blockType="hero"
                  blockId={HERO_BLOCK_ID}
                  labelField="primaryCtaLabel"
                  hrefField="primaryCtaHref"
                  label={heroData?.primaryCtaLabel || "Munkáink"}
                  href={heroData?.primaryCtaHref || "#projects"}
                  className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
                />
                <EditableLinkInline
                  blockType="hero"
                  blockId={HERO_BLOCK_ID}
                  labelField="secondaryCtaLabel"
                  hrefField="secondaryCtaHref"
                  label={heroData?.secondaryCtaLabel || "Ajánlatkérés"}
                  href={heroData?.secondaryCtaHref || "#contact"}
                  buttonVariant="outline"
                  className="inline-flex items-center gap-2 border border-foreground/30 px-6 py-3 font-medium hover:bg-foreground/10"
                />
              </>
            ) : (
              <>
                <Link
                  href={heroData?.primaryCtaHref || "#projects"}
                  className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
                >
                  {heroData?.primaryCtaLabel || "Munkáink"} <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href={heroData?.secondaryCtaHref || "#contact"}
                  className="inline-flex items-center gap-2 border border-foreground/30 px-6 py-3 font-medium hover:bg-foreground/10"
                >
                  {heroData?.secondaryCtaLabel || "Ajánlatkérés"}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function MarqueeSection({
  cms,
  marqueeData,
}: {
  cms: Cms
  marqueeData: Extract<HomepageBlock, { type: "features" }>["data"] | null
}) {
  const words = marqueeData?.cards || []

  if (cms.enabled) {
    return (
      <div className="border-y border-border bg-surface px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <CmsListAddButton
            label="Új szó a sávhoz"
            className="mb-4"
            onClick={() =>
              setBlockArray(cms, "features", MARQUEE_BLOCK_ID, "cards", [
                ...words,
                { title: "Új elem", description: "", icon: "" },
              ])
            }
          />
          <div className="flex flex-wrap gap-3">
            {words.map((item, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 rounded border border-border/60 bg-background px-3 py-2"
              >
                <EditableTextInline
                  blockType="features"
                  blockId={MARQUEE_BLOCK_ID}
                  field={`cards.${i}.title`}
                  value={item.title}
                  onCommit={(value) =>
                    patchBlockArray(cms, "features", MARQUEE_BLOCK_ID, "cards", words, i, { title: value })
                  }
                />
                <CmsListItemToolbar
                  canMoveUp={i > 0}
                  canMoveDown={i < words.length - 1}
                  onMoveUp={() =>
                    setBlockArray(cms, "features", MARQUEE_BLOCK_ID, "cards", moveArrayItem(words, i, -1))
                  }
                  onMoveDown={() =>
                    setBlockArray(cms, "features", MARQUEE_BLOCK_ID, "cards", moveArrayItem(words, i, 1))
                  }
                  onRemove={() =>
                    setBlockArray(
                      cms,
                      "features",
                      MARQUEE_BLOCK_ID,
                      "cards",
                      words.filter((_, idx) => idx !== i)
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden border-y border-border bg-surface py-8">
      <div className="erdweg-marquee flex gap-16 whitespace-nowrap">
        {[...words, ...words, ...words].map((item, i) => (
          <span
            key={`${item.title}-${i}`}
            className="font-[family-name:var(--font-display)] text-4xl tracking-wider text-muted-foreground/40 md:text-6xl"
          >
            {item.title} <span className="text-primary">/</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function ServicesSection({
  cms,
  servicesData,
  servicesIntroData,
  activeService,
  setActiveService,
}: {
  cms: Cms
  servicesData: Extract<HomepageBlock, { type: "features" }>["data"] | null
  servicesIntroData: Extract<HomepageBlock, { type: "richText" }>["data"] | null
  activeService: number
  setActiveService: (index: number) => void
}) {
  const cards = servicesData?.cards || []

  return (
    <section id="services" className="relative px-6 py-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <EditableSectionLabel blockId={LABEL_SERVICES_ID} fallback="01 · Amit építünk" />
        <div className="mb-16 grid items-end gap-12 lg:grid-cols-2">
          <h2 className="font-[family-name:var(--font-display)] text-5xl leading-[0.9] md:text-7xl">
            <EditableTextInline
              blockType="features"
              blockId={SERVICES_BLOCK_ID}
              field="title"
              value={servicesData?.title || "Négy szakterület."}
            />
            <br />
            <span className="text-primary">
              <EditableTextInline
                blockType="features"
                blockId={SERVICES_BLOCK_ID}
                field="subtitle"
                value={servicesData?.subtitle || "Egy minőség."}
              />
            </span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            <EditableTextInline
              blockType="richText"
              blockId={SERVICES_INTRO_BLOCK_ID}
              field="html"
              value={
                servicesIntroData?.html ||
                "Minden projekt — a kerti vendégházaktól a 40 000 m²-es logisztikai központokig — ugyanazon az elven fut: egy felelős projektvezető, átlátható költségvetés, heti helyszíni egyeztetés."
              }
              multiline
            />
          </p>
        </div>

        {cms.enabled ? (
          <CmsListAddButton
            label="Új szolgáltatás"
            className="mb-4"
            onClick={() =>
              setBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", [
                ...cards,
                {
                  title: "Új szolgáltatás",
                  description: "",
                  icon: SERVICE_IMAGE_FALLBACKS[cards.length % SERVICE_IMAGE_FALLBACKS.length],
                },
              ])
            }
          />
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col">
            {cards.map((card, i) => {
              const Icon = SERVICE_ICON_COMPONENTS[i % SERVICE_ICON_COMPONENTS.length]
              const isActive = i === activeService
              const RowTag = cms.enabled ? "div" : "button"
              return (
                <RowTag
                  key={i}
                  type={cms.enabled ? undefined : "button"}
                  onMouseEnter={() => setActiveService(i)}
                  onFocus={cms.enabled ? undefined : () => setActiveService(i)}
                  className={cn(
                    "group w-full border-t border-border py-8 text-left transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground",
                    i === cards.length - 1 && "border-b"
                  )}
                >
                  <div className="flex items-start gap-6">
                    <span className="mt-2 font-mono text-xs opacity-60">0{i + 1}</span>
                    <Icon className={cn("mt-1 h-7 w-7 shrink-0", isActive && "text-primary")} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-[family-name:var(--font-display)] text-3xl tracking-wide md:text-4xl">
                          <EditableTextInline
                            blockType="features"
                            blockId={SERVICES_BLOCK_ID}
                            field={`cards.${i}.title`}
                            value={card.title}
                            onCommit={(value) =>
                              patchBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", cards, i, { title: value })
                            }
                          />
                        </h3>
                        <ArrowUpRight
                          className={cn(
                            "h-5 w-5 transition-transform",
                            isActive ? "rotate-0 text-primary" : "-rotate-45 opacity-50"
                          )}
                        />
                      </div>
                      {(isActive || cms.enabled) && (
                        <p className="mt-3 text-base leading-relaxed">
                          <EditableTextInline
                            blockType="features"
                            blockId={SERVICES_BLOCK_ID}
                            field={`cards.${i}.description`}
                            value={card.description}
                            multiline
                            onCommit={(value) =>
                              patchBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", cards, i, {
                                description: value,
                              })
                            }
                          />
                        </p>
                      )}
                      {cms.enabled ? (
                        <div className="cms-admin-control mt-4 max-w-sm rounded-lg border border-dashed border-border/60 bg-muted/20 p-3">
                          <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                            Szolgáltatás kép — {card.title || `#${i + 1}`}
                          </p>
                          <EditableImage
                            src={mediaImageSrc(serviceImage(card, i))}
                            alt={card.title}
                            editMode
                            flexibleCrop
                            separateControls
                            usageLabel={`${card.title || "Szolgáltatás"} kép`}
                            className="aspect-[4/3] h-auto w-full object-cover"
                            width={1024}
                            height={768}
                            onChange={(next) =>
                              patchBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", cards, i, { icon: next })
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      className="mt-2"
                      canMoveUp={i > 0}
                      canMoveDown={i < cards.length - 1}
                      onMoveUp={() =>
                        setBlockArray(
                          cms,
                          "features",
                          SERVICES_BLOCK_ID,
                          "cards",
                          moveArrayItem(cards, i, -1)
                        )
                      }
                      onMoveDown={() =>
                        setBlockArray(
                          cms,
                          "features",
                          SERVICES_BLOCK_ID,
                          "cards",
                          moveArrayItem(cards, i, 1)
                        )
                      }
                      onRemove={() =>
                        setBlockArray(
                          cms,
                          "features",
                          SERVICES_BLOCK_ID,
                          "cards",
                          cards.filter((_, itemIdx) => itemIdx !== i)
                        )
                      }
                    />
                  ) : null}
                </RowTag>
              )
            })}
          </div>

          <div className="relative h-[420px] overflow-hidden bg-surface lg:sticky lg:top-24 lg:h-[600px]">
            {cards.map((card, i) => (
              <div
                key={i}
                className={cn(
                  "absolute inset-0 transition-all duration-700 ease-out",
                  i === activeService ? "scale-100 opacity-100" : "scale-105 opacity-0"
                )}
              >
                <FallbackImage
                  src={mediaImageSrc(serviceImage(card, i))}
                  alt={card.title || ""}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-foreground/10" />
            {cards[activeService] ? (
              <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-foreground">
                <span className="font-[family-name:var(--font-display)] text-2xl tracking-wider drop-shadow-lg">
                  {cards[activeService].title}
                </span>
                <span className="bg-background/70 px-3 py-1.5 font-mono text-xs backdrop-blur">
                  0{activeService + 1} / 0{cards.length}
                </span>
              </div>
            ) : null}
            {cms.enabled && cards.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Adj hozzá szolgáltatást a listához.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutSection({
  cms,
  aboutData,
}: {
  cms: Cms
  aboutData: Extract<HomepageBlock, { type: "about" }>["data"] | null
}) {
  const stats = aboutData?.cards || []

  return (
    <section id="about" className="bg-surface px-6 py-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <EditableSectionLabel blockId={LABEL_ABOUT_ID} fallback="02 · Kik vagyunk" />
        <div className="grid gap-10 lg:grid-cols-12">
          <h2 className="font-[family-name:var(--font-display)] text-4xl leading-[1.05] md:text-6xl lg:col-span-7">
            <EditableTextInline
              blockType="about"
              blockId={ABOUT_BLOCK_ID}
              field="title"
              value={
                aboutData?.title ||
                "Családi vállalkozás, amely kalapáccsal tanulta a szakmát, majd tervrajzokkal érdemelte ki a hírnevét."
              }
              multiline
            />
          </h2>
          <div className="space-y-6 leading-relaxed text-muted-foreground lg:col-span-5">
            <p>
              <EditableTextInline
                blockType="about"
                blockId={ABOUT_BLOCK_ID}
                field="paragraph"
                value={aboutData?.paragraph || ""}
                multiline
              />
            </p>
          </div>
        </div>

        {cms.enabled ? (
          <CmsListAddButton
            label="Új statisztika"
            className="mb-4 mt-12"
            onClick={() =>
              setBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", [
                ...stats,
                { title: "0", description: "Új elem", icon: "" },
              ])
            }
          />
        ) : null}

        <div className="mt-20 grid grid-cols-2 gap-8 border-t border-border pt-12 lg:grid-cols-4">
          {stats.map((card, idx) => (
            <div key={idx} className="space-y-2">
              {cms.enabled ? (
                <CmsListItemToolbar
                  canMoveUp={idx > 0}
                  canMoveDown={idx < stats.length - 1}
                  onMoveUp={() =>
                    setBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", moveArrayItem(stats, idx, -1))
                  }
                  onMoveDown={() =>
                    setBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", moveArrayItem(stats, idx, 1))
                  }
                  onRemove={() =>
                    setBlockArray(
                      cms,
                      "about",
                      ABOUT_BLOCK_ID,
                      "cards",
                      stats.filter((_, itemIdx) => itemIdx !== idx)
                    )
                  }
                />
              ) : null}
              <div className="font-[family-name:var(--font-display)] text-6xl text-primary md:text-7xl">
                <EditableTextInline
                  blockType="about"
                  blockId={ABOUT_BLOCK_ID}
                  field={`cards.${idx}.title`}
                  value={card.title}
                  onCommit={(value) =>
                    patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", stats, idx, { title: value })
                  }
                />
              </div>
              <div className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
                <EditableTextInline
                  blockType="about"
                  blockId={ABOUT_BLOCK_ID}
                  field={`cards.${idx}.description`}
                  value={card.description}
                  onCommit={(value) =>
                    patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", stats, idx, { description: value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectsSection({
  cms,
  projectsData,
  projectsCtaData,
}: {
  cms: Cms
  projectsData: Extract<HomepageBlock, { type: "gallery" }>["data"] | null
  projectsCtaData: Extract<HomepageBlock, { type: "cta" }>["data"] | null
}) {
  const items = projectsData?.items || []

  return (
    <section id="projects" className="px-6 py-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <EditableSectionLabel blockId={LABEL_PROJECTS_ID} fallback="03 · Kiemelt munkák" />
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl">
            <EditableTextInline
              blockType="gallery"
              blockId={PROJECTS_BLOCK_ID}
              field="title"
              value={projectsData?.title || "Legutóbbi projektek."}
            />
          </h2>
          {cms.enabled ? (
            <EditableLinkInline
              blockType="cta"
              blockId={PROJECTS_CTA_BLOCK_ID}
              labelField="primaryLabel"
              hrefField="primaryHref"
              label={projectsCtaData?.primaryLabel || "Teljes archívum →"}
              href={projectsCtaData?.primaryHref || "#contact"}
              appearance="link"
              className="erdweg-story-link text-sm text-muted-foreground hover:text-foreground"
            />
          ) : (
            <Link
              href={projectsCtaData?.primaryHref || "#contact"}
              className="erdweg-story-link text-sm text-muted-foreground hover:text-foreground"
            >
              {projectsCtaData?.primaryLabel || "Teljes archívum →"}
            </Link>
          )}
        </div>

        {cms.enabled ? (
          <CmsListAddButton
            label="Új projekt"
            className="mb-4"
            onClick={() =>
              setBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", [
                ...items,
                { image: "/templates/erdweg/project-1.jpg", caption: "Új projekt" },
              ])
            }
          />
        ) : null}

        <div className="grid gap-6 md:grid-cols-12">
          {items.map((item, i) => {
            const card = (
              <>
                {cms.enabled ? (
                  <CmsListItemToolbar
                    className="absolute left-3 top-3 z-20"
                    canMoveUp={i > 0}
                    canMoveDown={i < items.length - 1}
                    onMoveUp={() =>
                      setBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", moveArrayItem(items, i, -1))
                    }
                    onMoveDown={() =>
                      setBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", moveArrayItem(items, i, 1))
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "gallery",
                        PROJECTS_BLOCK_ID,
                        "items",
                        items.filter((_, itemIdx) => itemIdx !== i)
                      )
                    }
                  />
                ) : null}
                <div className={cn("relative overflow-hidden", i === 0 ? "aspect-[4/5]" : "aspect-[5/4]")}>
                  {cms.enabled ? (
                    <EditableImage
                      src={mediaImageSrc(item.image)}
                      alt={item.caption || ""}
                      editMode
                      flexibleCrop
                      separateControls
                      usageLabel={`Projekt kép ${i + 1}`}
                      className="h-full w-full object-cover"
                      width={1280}
                      height={960}
                      onChange={(next) =>
                        patchBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", items, i, { image: next })
                      }
                    />
                  ) : (
                    <FallbackImage
                      src={mediaImageSrc(item.image)}
                      alt={item.caption || ""}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-3xl tracking-wide md:text-4xl">
                      <EditableTextInline
                        blockType="gallery"
                        blockId={PROJECTS_BLOCK_ID}
                        field={`items.${i}.caption`}
                        value={item.caption || ""}
                        onCommit={(value) =>
                          patchBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", items, i, { caption: value })
                        }
                      />
                    </h3>
                  </div>
                  {!cms.enabled ? (
                    <div className="grid h-12 w-12 translate-y-2 place-items-center bg-primary text-primary-foreground opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>
              </>
            )

            return cms.enabled ? (
              <div
                key={i}
                className={cn(
                  "group relative block overflow-hidden bg-surface",
                  i === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"
                )}
              >
                {card}
              </div>
            ) : (
              <Link
                key={i}
                href={projectsCtaData?.primaryHref || "#contact"}
                className={cn(
                  "group relative block overflow-hidden bg-surface",
                  i === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"
                )}
              >
                {card}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ReferencesSection({
  cms,
  referencesData,
}: {
  cms: Cms
  referencesData: Extract<HomepageBlock, { type: "testimonials" }>["data"] | null
}) {
  const items = referencesData?.items || []

  return (
    <section id="references" className="border-y border-border bg-surface px-6 py-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <EditableSectionLabel blockId={LABEL_REFERENCES_ID} fallback="04 · Referenciák" />
        <h2 className="mb-20 max-w-3xl font-[family-name:var(--font-display)] text-5xl md:text-7xl">
          <EditableTextInline
            blockType="testimonials"
            blockId={REFERENCES_BLOCK_ID}
            field="title"
            value={referencesData?.title || "Mit mondanak ügyfeleink az átadás után."}
          />
        </h2>

        {cms.enabled ? (
          <CmsListAddButton
            label="Új referencia"
            className="mb-4"
            onClick={() =>
              setBlockArray(cms, "testimonials", REFERENCES_BLOCK_ID, "items", [
                ...items,
                { quote: "Új idézet…", name: "Ügyfél neve", role: "Beosztás", rating: 5 },
              ])
            }
          />
        ) : null}

        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item, i) => (
            <figure key={i} className="relative flex flex-col border border-border bg-background p-8">
              {cms.enabled ? (
                <CmsListItemToolbar
                  canMoveUp={i > 0}
                  canMoveDown={i < items.length - 1}
                  onMoveUp={() =>
                    setBlockArray(cms, "testimonials", REFERENCES_BLOCK_ID, "items", moveArrayItem(items, i, -1))
                  }
                  onMoveDown={() =>
                    setBlockArray(cms, "testimonials", REFERENCES_BLOCK_ID, "items", moveArrayItem(items, i, 1))
                  }
                  onRemove={() =>
                    setBlockArray(
                      cms,
                      "testimonials",
                      REFERENCES_BLOCK_ID,
                      "items",
                      items.filter((_, itemIdx) => itemIdx !== i)
                    )
                  }
                />
              ) : null}
              <Quote className="mb-6 h-8 w-8 text-primary" />
              <blockquote className="flex-1 text-lg leading-relaxed">
                &ldquo;
                <EditableTextInline
                  blockType="testimonials"
                  blockId={REFERENCES_BLOCK_ID}
                  field={`items.${i}.quote`}
                  value={item.quote}
                  multiline
                  onCommit={(value) =>
                    patchBlockArray(cms, "testimonials", REFERENCES_BLOCK_ID, "items", items, i, { quote: value })
                  }
                />
                &rdquo;
              </blockquote>
              <figcaption className="mt-8 border-t border-border pt-6">
                <div className="font-[family-name:var(--font-display)] text-xl tracking-wide">
                  <EditableTextInline
                    blockType="testimonials"
                    blockId={REFERENCES_BLOCK_ID}
                    field={`items.${i}.name`}
                    value={item.name}
                    onCommit={(value) =>
                      patchBlockArray(cms, "testimonials", REFERENCES_BLOCK_ID, "items", items, i, { name: value })
                    }
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <EditableTextInline
                    blockType="testimonials"
                    blockId={REFERENCES_BLOCK_ID}
                    field={`items.${i}.role`}
                    value={item.role}
                    onCommit={(value) =>
                      patchBlockArray(cms, "testimonials", REFERENCES_BLOCK_ID, "items", items, i, { role: value })
                    }
                  />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection({
  cms,
  contactData,
  siteContact,
  phone,
  address,
  primaryEmail,
}: {
  cms: Cms
  contactData: Extract<HomepageBlock, { type: "contact" }>["data"] | null
  siteContact: Props["siteContact"]
  phone: string
  address: string
  primaryEmail: string
}) {
  return (
    <section id="contact" className="relative overflow-hidden px-6 py-32 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
        <div>
          <EditableSectionLabel blockId={LABEL_CONTACT_ID} fallback="05 · Projekt indítása" />
          <h2 className="mb-10 font-[family-name:var(--font-display)] text-5xl leading-[0.95] md:text-7xl">
            <EditableTextInline
              blockType="contact"
              blockId={CONTACT_BLOCK_ID}
              field="title"
              value={contactData?.title || "Mondd el, mit"}
            />
            <br />
            szeretnél{" "}
            <span className="text-primary">
              <EditableTextInline
                blockType="contact"
                blockId={CONTACT_BLOCK_ID}
                field="companyName"
                value={contactData?.companyName || "építeni."}
              />
            </span>
          </h2>
          <p className="mb-12 max-w-md text-lg leading-relaxed text-muted-foreground">
            <EditableTextInline
              blockType="contact"
              blockId={CONTACT_BLOCK_ID}
              field="description"
              value={
                contactData?.description ||
                "Minden megkeresést 24 órán belül elolvas egy senior partner. Nincs chatbot — csak telefonhívás vagy helyszíni egyeztetés."
              }
              multiline
            />
          </p>

          <ul className="space-y-5 text-sm">
            <li className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center border border-primary/30 bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              {cms.enabled ? (
                <EditableTextInline
                  blockType="contact"
                  blockId={CONTACT_BLOCK_ID}
                  field="phone"
                  value={phone}
                />
              ) : phone ? (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-primary">
                  {phone}
                </a>
              ) : null}
            </li>
            <li className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center border border-primary/30 bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              {cms.enabled ? (
                <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="email" value={primaryEmail} />
              ) : primaryEmail ? (
                <a href={`mailto:${primaryEmail}`} className="hover:text-primary">
                  {primaryEmail}
                </a>
              ) : null}
            </li>
            <li className="flex items-start gap-4">
              <div className="mt-0.5 grid h-10 w-10 place-items-center border border-primary/30 bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <EditableTextInline
                blockType="contact"
                blockId={CONTACT_BLOCK_ID}
                field="address"
                value={address}
                multiline
              />
            </li>
          </ul>

          {siteContact.emails.length > 0 ? (
            <div className="mt-8">
              <SiteContactEmailsList emails={siteContact.emails} className="text-primary" itemClassName="underline" />
            </div>
          ) : null}
        </div>

        {siteContact.emails.length > 0 || cms.enabled ? (
          <div className="space-y-6 self-start border border-border bg-surface p-8 md:p-10">
            {cms.enabled ? (
              <div className="grid gap-2 border-b border-border/60 pb-4 text-sm">
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
            {siteContact.emails.length > 0 ? (
              <ContactInquiryForm
                contactEmails={siteContact.emails}
                nameLabel={contactData?.nameLabel || "Név"}
                emailLabel={contactData?.emailLabel || "E-mail"}
                messageLabel={contactData?.messageLabel || "Üzenet"}
                sendButtonLabel={contactData?.sendButtonLabel || "Küldés"}
                recipientLabel="Címzett"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Kapcsolatfelvételi űrlaphoz adj meg címzett e-mailt a CMS → Weboldal beállítások → Kapcsolat e-mailek
                menüben.
              </p>
            )}
          </div>
        ) : (
          <div className="self-start border border-border bg-surface p-8 text-sm text-muted-foreground md:p-10">
            <p>
              Kapcsolatfelvételi űrlaphoz adj meg címzett e-mailt a CMS → Weboldal beállítások → Kapcsolat e-mailek
              menüben.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
