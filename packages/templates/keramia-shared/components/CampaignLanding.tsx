"use client"

import Link from "next/link"
import { ChevronDown, MapPin, Phone } from "lucide-react"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { EditableDocImage } from "@wse/core/features/template-cms/primitives/EditableDocImage"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { cn } from "@wse/core/lib/utils"
import { KERAMIA_PHONE_HREF } from "../lib/constants"
import { BeforeAfterSlider } from "./BeforeAfterSlider"
import { KeramiaHoverLift, KeramiaReveal } from "./KeramiaMotion"
import type { CampaignPageContent } from "../static-pages/shared/schema"

type SiteContact = {
  emails: Array<{ id: string; label: string; email: string }>
  phone?: string
  address?: string
}

type Props = {
  content: CampaignPageContent
  siteContact: SiteContact
}

const EMPTY_BENEFIT = { title: "", description: "" }
const EMPTY_DISCOUNT = { value: "", label: "" }
const EMPTY_STEP = { number: "", title: "", description: "", duration: "" }
const EMPTY_SERVICE = { badge: "", title: "", description: "", ctaLabel: "" }
const EMPTY_RESULT = { category: "", title: "", description: "" }
const EMPTY_STAT = { value: "", label: "" }
const EMPTY_FAQ = { question: "", answer: "" }
const EMPTY_INTEREST_OPTION = { value: "", label: "" }

const WHITENING_SHADE_SWATCHES = [
  "#cdb98c",
  "#d9caa0",
  "#e4d8b6",
  "#ede4cb",
  "#f4eedb",
  "#faf6ea",
  "#fdfbf4",
  "#ffffff",
] as const

function EditableEyebrow({ path, value }: { path: string; value: string }) {
  const cms = useSurfaceDocEdit()
  if (!value.trim() && !cms.enabled) return null
  return (
    <p className="keramia-eyebrow mb-3">
      <EditableDocText path={path} value={value} />
    </p>
  )
}

