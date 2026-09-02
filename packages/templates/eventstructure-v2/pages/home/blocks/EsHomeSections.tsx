"use client"

import { useEffect, useState } from "react"
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
import { ASSET } from "../../../lib/constants"
import { ChapterRail } from "../../../components/ChapterRail"
import { MagneticButton } from "../../../components/MagneticButton"
import { ParallaxMedia } from "../../../components/ParallaxMedia"
import "../../../esv2.css"

const HERO_BLOCK_ID = "hero-es"
const SECTORS_BLOCK_ID = "sectors-es"
const ABOUT_BLOCK_ID = "about-es"
const WORK_BLOCK_ID = "work-es"
const SERVICES_BLOCK_ID = "services-es"
const WHY_BLOCK_ID = "why-es"
const CONTACT_BLOCK_ID = "contact-es"

type Props = {
  snapshot: HomepageSnapshot
  siteContact: { emails: Array<{ id: string; label: string; email: string }> }
}

function block<T extends { type: string }>(snapshot: HomepageSnapshot, type: T["type"], id?: string) {
  return snapshot.blocks.find((b) => b.type === type && b.enabled !== false && (!id || b.id === id))
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
    { [field]: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) },
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
    <span className={cn(ready && "esv2-headline--ready", className)} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="esv2-headline-word" style={{ ["--word-i" as string]: i }}>
          <span className="pr-[0.18em]">{word}</span>
        </span>
      ))}
    </span>
  )
}

type TileCard = { title: string; description?: string; icon?: string }

function LabeledTile({
  card,
  cms,
  blockType,
  blockId,
  field,
  cards,
  idx,
  sizes,
  reveal,
  delayMs,
}: {
  card: TileCard
  cms: ReturnType<typeof useCmsEdit>
  blockType: HomepageBlock["type"]
  blockId: string
  field: string
  cards: TileCard[]
  idx: number
  sizes: string
  reveal?: "left" | "right" | "up" | "scale"
  delayMs?: number
}) {
  const inner = (
    <article className="esv2-labeled-tile h-full min-h-[11rem]">
      {cms.enabled ? (
        <CmsListItemToolbar
          canMoveUp={idx > 0}
          canMoveDown={idx < cards.length - 1}
          onMoveUp={() => setBlockArray(cms, blockType, blockId, field, moveArrayItem(cards, idx, -1))}
          onMoveDown={() => setBlockArray(cms, blockType, blockId, field, moveArrayItem(cards, idx, 1))}
          onRemove={() => setBlockArray(cms, blockType, blockId, field, cards.filter((_, i) => i !== idx))}
        />
      ) : null}
      <div className="absolute inset-0">
        {cms.enabled ? (
          <EditableImage
            src={mediaImageSrc(card.icon || "")}
            alt={card.title}
            editMode
            flexibleCrop
            className="esv2-labeled-tile__media h-full w-full object-cover"
            width={1600}
            height={1000}
            onChange={(next) => patchBlockArray(cms, blockType, blockId, field, cards, idx, { icon: next })}
          />
        ) : (
          <FallbackImage
            src={mediaImageSrc(card.icon || ASSET.hero)}
            alt={card.title}
            fill
            quality={90}
            className="esv2-labeled-tile__media object-cover"
            sizes={sizes}
          />
        )}
      </div>
      <div className="esv2-labeled-tile__veil" aria-hidden />
      <h3 className="esv2-labeled-tile__label text-[clamp(1.05rem,2.2vw,1.85rem)]">
        <EditableTextInline
          blockType={blockType}
          blockId={blockId}
          field={`${field}.${idx}.title`}
          value={card.title}
          onCommit={(value) => patchBlockArray(cms, blockType, blockId, field, cards, idx, { title: value })}
        />
      </h3>
    </article>
  )

  if (cms.enabled || !reveal) return inner
  return (
    <Reveal variant={reveal} delayMs={delayMs} className="h-full">
      {inner}
    </Reveal>
  )
}

