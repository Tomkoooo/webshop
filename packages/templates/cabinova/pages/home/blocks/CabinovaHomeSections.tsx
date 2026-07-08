"use client"

import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { CabinovaHeadline, CabinovaMarquee } from "../../../components/CabinovaMotion"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import type { HomePageDeps } from "@wse/sdk/templates/types"
import { mediaImageSrc } from "@wse/core/lib/images"

const HERO_ID = "hero-cabinova"
const MANIFESTO_ID = "about-cabinova"
const PROCESS_ID = "features-cabinova"
const MODELS_ID = "products-cabinova"
const CONTACT_ID = "contact-cabinova"

function block(snapshot: HomepageSnapshot, type: string, id: string) {
  return snapshot.blocks.find((b) => b.type === type && b.id === id)
}

export function CabinovaHomeSections({
  snapshot,
  deps,
}: {
  snapshot: HomepageSnapshot
  deps: HomePageDeps
}) {
  const cms = useCmsEdit()
  const hero = block(snapshot, "hero", HERO_ID)
  const heroData = hero?.type === "hero" ? hero.data : null
  const about = block(snapshot, "about", MANIFESTO_ID)
  const aboutData = about?.type === "about" ? about.data : null
  const features = block(snapshot, "features", PROCESS_ID)
  const featuresData = features?.type === "features" ? features.data : null
  const grid = block(snapshot, "productGrid", MODELS_ID)
  const gridData = grid?.type === "productGrid" ? grid.data : null
  const contact = block(snapshot, "contact", CONTACT_ID)
  const contactData = contact?.type === "contact" ? contact.data : null

  const heroImage = heroData?.heroImage || "/template-assets/cabinova/hero-forest.jpg"
  const featuredProducts = deps.products.slice(0, 4)
  const trustItems = ["Dezeen", "Cereal Magazine", "Wallpaper*", "Architectural Digest", "ArchDaily", "Monocle"]

  return (
    <>
      <section className="relative h-[100svh] w-full overflow-hidden cabinova-grain">
        <FallbackImage src={mediaImageSrc(heroImage)} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-background" />
        <div className="relative z-10 cabinova-page flex h-full flex-col justify-between pt-28 pb-12">
          <Reveal mode="mount" delayMs={400}>
            <p className="cabinova-eyebrow text-primary-foreground/80">
              <EditableTextInline blockType="hero" blockId={HERO_ID} field="badges.0" value={heroData?.badges?.[0] || "Est. Brussels — Catalog N° 07"} />
            </p>
          </Reveal>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-primary-foreground text-[clamp(3rem,10vw,11rem)] leading-[0.92] tracking-[-0.04em]">
              <CabinovaHeadline text={heroData?.title || "A house, delivered in eleven weeks."} />
            </h1>
            <Reveal mode="mount" delayMs={900}>
              <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
                <p className="max-w-md text-primary-foreground/85 text-base md:text-lg leading-relaxed">
                  <EditableTextInline blockType="hero" blockId={HERO_ID} field="description" value={heroData?.description || ""} multiline />
                </p>
                <EditableLinkInline
                  blockType="hero"
                  blockId={HERO_ID}
                  labelField="primaryCtaLabel"
                  hrefField="primaryCtaHref"
                  label={heroData?.primaryCtaLabel || "View the catalog"}
                  href={heroData?.primaryCtaHref || "/shop"}
                  appearance="link"
                  className="group inline-flex items-center gap-3 bg-background text-foreground px-7 py-4 text-sm uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors duration-500"
                  suffix={
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  }
                />
              </div>
            </Reveal>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-primary-foreground/70 text-xs font-mono uppercase tracking-[0.3em]">
          Scroll
          <span className="sf-scroll-nudge h-8 w-px bg-primary-foreground/40" />
        </div>
      </section>

      <section className="border-y border-border py-8">
        <CabinovaMarquee>
          {trustItems.map((item) => (
            <span key={item} className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-muted-foreground italic px-4">
              {item}
            </span>
          ))}
        </CabinovaMarquee>
      </section>

      <section className="cabinova-page py-32 md:py-48">
        <div className="grid md:grid-cols-12 gap-12">
          <Reveal className="md:col-span-3">
            <p className="cabinova-eyebrow">Manifesto — 001</p>
          </Reveal>
          <div className="md:col-span-9 md:col-start-4">
            <Reveal>
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
                <EditableTextInline blockType="about" blockId={MANIFESTO_ID} field="title" value={aboutData?.title || ""} multiline />
              </h2>
            </Reveal>
            <Reveal delayMs={REVEAL_STAGGER_MS}>
              <div className="mt-16 grid sm:grid-cols-3 gap-8 border-t border-border pt-8">
                {(aboutData?.cards || []).slice(0, 3).map((card, i) => (
                  <div key={i}>
                    <div className="font-[family-name:var(--font-display)] text-6xl md:text-7xl text-accent">
                      <EditableTextInline blockType="about" blockId={MANIFESTO_ID} field={`cards.${i}.title`} value={card.title} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground max-w-[14ch]">
                      <EditableTextInline blockType="about" blockId={MANIFESTO_ID} field={`cards.${i}.description`} value={card.description} multiline />
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-32 md:py-48">
        <div className="cabinova-page">
          <div className="flex flex-wrap items-end justify-between gap-8 mb-20">
            <Reveal>
              <p className="cabinova-eyebrow mb-4">Selected Models</p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl tracking-tight max-w-3xl">
                <EditableTextInline blockType="productGrid" blockId={MODELS_ID} field="title" value={gridData?.title || "Four shapes of the same idea."} />
              </h2>
            </Reveal>
            <Reveal delayMs={100}>
              {cms.enabled ? (
                <EditableLinkInline
                  blockType="productGrid"
                  blockId={MODELS_ID}
                  labelField="viewAllLabel"
                  hrefField="viewAllHref"
                  label={gridData?.viewAllLabel || "All collections →"}
                  href={gridData?.viewAllHref || "/shop"}
                  appearance="link"
                  className="text-accent underline underline-offset-8 decoration-1 text-sm uppercase tracking-[0.2em] hover:text-foreground transition-colors"
                />
              ) : (
                <Link
                  href={gridData?.viewAllHref || "/shop"}
                  className="text-accent underline underline-offset-8 decoration-1 text-sm uppercase tracking-[0.2em]"
                >
                  {gridData?.viewAllLabel || "All collections →"}
                </Link>
              )}
            </Reveal>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            {featuredProducts.map((p, i) => (
              <Reveal key={p.id} delayMs={i * 80} className={i % 2 === 1 ? "md:mt-24" : ""}>
                <Link href={`/products/${p.slug}`} className="group block">
                  <div className="relative overflow-hidden bg-muted aspect-[4/5]">
                    <FallbackImage src={mediaImageSrc(p.image)} alt={p.name} fill className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                  </div>
                  <div className="mt-6 flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl tracking-tight group-hover:text-accent transition-colors">
                        {p.name}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm">{p.category || "Model"}</p>
                    </div>
                    <div className="text-right text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground shrink-0">
                      {p.price ? <div className="text-foreground">{p.price}</div> : null}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cabinova-page py-32 md:py-48">
        <Reveal>
          <p className="cabinova-eyebrow mb-4">Process</p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl tracking-tight max-w-4xl">
            <EditableTextInline blockType="features" blockId={PROCESS_ID} field="title" value={featuresData?.title || "Three steps, eleven weeks, one set of keys."} />
          </h2>
        </Reveal>
        <div className="mt-20 grid md:grid-cols-3 gap-px bg-border">
          {(featuresData?.cards || []).slice(0, 3).map((step, i) => (
            <Reveal key={i} delayMs={i * REVEAL_STAGGER_MS} className="bg-background p-10 md:p-12">
              <div className="font-mono text-accent text-sm tracking-[0.2em]">0{i + 1}</div>
              <h3 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl mt-8">
                <EditableTextInline blockType="features" blockId={PROCESS_ID} field={`cards.${i}.title`} value={step.title} />
              </h3>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                <EditableTextInline blockType="features" blockId={PROCESS_ID} field={`cards.${i}.description`} value={step.description} multiline />
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-surface border-t border-border py-32 md:py-40 scroll-mt-24">
        <div className="cabinova-page grid md:grid-cols-12 gap-12 lg:gap-20">
          <Reveal className="md:col-span-5">
            <p className="cabinova-eyebrow mb-6">Contact — 004</p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              <EditableTextInline blockType="contact" blockId={CONTACT_ID} field="title" value={contactData?.title || "A few lines is enough to begin."} multiline />
            </h2>
            <p className="mt-8 text-muted-foreground leading-relaxed max-w-md">
              <EditableTextInline blockType="contact" blockId={CONTACT_ID} field="description" value={contactData?.description || ""} multiline />
            </p>
          </Reveal>
          <div className="md:col-span-7">
            <ContactInquiryForm
              contactEmails={deps.siteContact.emails}
              nameLabel={contactData?.nameLabel || "Name"}
              emailLabel={contactData?.emailLabel || "Email"}
              messageLabel={contactData?.messageLabel || "Message"}
              sendButtonLabel={contactData?.sendButtonLabel || "Send"}
              cmsSendButton={
                cms.enabled
                  ? {
                      enabled: true,
                      onLabelCommit: (value) =>
                        cms.updateField("contact", "sendButtonLabel", value, CONTACT_ID),
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </section>
    </>
  )
}