function FaqItem({
  index,
  question,
  answer,
}: {
  index: number
  question: string
  answer: string
}) {
  const cms = useSurfaceDocEdit()
  const [open, setOpen] = useState(false)

  if (!cms.enabled && !question.trim()) return null

  if (cms.enabled) {
    return (
      <div className="space-y-3 border-b border-border/80 py-5">
        <EditableDocText path={`faq.items.${index}.question`} value={question} className="w-full font-medium" />
        <EditableDocText
          path={`faq.items.${index}.answer`}
          value={answer}
          multiline
          className="w-full text-sm"
        />
      </div>
    )
  }

  return (
    <div className="border-b border-border/80">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="keramia-serif text-lg font-medium text-foreground">{question}</span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function CampaignFormLabelsEditor({ contact }: { contact: CampaignPageContent["contact"] }) {
  const cms = useSurfaceDocEdit()
  const interestOptions = contact.interestOptions ?? []
  if (!cms.enabled) return null
  return (
    <div className="mb-4 space-y-4 rounded-lg border border-dashed border-primary/30 bg-muted/30 p-3 text-xs">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Űrlap feliratok
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <p>
          Név: <EditableDocText path="contact.nameLabel" value={contact.nameLabel} />
        </p>
        <p>
          Telefon: <EditableDocText path="contact.phoneLabel" value={contact.phoneLabel} />
        </p>
        <p>
          E-mail: <EditableDocText path="contact.emailLabel" value={contact.emailLabel} />
        </p>
        <p>
          Érdeklődés: <EditableDocText path="contact.interestLabel" value={contact.interestLabel} />
        </p>
        <p className="sm:col-span-2">
          Üzenet: <EditableDocText path="contact.messageLabel" value={contact.messageLabel} />
        </p>
        <p className="sm:col-span-2">
          Adatkezelés:{" "}
          <EditableDocText path="contact.privacyText" value={contact.privacyText} multiline />
        </p>
        <p>
          Küldés: <EditableDocText path="contact.submitLabel" value={contact.submitLabel} />
        </p>
      </div>
      <div className="space-y-2 border-t border-primary/10 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Érdeklődés opciók
        </p>
        <CmsListAddButton
          label="Új opció"
          onClick={() =>
            cms.setPath("contact.interestOptions", [
              ...interestOptions,
              { ...EMPTY_INTEREST_OPTION },
            ])
          }
        />
        {interestOptions.map((option, idx) => (
          <div key={idx} className="flex flex-wrap items-start gap-2 rounded border border-border/60 p-2">
            <CmsListItemToolbar
              canMoveUp={idx > 0}
              canMoveDown={idx < interestOptions.length - 1}
              onMoveUp={() =>
                cms.setPath(
                  "contact.interestOptions",
                  moveArrayItem(interestOptions, idx, -1)
                )
              }
              onMoveDown={() =>
                cms.setPath(
                  "contact.interestOptions",
                  moveArrayItem(interestOptions, idx, 1)
                )
              }
              onRemove={() =>
                cms.setPath(
                  "contact.interestOptions",
                  interestOptions.filter((_, i) => i !== idx)
                )
              }
            />
            <span className="text-muted-foreground">Érték:</span>
            <EditableDocText path={`contact.interestOptions.${idx}.value`} value={option.value} />
            <span className="text-muted-foreground">Felirat:</span>
            <EditableDocText path={`contact.interestOptions.${idx}.label`} value={option.label} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CampaignLanding({ content, siteContact }: Props) {
  const cms = useSurfaceDocEdit()
  const phone = content.hero.phone || siteContact.phone || ""
  const scrollToContact = "#kapcsolat"

  const showBenefits = content.benefits.length > 0 || cms.enabled
  const showOffer = content.offer.title.trim() || cms.enabled
  const showProcess = content.process.steps.length > 0 || cms.enabled
  const showServices = content.services.items.length > 0 || cms.enabled
  const showBeforeAfter = content.beforeAfter.title.trim() || cms.enabled
  const showResults = content.results.items.length > 0 || cms.enabled
  const showWhy = content.why.title.trim() || cms.enabled
  const showFaq = content.faq.items.length > 0 || cms.enabled
  const showCtaBand = content.ctaBand.title.trim() || cms.enabled

  return (
    <div className="keramia-sans bg-background text-foreground">
      <section className="keramia-hero-gradient relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[100px]" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-12 lg:items-center lg:px-8">
          <KeramiaReveal variant="fade-left" className="keramia-hero-copy space-y-6 lg:col-span-7">
            {(content.hero.badge || cms.enabled) && (
              <p className="keramia-promo-badge">
                <EditableDocText path="hero.badge" value={content.hero.badge} />
              </p>
            )}
            <h1 className="keramia-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              <EditableDocText path="hero.title" value={content.hero.title} />
            </h1>
            {(content.hero.tagline || cms.enabled) && (
              <p className="keramia-display text-lg font-semibold tracking-wide text-primary sm:text-xl">
                <EditableDocText path="hero.tagline" value={content.hero.tagline} />
              </p>
            )}
            {(content.hero.subtitle || cms.enabled) && (
              <p className="keramia-hero-muted max-w-xl whitespace-pre-line text-base leading-relaxed sm:text-lg">
                <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={scrollToContact} className="keramia-btn-primary">
                <EditableDocText path="hero.ctaLabel" value={content.hero.ctaLabel} />
              </Link>
              {(phone || cms.enabled) && (
                <a href={KERAMIA_PHONE_HREF} className="keramia-btn-outline">
                  <Phone className="h-4 w-4" />
                  <EditableDocText path="hero.phone" value={phone} />
                </a>
              )}
            </div>
            {(content.hero.location || cms.enabled) && (
              <p className="keramia-display keramia-hero-subtle flex items-center gap-2 text-xs tracking-wide">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <EditableDocText path="hero.location" value={content.hero.location} />
              </p>
            )}
          </KeramiaReveal>

          <KeramiaReveal variant="fade-scale" delay={0.2} className="space-y-6 lg:col-span-5">
            {(content.hero.image || cms.enabled) && (
              <EditableDocImage
                path="hero.image"
                src={content.hero.image}
                alt={content.hero.title}
                usageLabel="Hero kampánykép"
                width={800}
                height={1000}
                flexibleCrop
                frameClassName="relative aspect-[4/5] overflow-hidden rounded-2xl border border-primary/20 shadow-2xl"
              />
            )}
            <div className="keramia-hero-surface keramia-card-beige rounded-2xl border border-primary/20 p-8 text-center shadow-2xl">
              <p className="keramia-hero-promo-value text-5xl font-bold md:text-6xl">
                <EditableDocText path="hero.promoHighlight" value={content.hero.promoHighlight} />
              </p>
              {(content.hero.promoSubtext || cms.enabled) && (
                <p className="keramia-hero-promo-label mt-2 whitespace-pre-line text-[10px] uppercase tracking-[0.2em]">
                  <EditableDocText path="hero.promoSubtext" value={content.hero.promoSubtext} />
                </p>
              )}
            </div>
          </KeramiaReveal>
        </div>
      </section>

      {showBenefits ? (
        <section className="keramia-trust-bar mx-auto max-w-7xl px-4 lg:px-8">
          <div className="keramia-card p-6 md:p-10">
            {cms.enabled ? (
              <CmsListAddButton
                label="Új előny"
                onClick={() => cms.setPath("benefits", [...content.benefits, { ...EMPTY_BENEFIT }])}
              />
            ) : null}
            <div className="grid grid-cols-1 gap-8 divide-y divide-primary/10 md:grid-cols-4 md:divide-x md:divide-y-0">
              {content.benefits.map((item, idx) => (
                <article key={idx} className="flex gap-4 md:pl-6 md:first:pl-0">
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.benefits.length - 1}
                      onMoveUp={() =>
                        cms.setPath("benefits", moveArrayItem(content.benefits, idx, -1))
                      }
                      onMoveDown={() =>
                        cms.setPath("benefits", moveArrayItem(content.benefits, idx, 1))
                      }
                      onRemove={() =>
                        cms.setPath(
                          "benefits",
                          content.benefits.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : null}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                    <span className="keramia-display text-sm font-bold">{idx + 1}</span>
                  </div>
                  <div>
                  <h2 className="keramia-display text-base font-semibold tracking-wide text-foreground">
                    <EditableDocText path={`benefits.${idx}.title`} value={item.title} />
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    <EditableDocText path={`benefits.${idx}.description`} value={item.description} multiline />
                  </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showOffer ? (
        <section id="akcio" className="keramia-section-cream scroll-mt-28 py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <EditableEyebrow path="offer.eyebrow" value={content.offer.eyebrow} />
              <h2 className="keramia-serif text-3xl font-semibold md:text-4xl">
                <EditableDocText path="offer.title" value={content.offer.title} />
              </h2>
              {(content.offer.body || cms.enabled) && (
                <p className="mt-5 whitespace-pre-line text-muted-foreground leading-relaxed">
                  <EditableDocText path="offer.body" value={content.offer.body} multiline />
                </p>
              )}
              {(content.offer.discounts.length > 0 || cms.enabled) && (
                <div className="mt-8 flex flex-wrap gap-4">
                  {cms.enabled ? (
                    <CmsListAddButton
                      label="Új kedvezmény badge"
                      onClick={() =>
                        cms.setPath("offer.discounts", [...content.offer.discounts, { ...EMPTY_DISCOUNT }])
                      }
                    />
                  ) : null}
                  {content.offer.discounts.map((d, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-4 text-center"
                    >
                      {cms.enabled ? (
                        <CmsListItemToolbar
                          canMoveUp={idx > 0}
                          canMoveDown={idx < content.offer.discounts.length - 1}
                          onMoveUp={() =>
                            cms.setPath("offer.discounts", moveArrayItem(content.offer.discounts, idx, -1))
                          }
                          onMoveDown={() =>
                            cms.setPath("offer.discounts", moveArrayItem(content.offer.discounts, idx, 1))
                          }
                          onRemove={() =>
                            cms.setPath(
                              "offer.discounts",
                              content.offer.discounts.filter((_, i) => i !== idx)
                            )
                          }
                        />
                      ) : null}
                      <p className="text-2xl font-bold text-primary">
                        <EditableDocText path={`offer.discounts.${idx}.value`} value={d.value} />
                      </p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        <EditableDocText path={`offer.discounts.${idx}.label`} value={d.label} />
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3 rounded-2xl border border-border bg-surface/70 p-8">
              {cms.enabled ? (
                <CmsListAddButton
                  label="Új pont"
                  onClick={() => cms.setPath("offer.bullets", [...content.offer.bullets, ""])}
                />
              ) : null}
              {content.offer.bullets.map((bullet, idx) => (
                <p key={idx} className="flex gap-3 text-sm leading-relaxed text-foreground">
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.offer.bullets.length - 1}
                      onMoveUp={() =>
                        cms.setPath("offer.bullets", moveArrayItem(content.offer.bullets, idx, -1))
                      }
                      onMoveDown={() =>
                        cms.setPath("offer.bullets", moveArrayItem(content.offer.bullets, idx, 1))
                      }
                      onRemove={() =>
                        cms.setPath(
                          "offer.bullets",
                          content.offer.bullets.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <EditableDocText path={`offer.bullets.${idx}`} value={bullet} multiline className="flex-1" />
                </p>
              ))}
              {cms.enabled ? (
                <CmsListAddButton
                  label="Új lábjegyzet"
                  onClick={() => cms.setPath("offer.footnotes", [...content.offer.footnotes, ""])}
                />
              ) : null}
              {content.offer.footnotes.map((note, idx) => (
                <p key={idx} className="flex gap-2 pt-2 text-xs text-muted-foreground">
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      onRemove={() =>
                        cms.setPath(
                          "offer.footnotes",
                          content.offer.footnotes.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : null}
                  <EditableDocText path={`offer.footnotes.${idx}`} value={note} multiline className="flex-1" />
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showProcess ? (
        <section className="keramia-section-beige border-y border-primary/10 py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <EditableEyebrow path="process.eyebrow" value={content.process.eyebrow} />
            <h2 className="keramia-serif text-3xl font-semibold md:text-4xl">
              <EditableDocText path="process.title" value={content.process.title} />
            </h2>
            {(content.process.subtitle || cms.enabled) && (
              <p className="mt-4 max-w-3xl text-muted-foreground">
                <EditableDocText path="process.subtitle" value={content.process.subtitle} multiline />
              </p>
            )}
            {cms.enabled ? (
              <CmsListAddButton
                label="Új lépés"
                onClick={() =>
                  cms.setPath("process.steps", [...content.process.steps, { ...EMPTY_STEP }])
                }
              />
            ) : null}
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {content.process.steps.map((step, idx) => (
                <KeramiaHoverLift key={idx}>
                <article className="h-full rounded-2xl border border-border bg-background p-6 shadow-md">
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.process.steps.length - 1}
                      onMoveUp={() =>
                        cms.setPath("process.steps", moveArrayItem(content.process.steps, idx, -1))
                      }
                      onMoveDown={() =>
                        cms.setPath("process.steps", moveArrayItem(content.process.steps, idx, 1))
                      }
                      onRemove={() =>
                        cms.setPath(
                          "process.steps",
                          content.process.steps.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : null}
                  <p className="keramia-display text-xs font-semibold tracking-widest text-accent">
                    <EditableDocText path={`process.steps.${idx}.number`} value={step.number} />
                  </p>
                  <h3 className="keramia-serif mt-3 text-xl font-semibold">
                    <EditableDocText path={`process.steps.${idx}.title`} value={step.title} />
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <EditableDocText path={`process.steps.${idx}.description`} value={step.description} multiline />
                  </p>
                  {(step.duration || cms.enabled) && (
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-primary">
                      <EditableDocText path={`process.steps.${idx}.duration`} value={step.duration} />
                    </p>
                  )}
                </article>
                </KeramiaHoverLift>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showServices ? (
        <section id="kezelesek" className="keramia-section-cream scroll-mt-28 py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <EditableEyebrow path="services.eyebrow" value={content.services.eyebrow} />
            <h2 className="keramia-serif text-3xl font-semibold md:text-4xl">
              <EditableDocText path="services.title" value={content.services.title} />
            </h2>
            {(content.services.subtitle || cms.enabled) && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                <EditableDocText path="services.subtitle" value={content.services.subtitle} multiline />
              </p>
            )}
            {cms.enabled ? (
              <CmsListAddButton
                label="Új szolgáltatás"
                onClick={() =>
                  cms.setPath("services.items", [...content.services.items, { ...EMPTY_SERVICE }])
                }
              />
            ) : null}
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {content.services.items.map((item, idx) => (
                <KeramiaHoverLift key={idx}>
                <article
                  className="flex h-full flex-col rounded-2xl border border-border bg-surface/50 p-6 shadow-md"
                >
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.services.items.length - 1}
                      onMoveUp={() =>
                        cms.setPath("services.items", moveArrayItem(content.services.items, idx, -1))
                      }
                      onMoveDown={() =>
                        cms.setPath("services.items", moveArrayItem(content.services.items, idx, 1))
                      }
                      onRemove={() =>
                        cms.setPath(
                          "services.items",
                          content.services.items.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : null}
                  {(item.badge || cms.enabled) && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      <EditableDocText path={`services.items.${idx}.badge`} value={item.badge} />
                    </p>
                  )}
                  <h3 className="keramia-serif mt-2 text-2xl font-semibold">
                    <EditableDocText path={`services.items.${idx}.title`} value={item.title} />
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    <EditableDocText path={`services.items.${idx}.description`} value={item.description} multiline />
                  </p>
                  <Link
                    href={scrollToContact}
                    className="mt-6 inline-flex text-sm font-semibold text-accent hover:text-primary"
                  >
                    <EditableDocText path={`services.items.${idx}.ctaLabel`} value={item.ctaLabel} />
                  </Link>
                </article>
                </KeramiaHoverLift>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showBeforeAfter ? (
        <section className="keramia-section-beige border-y border-primary/10 py-24">
          <div className="mx-auto max-w-4xl px-4 lg:px-8">
            <EditableEyebrow path="beforeAfter.eyebrow" value={content.beforeAfter.eyebrow} />
            <h2 className="keramia-serif text-center text-3xl font-semibold md:text-4xl">
              <EditableDocText path="beforeAfter.title" value={content.beforeAfter.title} />
            </h2>
            <div className="mt-10">
              <BeforeAfterSlider
                beforeLabel={content.beforeAfter.beforeLabel}
                afterLabel={content.beforeAfter.afterLabel}
                caption={content.beforeAfter.caption}
                beforeImage={content.beforeAfter.beforeImage}
                afterImage={content.beforeAfter.afterImage}
              />
            </div>
            {cms.enabled ? (
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <EditableDocImage
                  path="beforeAfter.beforeImage"
                  src={content.beforeAfter.beforeImage}
                  alt={content.beforeAfter.beforeLabel}
                  usageLabel="Előtte kép"
                  width={1600}
                  height={1000}
                  flexibleCrop
                  frameClassName="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted"
                />
                <EditableDocImage
                  path="beforeAfter.afterImage"
                  src={content.beforeAfter.afterImage}
                  alt={content.beforeAfter.afterLabel}
                  usageLabel="Utána kép"
                  width={1600}
                  height={1000}
                  flexibleCrop
                  frameClassName="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted"
                />
              </div>
            ) : null}
            {cms.enabled ? (
              <div className="mt-4 grid gap-2 text-center text-xs">
                <EditableDocText path="beforeAfter.beforeLabel" value={content.beforeAfter.beforeLabel} />
                <EditableDocText path="beforeAfter.afterLabel" value={content.beforeAfter.afterLabel} />
                <EditableDocText path="beforeAfter.caption" value={content.beforeAfter.caption} multiline />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {showResults ? (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <EditableEyebrow path="results.eyebrow" value={content.results.eyebrow} />
            <h2 className="keramia-serif text-3xl font-semibold md:text-4xl">
              <EditableDocText path="results.title" value={content.results.title} />
            </h2>
            {(content.results.body || cms.enabled) && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                <EditableDocText path="results.body" value={content.results.body} multiline />
              </p>
            )}
            {!cms.enabled && content.results.stats.length === 0 ? (
              <div className="mt-8 max-w-xl">
                <div className="flex overflow-hidden rounded-lg border border-primary/20 shadow-sm">
                  {WHITENING_SHADE_SWATCHES.map((color) => (
                    <div key={color} className="h-10 flex-1" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Sötétebb árnyalat</span>
                  <span>Ragyogó fehér</span>
                </div>
              </div>
            ) : null}
            {(content.results.stats.length > 0 || cms.enabled) && (
              <div className="mt-8 flex flex-wrap gap-6">
                {cms.enabled ? (
                  <CmsListAddButton
                    label="Új stat"
                    onClick={() =>
                      cms.setPath("results.stats", [...content.results.stats, { ...EMPTY_STAT }])
                    }
                  />
                ) : null}
                {content.results.stats.map((stat, idx) => (
                  <div key={idx} className="rounded-xl border border-border px-5 py-3">
                    {cms.enabled ? (
                      <CmsListItemToolbar
                        onRemove={() =>
                          cms.setPath(
                            "results.stats",
                            content.results.stats.filter((_, i) => i !== idx)
                          )
                        }
                      />
                    ) : null}
                    <p className="font-semibold text-foreground">
                      <EditableDocText path={`results.stats.${idx}.value`} value={stat.value} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <EditableDocText path={`results.stats.${idx}.label`} value={stat.label} />
                    </p>
                  </div>
                ))}
              </div>
            )}
            {cms.enabled ? (
              <CmsListAddButton
                label="Új eredmény kártya"
                onClick={() =>
                  cms.setPath("results.items", [...content.results.items, { ...EMPTY_RESULT }])
                }
              />
            ) : null}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {content.results.items.map((item, idx) => (
                <article key={idx} className="rounded-2xl border border-border p-6">
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.results.items.length - 1}
                      onMoveUp={() =>
                        cms.setPath("results.items", moveArrayItem(content.results.items, idx, -1))
                      }
                      onMoveDown={() =>
                        cms.setPath("results.items", moveArrayItem(content.results.items, idx, 1))
                      }
                      onRemove={() =>
                        cms.setPath(
                          "results.items",
                          content.results.items.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                    <EditableDocText path={`results.items.${idx}.category`} value={item.category} />
                  </p>
                  <h3 className="keramia-serif mt-2 text-xl font-semibold">
                    <EditableDocText path={`results.items.${idx}.title`} value={item.title} />
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    <EditableDocText path={`results.items.${idx}.description`} value={item.description} multiline />
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showWhy ? (
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <EditableEyebrow path="why.eyebrow" value={content.why.eyebrow} />
            <h2 className="keramia-serif text-3xl font-semibold md:text-4xl">
              <EditableDocText path="why.title" value={content.why.title} />
            </h2>
            {(content.why.tip || cms.enabled) && (
              <p className="mt-4 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
                <EditableDocText path="why.tip" value={content.why.tip} multiline />
              </p>
            )}
            {(content.why.body || cms.enabled) && (
              <p className="mt-5 max-w-3xl text-muted-foreground leading-relaxed">
                <EditableDocText path="why.body" value={content.why.body} multiline />
              </p>
            )}
            {cms.enabled ? (
              <CmsListAddButton
                label="Új pont"
                onClick={() => cms.setPath("why.bullets", [...content.why.bullets, ""])}
              />
            ) : null}
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
              {content.why.bullets.map((bullet, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-foreground">
                  {!cms.enabled ? (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  ) : (
                    <CmsListItemToolbar
                      onRemove={() =>
                        cms.setPath(
                          "why.bullets",
                          content.why.bullets.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  )}
                  <EditableDocText path={`why.bullets.${idx}`} value={bullet} multiline className="flex-1" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {showFaq ? (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4">
            <EditableEyebrow path="faq.eyebrow" value={content.faq.eyebrow} />
            <h2 className="keramia-serif text-3xl font-semibold md:text-4xl">
              <EditableDocText path="faq.title" value={content.faq.title} />
            </h2>
            {cms.enabled ? (
              <CmsListAddButton
                label="Új GYIK"
                onClick={() => cms.setPath("faq.items", [...content.faq.items, { ...EMPTY_FAQ }])}
              />
            ) : null}
            <div className="mt-10">
              {content.faq.items.map((item, idx) => (
                <div key={idx}>
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < content.faq.items.length - 1}
                      onMoveUp={() =>
                        cms.setPath("faq.items", moveArrayItem(content.faq.items, idx, -1))
                      }
                      onMoveDown={() =>
                        cms.setPath("faq.items", moveArrayItem(content.faq.items, idx, 1))
                      }
                      onRemove={() =>
                        cms.setPath(
                          "faq.items",
                          content.faq.items.filter((_, i) => i !== idx)
                        )
                      }
                    />
                  ) : null}
                  <FaqItem index={idx} question={item.question} answer={item.answer} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showCtaBand ? (
        <section className="keramia-section-cream py-20">
          <div className="mx-auto max-w-5xl px-4 lg:px-8">
            <div className="keramia-cta-band relative p-8 text-center md:p-14">
              <h2 className="keramia-serif text-3xl font-bold sm:text-4xl">
                <EditableDocText path="ctaBand.title" value={content.ctaBand.title} />
              </h2>
              {(content.ctaBand.subtitle || cms.enabled) && (
                <p className="keramia-hero-muted mt-4 text-sm sm:text-base">
                  <EditableDocText path="ctaBand.subtitle" value={content.ctaBand.subtitle} multiline />
                </p>
              )}
              <ul className="keramia-hero-muted mt-6 space-y-2 text-xs">
                {content.ctaBand.bullets.map((b, idx) => (
                  <li key={idx}>
                    <EditableDocText path={`ctaBand.bullets.${idx}`} value={b} multiline />
                  </li>
                ))}
              </ul>
              <Link href={scrollToContact} className="keramia-btn-primary mt-8">
                <EditableDocText path="ctaBand.ctaLabel" value={content.ctaBand.ctaLabel} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section id="kapcsolat" className="keramia-section-beige scroll-mt-28 border-t border-primary/10 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[1fr_1.1fr] lg:px-8">
          <div>
            <EditableEyebrow path="contact.eyebrow" value={content.contact.eyebrow} />
            <h2 className="keramia-serif text-3xl font-semibold md:text-4xl">
              <EditableDocText path="contact.title" value={content.contact.title} />
            </h2>
            {(content.contact.subtitle || cms.enabled) && (
              <p className="mt-4 text-muted-foreground leading-relaxed">
                <EditableDocText path="contact.subtitle" value={content.contact.subtitle} multiline />
              </p>
            )}
            <div className="mt-8 space-y-4 text-sm">
              {siteContact.address ? (
                <p>
                  <span className="font-semibold">Cím / Address</span>
                  <br />
                  {siteContact.address}
                </p>
              ) : null}
              {phone ? (
                <p>
                  <span className="font-semibold">Telefon / Phone</span>
                  <br />
                  <a href={KERAMIA_PHONE_HREF} className="text-accent hover:text-primary">
                    {phone}
                  </a>
                </p>
              ) : null}
              {siteContact.emails[0] ? (
                <p>
                  <span className="font-semibold">E-mail</span>
                  <br />
                  <a
                    href={`mailto:${siteContact.emails[0].email}`}
                    className="text-accent hover:text-primary"
                  >
                    {siteContact.emails[0].email}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
          <div>
            <CampaignFormLabelsEditor contact={content.contact} />
            {content.contact.privacyText && !cms.enabled ? (
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                {content.contact.privacyText}
              </p>
            ) : null}
            <ContactInquiryForm
              contactEmails={siteContact.emails}
              nameLabel={content.contact.nameLabel}
              emailLabel={content.contact.emailLabel}
              messageLabel={content.contact.messageLabel}
              sendButtonLabel={content.contact.submitLabel}
              cmsSendButton={
                cms.enabled
                  ? {
                      enabled: true,
                      onLabelCommit: (value) => cms.setPath("contact.submitLabel", value),
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}