export function EsHomeSections({ snapshot, siteContact }: Props) {
  const cms = useCmsEdit()
  const hero = block(snapshot, "hero", HERO_BLOCK_ID)
  const sectors = block(snapshot, "features", SECTORS_BLOCK_ID)
  const about = block(snapshot, "about", ABOUT_BLOCK_ID)
  const work = block(snapshot, "gallery", WORK_BLOCK_ID)
  const services = block(snapshot, "features", SERVICES_BLOCK_ID)
  const why = block(snapshot, "features", WHY_BLOCK_ID)
  const contact = block(snapshot, "contact", CONTACT_BLOCK_ID)

  const heroData = hero?.type === "hero" ? hero.data : null
  const sectorsData = sectors?.type === "features" ? sectors.data : null
  const aboutData = about?.type === "about" ? about.data : null
  const workData = work?.type === "gallery" ? work.data : null
  const servicesData = services?.type === "features" ? services.data : null
  const whyData = why?.type === "features" ? why.data : null
  const contactData = contact?.type === "contact" ? contact.data : null

  const workItems = workData?.items || []
  const heroBackground = heroData?.heroImage || ASSET.hero
  const title = heroData?.title || "EVENT STRUCTURE AGENCY."
  const description = heroData?.description || "Creating impactful brand experiences and memorable environments."
  const banner = aboutData?.bannerText || "focus on what really matters"
  const [focusWord, ...focusRest] = banner.trim().split(/\s+/)
  const feelTitle = aboutData?.cards?.[0]?.title || "Experiential activations people feel, not just see."
  const feelLead =
    aboutData?.cards?.[0]?.description ||
    "Four reasons we're the difference between an activation and an experience people remember."

  const chapters = [
    { id: "sectors", label: "Work" },
    { id: "about", label: "About" },
    { id: "services", label: "Service" },
    { id: "why", label: "Why" },
    { id: "contact", label: contactData?.title || "Contact" },
  ]

  const rootClass = cn("esv2-root", !cms.enabled && "esv2-cursor-on", cms.enabled && "esv2-cms")
  const sectorCards = sectorsData?.cards || []
  const serviceCards = servicesData?.cards || []
  const whyCards = whyData?.cards || []
  const reasons = aboutData?.accordions || []

  return (
    <div className={rootClass}>
      {!cms.enabled ? <ChapterRail chapters={chapters} /> : null}

      <section className="relative">
        {cms.enabled ? (
          <div className="cms-admin-control mx-4 my-3 max-w-md rounded-lg border border-dashed border-border p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Hero photograph</p>
            <EditableImage
              src={mediaImageSrc(heroBackground)}
              alt="Event Structure stage truss"
              editMode
              flexibleCrop
              separateControls
              usageLabel="Hero photograph"
              className="h-28 w-full object-cover"
              width={2048}
              height={1365}
              onChange={(next) => cms.patchBlockData("hero", { heroImage: next }, HERO_BLOCK_ID)}
            />
          </div>
        ) : null}
        <ParallaxMedia className="relative h-[38vh] min-h-[220px] md:h-[52vh]">
          <FallbackImage
            src={mediaImageSrc(heroBackground)}
            alt="Event Structure stage truss"
            fill
            priority={!cms.enabled}
            quality={90}
            className="object-cover object-center"
            sizes="100vw"
          />
        </ParallaxMedia>
      </section>

      <section className="esv2-page py-12 text-center md:py-16">
        <h1 className="esv2-display text-[clamp(1.15rem,2.4vw,1.85rem)]">
          {cms.enabled ? (
            <EditableTextInline blockType="hero" blockId={HERO_BLOCK_ID} field="title" value={title} />
          ) : (
            <HeadlineReveal text={title} />
          )}
        </h1>
        <p className="esv2-display mx-auto mt-4 max-w-5xl text-[clamp(1.55rem,4.4vw,3.35rem)] leading-[1.05]">
          {cms.enabled ? (
            <EditableTextInline
              blockType="hero"
              blockId={HERO_BLOCK_ID}
              field="description"
              value={description}
              multiline
            />
          ) : (
            <HeadlineReveal text={description.replace(/\n/g, " ")} />
          )}
        </p>
      </section>

      <section id="sectors" className="px-2 pb-2 md:px-3">
        {cms.enabled ? (
          <div className="esv2-page py-3">
            <CmsListAddButton
              label="Add sector"
              onClick={() =>
                setBlockArray(cms, "features", SECTORS_BLOCK_ID, "cards", [
                  ...sectorCards,
                  { title: "New sector", description: "", icon: "" },
                ])
              }
            />
          </div>
        ) : null}
        <div className="esv2-sectors">
          {sectorCards.map((card, idx) => (
            <LabeledTile
              key={idx}
              card={card}
              cms={cms}
              blockType="features"
              blockId={SECTORS_BLOCK_ID}
              field="cards"
              cards={sectorCards}
              idx={idx}
              sizes="(max-width: 767px) 100vw, 50vw"
              reveal={idx === 0 || idx === 3 ? "left" : "right"}
              delayMs={idx * 80}
            />
          ))}
        </div>
      </section>

      <section id="about" className="mt-2">
        <Reveal variant="up">
          <p className="bg-foreground px-6 py-10 text-center text-[clamp(1.05rem,2.3vw,1.85rem)] font-bold leading-snug text-background md:px-16 md:py-12">
            <EditableTextInline
              blockType="about"
              blockId={ABOUT_BLOCK_ID}
              field="title"
              value={
                aboutData?.title ||
                "Transforming spaces into experiences with temporary structures that go beyond utility."
              }
            />
          </p>
        </Reveal>

        <div className="esv2-page bg-background py-8 md:py-10">
          <Reveal variant="left">
            <h2 className="esv2-focus-word esv2-serif text-[clamp(4.4rem,13vw,9rem)] leading-none">
              {focusWord || "focus"}
            </h2>
          </Reveal>
          <Reveal variant="right" delayMs={120}>
            <p className="esv2-display mt-10 text-right text-[clamp(1.4rem,3.6vw,2.8rem)] md:mt-16">
              {cms.enabled ? (
                <EditableTextInline
                  blockType="about"
                  blockId={ABOUT_BLOCK_ID}
                  field="bannerText"
                  value={banner}
                />
              ) : (
                focusRest.join(" ") || "on what really matters"
              )}
            </p>
          </Reveal>
          <img
            src={ASSET.skyline}
            alt="Budapest skyline"
            className="esv2-skyline mt-6"
            width={1600}
            height={400}
          />
        </div>

        <div className="esv2-page py-14 md:py-20">
          <Reveal variant="left">
            <h2 className="max-w-3xl text-[clamp(1.45rem,2.8vw,2.15rem)] font-bold leading-snug">
              <EditableTextInline
                blockType="about"
                blockId={ABOUT_BLOCK_ID}
                field="cards.0.title"
                value={feelTitle}
                onCommit={(value) =>
                  patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", aboutData?.cards || [], 0, { title: value })
                }
              />
            </h2>
          </Reveal>
          <Reveal variant="up" delayMs={80}>
            <p className="mt-6 max-w-3xl leading-relaxed">
              <EditableTextInline
                blockType="about"
                blockId={ABOUT_BLOCK_ID}
                field="paragraph"
                value={aboutData?.paragraph || ""}
                multiline
              />
            </p>
          </Reveal>
          <Reveal variant="up" delayMs={140}>
            <p className="mt-5 max-w-3xl leading-relaxed">
              <EditableTextInline
                blockType="about"
                blockId={ABOUT_BLOCK_ID}
                field="cards.0.description"
                value={feelLead}
                multiline
                onCommit={(value) =>
                  patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", aboutData?.cards || [], 0, {
                    description: value,
                  })
                }
              />
            </p>
          </Reveal>

          {cms.enabled ? (
            <CmsListAddButton
              label="Add reason"
              className="mt-8"
              onClick={() =>
                setBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", [
                  ...reasons,
                  { title: "New reason", content: "" },
                ])
              }
            />
          ) : null}

          <div id="reasons" className="mt-12 grid gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-14">
            {reasons.map((item, idx) => (
              <Reveal
                key={idx}
                variant={idx % 2 === 0 ? "left" : "right"}
                delayMs={(idx % 2) * REVEAL_STAGGER_MS}
              >
                {cms.enabled ? (
                  <CmsListItemToolbar
                    canMoveUp={idx > 0}
                    canMoveDown={idx < reasons.length - 1}
                    onMoveUp={() =>
                      setBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", moveArrayItem(reasons, idx, -1))
                    }
                    onMoveDown={() =>
                      setBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", moveArrayItem(reasons, idx, 1))
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "accordions",
                        reasons.filter((_, i) => i !== idx)
                      )
                    }
                  />
                ) : null}
                <div className="flex items-start gap-4">
                  <span className="esv2-reason-num">{idx + 1}</span>
                  <div>
                    <h3 className="text-lg font-bold leading-snug">
                      <EditableTextInline
                        blockType="about"
                        blockId={ABOUT_BLOCK_ID}
                        field={`accordions.${idx}.title`}
                        value={item.title}
                        onCommit={(value) =>
                          patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", reasons, idx, { title: value })
                        }
                      />
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      <EditableTextInline
                        blockType="about"
                        blockId={ABOUT_BLOCK_ID}
                        field={`accordions.${idx}.content`}
                        value={item.content}
                        multiline
                        onCommit={(value) =>
                          patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", reasons, idx, {
                            content: value,
                          })
                        }
                      />
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="grid min-h-[70vh] bg-foreground text-background md:grid-cols-2">
        <Reveal variant="left" className="flex flex-col justify-center px-6 py-16 md:px-14 lg:px-20">
          <p className="max-w-xl text-[clamp(1.35rem,2.6vw,2.05rem)] font-semibold leading-snug">
            <EditableTextInline
              blockType="contact"
              blockId={CONTACT_BLOCK_ID}
              field="description"
              value={
                contactData?.description ||
                "We are event strategists, experience architects, structure builders, custom designers, doers and fixers. Whatever your experience needs. Let's make impact together."
              }
              multiline
            />
          </p>
          <p className="mt-8 text-sm text-background/80">
            <EditableTextInline
              blockType="about"
              blockId={ABOUT_BLOCK_ID}
              field="boxHeading"
              value={aboutData?.boxHeading || "Csomor Tamás, COO, Partner"}
            />
          </p>
        </Reveal>
        <div className="relative min-h-[28rem] md:min-h-[70vh]">
          {cms.enabled ? (
            <EditableImage
              src={mediaImageSrc(aboutData?.image || ASSET.portrait)}
              alt={aboutData?.boxHeading || ""}
              editMode
              className="h-full w-full object-cover object-top"
              width={1920}
              height={1005}
              onChange={(next) => cms.patchBlockData("about", { image: next }, ABOUT_BLOCK_ID)}
            />
          ) : (
            <FallbackImage
              src={mediaImageSrc(aboutData?.image || ASSET.portrait)}
              alt={aboutData?.boxHeading || "Csomor Tamás"}
              fill
              quality={90}
              unoptimized
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </div>
      </section>

      <section id="services" className="esv2-section py-16 md:py-24">
        <div className="esv2-page mb-10 max-w-3xl">
          <Reveal variant="left">
            <h2 className="esv2-display text-[clamp(1.7rem,3.6vw,3.2rem)]">
              <EditableTextInline
                blockType="features"
                blockId={SERVICES_BLOCK_ID}
                field="title"
                value={servicesData?.title || "What We Actually Have/Do?"}
              />
            </h2>
          </Reveal>
          <Reveal variant="up" delayMs={80}>
            <p className="mt-5 leading-relaxed">
              <EditableTextInline
                blockType="features"
                blockId={SERVICES_BLOCK_ID}
                field="subtitle"
                value={servicesData?.subtitle || ""}
                multiline
              />
            </p>
          </Reveal>
        </div>
        {cms.enabled ? (
          <div className="esv2-page mb-4">
            <CmsListAddButton
              label="Add service"
              onClick={() =>
                setBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", [
                  ...serviceCards,
                  { title: "New service", description: "", icon: "" },
                ])
              }
            />
          </div>
        ) : null}
        <div className="esv2-service-grid px-2 md:px-3">
          {serviceCards.map((card, idx) => (
            <LabeledTile
              key={idx}
              card={card}
              cms={cms}
              blockType="features"
              blockId={SERVICES_BLOCK_ID}
              field="cards"
              cards={serviceCards}
              idx={idx}
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              reveal={idx % 3 === 0 ? "left" : idx % 3 === 2 ? "right" : "up"}
              delayMs={(idx % 3) * 90}
            />
          ))}
        </div>
      </section>

      <section
        id="talk"
        className="flex flex-col items-start justify-between gap-6 bg-foreground px-6 py-10 text-background md:flex-row md:items-center md:px-12 md:py-12"
      >
        <p className="max-w-3xl text-[clamp(1.15rem,2.4vw,1.9rem)] font-bold leading-snug">
          <EditableTextInline
            blockType="features"
            blockId={WHY_BLOCK_ID}
            field="subtitle"
            value={
              whyData?.subtitle ||
              "No project is too small. From a 10 m² stage to full event delivery, every project gets the same focus."
            }
            multiline
          />
        </p>
        {cms.enabled ? (
          <EditableLinkInline
            blockType="hero"
            blockId={HERO_BLOCK_ID}
            labelField="primaryCtaLabel"
            hrefField="primaryCtaHref"
            label={heroData?.primaryCtaLabel || "Let's Talk"}
            href={heroData?.primaryCtaHref || "#contact"}
            className="inline-flex bg-background px-7 py-3 text-sm font-semibold uppercase tracking-widest text-foreground"
          />
        ) : (
          <MagneticButton href={heroData?.primaryCtaHref || "#contact"} variant="invert">
            {heroData?.primaryCtaLabel || "Let's Talk"}
          </MagneticButton>
        )}
      </section>

      <section id="why" className="esv2-section py-16 md:py-24">
        <div className="esv2-page">
          <Reveal variant="left">
            <h2 className="esv2-display mb-12 text-[clamp(2rem,5vw,3.8rem)]">
              <EditableTextInline
                blockType="features"
                blockId={WHY_BLOCK_ID}
                field="title"
                value={whyData?.title || "Why We?"}
              />
            </h2>
          </Reveal>
          {cms.enabled ? (
            <CmsListAddButton
              label="Add value"
              className="mb-6"
              onClick={() =>
                setBlockArray(cms, "features", WHY_BLOCK_ID, "cards", [
                  ...whyCards,
                  { title: "New", description: "", icon: "" },
                ])
              }
            />
          ) : null}
          <div className="space-y-8 md:space-y-10">
            {whyCards.map((card, idx) => (
              <Reveal key={idx} variant={idx % 2 === 0 ? "left" : "right"} delayMs={idx * 40}>
                <article className="grid items-start gap-3 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-10">
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < whyCards.length - 1}
                      onMoveUp={() =>
                        setBlockArray(cms, "features", WHY_BLOCK_ID, "cards", moveArrayItem(whyCards, idx, -1))
                      }
                      onMoveDown={() =>
                        setBlockArray(cms, "features", WHY_BLOCK_ID, "cards", moveArrayItem(whyCards, idx, 1))
                      }
                      onRemove={() =>
                        setBlockArray(
                          cms,
                          "features",
                          WHY_BLOCK_ID,
                          "cards",
                          whyCards.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : null}
                  <h3 className="esv2-display text-[clamp(1.4rem,2.4vw,2.1rem)] md:text-right">
                    <EditableTextInline
                      blockType="features"
                      blockId={WHY_BLOCK_ID}
                      field={`cards.${idx}.title`}
                      value={card.title}
                      onCommit={(value) =>
                        patchBlockArray(cms, "features", WHY_BLOCK_ID, "cards", whyCards, idx, { title: value })
                      }
                    />
                  </h3>
                  <p className="max-w-xl leading-relaxed text-muted-foreground">
                    <EditableTextInline
                      blockType="features"
                      blockId={WHY_BLOCK_ID}
                      field={`cards.${idx}.description`}
                      value={card.description}
                      multiline
                      onCommit={(value) =>
                        patchBlockArray(cms, "features", WHY_BLOCK_ID, "cards", whyCards, idx, {
                          description: value,
                        })
                      }
                    />
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="esv2-section border-t border-border py-16 md:py-24">
        <div className="esv2-page grid gap-12 lg:grid-cols-2">
          <Reveal variant="left">
            <h2 className="esv2-display text-[clamp(2rem,4vw,3.4rem)]">
              <EditableTextInline
                blockType="contact"
                blockId={CONTACT_BLOCK_ID}
                field="title"
                value={contactData?.title || "Let's Talk"}
              />
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              {contactData?.companyName || "EVENTSTRUCTURE HUNGARY"}
            </p>
            {siteContact.emails.length > 0 ? (
              <SiteContactEmailsList emails={siteContact.emails} className="mt-4" itemClassName="underline" />
            ) : null}
          </Reveal>
          <Reveal variant="right">
            <ContactInquiryForm
              contactEmails={siteContact.emails}
              nameLabel={contactData?.nameLabel || "Name"}
              emailLabel={contactData?.emailLabel || "Email"}
              messageLabel={contactData?.messageLabel || "Message"}
              sendButtonLabel={contactData?.sendButtonLabel || "Send"}
              cmsSendButton={
                cms.enabled
                  ? {
                      enabled: true,
                      onLabelCommit: (value) =>
                        cms.patchBlockData("contact", { sendButtonLabel: value }, CONTACT_BLOCK_ID),
                    }
                  : undefined
              }
            />
          </Reveal>
        </div>
      </section>

      {cms.enabled ? (
        <section className="esv2-page border-t border-dashed border-border py-10">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Work archive (CMS)</p>
          <CmsListAddButton
            label="Add work image"
            className="mb-4"
            onClick={() => setBlockArray(cms, "gallery", WORK_BLOCK_ID, "items", [...workItems, { image: "", caption: "" }])}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workItems.map((item, idx) => (
              <figure key={idx} className="space-y-2 rounded-xl border border-border p-2">
                <CmsListItemToolbar
                  canMoveUp={idx > 0}
                  canMoveDown={idx < workItems.length - 1}
                  onMoveUp={() => setBlockArray(cms, "gallery", WORK_BLOCK_ID, "items", moveArrayItem(workItems, idx, -1))}
                  onMoveDown={() => setBlockArray(cms, "gallery", WORK_BLOCK_ID, "items", moveArrayItem(workItems, idx, 1))}
                  onRemove={() =>
                    setBlockArray(cms, "gallery", WORK_BLOCK_ID, "items", workItems.filter((_, i) => i !== idx))
                  }
                />
                <EditableImage
                  src={mediaImageSrc(item.image)}
                  alt={item.caption || "Event Structure project"}
                  editMode
                  className="aspect-[4/3] w-full object-cover"
                  width={800}
                  height={600}
                  onChange={(next) =>
                    patchBlockArray(cms, "gallery", WORK_BLOCK_ID, "items", workItems, idx, { image: next })
                  }
                />
                <EditableTextInline
                  blockType="gallery"
                  blockId={WORK_BLOCK_ID}
                  field={`items.${idx}.caption`}
                  value={item.caption || ""}
                  onCommit={(value) =>
                    patchBlockArray(cms, "gallery", WORK_BLOCK_ID, "items", workItems, idx, { caption: value })
                  }
                />
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
