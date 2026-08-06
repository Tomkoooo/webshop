"use client"

import { Mail, MapPin, Phone } from "lucide-react"
import { CmsImage, CmsList, CmsText } from "@wse/cms-bridge"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import type { HomeContent, PracticeAreaIcon } from "../pages/home/schema"
import { PracticeIcon } from "./PracticeIcon"

type SiteContact = {
  emails: Array<{ id: string; label: string; email: string }>
  phone?: string
  address?: string
}

type Props = {
  content: HomeContent
  siteContact: SiteContact
}

const EMPTY_PRACTICE = {
  icon: "generic" as PracticeAreaIcon,
  title: "Új szakterület",
  description: "",
}

const EMPTY_TESTIMONIAL = {
  quote: "Új vélemény",
  author: "",
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "")
  return digits ? `tel:${digits}` : undefined
}

function SectionEyebrow({ path, value }: { path: string; value: string }) {
  const cms = useSurfaceDocEdit()
  if (!value.trim() && !cms.enabled) return null
  return (
    <div className="mb-4">
      <p className="dz-eyebrow">
        <CmsText path={path} value={value} />
      </p>
      <span className="dz-gold-rule" aria-hidden />
    </div>
  )
}

export function LandingPage({ content, siteContact }: Props) {
  const cms = useSurfaceDocEdit()
  const phone = content.contact.phone || siteContact.phone || ""
  const email = content.contact.email || siteContact.emails[0]?.email || ""
  const address = content.contact.address || siteContact.address || ""
  const callHref = telHref(phone)
  const heroCtaHref = content.hero.ctaHref?.trim() || callHref || "#kapcsolat"

  return (
    <div id="top">
      {/* Hero — split composition */}
      <section className="grid min-h-[min(88svh,760px)] bg-background lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-14 xl:px-20">
          <div className="dz-reveal max-w-md">
            <span className="dz-logo-mark mb-8 h-16 w-16 text-xl" aria-hidden>
              <CmsText path="hero.logoText" value={content.hero.logoText || "JS"} />
            </span>
            <h1 className="dz-serif text-3xl leading-tight tracking-wide text-foreground sm:text-4xl lg:text-[2.6rem]">
              <CmsText path="hero.title" value={content.hero.title} multiline />
            </h1>
            <p className="dz-reveal-delay-1 dz-serif mt-5 text-lg italic text-muted-foreground sm:text-xl">
              <CmsText path="hero.tagline" value={content.hero.tagline} />
            </p>
            <div className="dz-reveal-delay-2 mt-10">
              <a href={heroCtaHref} className="dz-btn-primary">
                <CmsText path="hero.ctaLabel" value={content.hero.ctaLabel} />
              </a>
              {cms.enabled ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  CTA link: <CmsText path="hero.ctaHref" value={content.hero.ctaHref} />
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="relative min-h-[280px] bg-muted lg:min-h-full">
          <CmsImage
            path="hero.image"
            src={content.hero.image}
            alt={content.hero.imageAlt || content.hero.title}
            fill
            usageLabel="Hero kép"
            frameClassName="absolute inset-0 size-full"
            imageClassName="object-cover"
          />
        </div>
      </section>

      {/* About */}
      <section id="bemutatkozas" className="scroll-mt-24 bg-surface py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <CmsImage
              path="about.image"
              src={content.about.image}
              alt={content.about.imageAlt || content.about.title}
              fill
              usageLabel="Bemutatkozás portré"
              frameClassName="absolute inset-0 size-full"
              imageClassName="object-cover"
            />
          </div>
          <div>
            <SectionEyebrow path="about.eyebrow" value={content.about.eyebrow} />
            <h2 className="dz-serif text-3xl text-foreground sm:text-4xl">
              <CmsText path="about.title" value={content.about.title} />
            </h2>
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              <CmsText path="about.body" value={content.about.body} multiline />
            </p>
            {(content.about.ctaLabel.trim() || cms.enabled) && (
              <div className="mt-10">
                <a href={content.about.ctaHref || "#kapcsolat"} className="dz-btn-ghost">
                  <CmsText path="about.ctaLabel" value={content.about.ctaLabel} />
                </a>
                {cms.enabled ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Link: <CmsText path="about.ctaHref" value={content.about.ctaHref} />
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Practice areas */}
      <section id="szakteruletek" className="scroll-mt-24 bg-background py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow path="practiceAreas.eyebrow" value={content.practiceAreas.eyebrow} />
            <h2 className="dz-serif text-3xl text-foreground sm:text-4xl">
              <CmsText path="practiceAreas.title" value={content.practiceAreas.title} />
            </h2>
          </div>

          <CmsList
            path="practiceAreas.items"
            items={content.practiceAreas.items}
            createItem={() => ({ ...EMPTY_PRACTICE })}
            addLabel="Szakterület hozzáadása"
            maxItems={8}
            className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6"
            itemClassName="text-center"
            renderItem={(item, index) => (
              <div className="flex flex-col items-center px-2">
                <span className="mb-5 text-accent">
                  <PracticeIcon icon={item.icon} className="h-8 w-8" />
                </span>
                {cms.enabled ? (
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Ikon kulcs:{" "}
                    <CmsText path={`practiceAreas.items.${index}.icon`} value={item.icon} />
                  </p>
                ) : null}
                <h3 className="dz-serif text-lg tracking-wide text-foreground">
                  <CmsText path={`practiceAreas.items.${index}.title`} value={item.title} />
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  <CmsText
                    path={`practiceAreas.items.${index}.description`}
                    value={item.description}
                    multiline
                  />
                </p>
              </div>
            )}
          />

          {(content.practiceAreas.ctaLabel.trim() || cms.enabled) && (
            <div className="mt-14 text-center">
              <a
                href={content.practiceAreas.ctaHref || "#kapcsolat"}
                className="dz-btn-ghost"
              >
                <CmsText path="practiceAreas.ctaLabel" value={content.practiceAreas.ctaLabel} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="rolam" className="scroll-mt-24 bg-surface py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow path="testimonials.eyebrow" value={content.testimonials.eyebrow} />
            <h2 className="dz-serif text-3xl text-foreground sm:text-4xl">
              <CmsText path="testimonials.title" value={content.testimonials.title} />
            </h2>
          </div>
          <CmsList
            path="testimonials.items"
            items={content.testimonials.items}
            createItem={() => ({ ...EMPTY_TESTIMONIAL })}
            addLabel="Vélemény hozzáadása"
            maxItems={8}
            className="mt-12 grid gap-8 md:grid-cols-3"
            renderItem={(item, index) => (
              <blockquote className="border-t border-accent/40 pt-6 text-center">
                <p className="dz-serif text-lg italic leading-relaxed text-foreground">
                  <CmsText
                    path={`testimonials.items.${index}.quote`}
                    value={item.quote}
                    multiline
                  />
                </p>
                <footer className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <CmsText path={`testimonials.items.${index}.author`} value={item.author} />
                </footer>
              </blockquote>
            )}
          />
        </div>
      </section>

      {/* Quote banner */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0">
          <CmsImage
            path="quote.image"
            src={content.quote.image}
            alt={content.quote.imageAlt || "Idézet háttér"}
            fill
            usageLabel="Idézet háttérkép"
            frameClassName="absolute inset-0 size-full"
            imageClassName="object-cover"
          />
          <div className="absolute inset-0 bg-foreground/70" aria-hidden />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="dz-serif text-2xl italic leading-snug text-background sm:text-3xl lg:text-4xl">
            <CmsText path="quote.text" value={content.quote.text} multiline />
          </p>
        </div>
      </section>

      {/* Contact + call */}
      <section id="kapcsolat" className="scroll-mt-24 bg-background py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-3 lg:gap-10 lg:px-8">
          <div>
            <SectionEyebrow path="contact.eyebrow" value={content.contact.eyebrow} />
            <h2 className="dz-serif text-3xl text-foreground sm:text-4xl">
              <CmsText path="contact.title" value={content.contact.title} />
            </h2>
            <ul className="mt-8 space-y-5 text-sm text-foreground">
              {(phone || cms.enabled) && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                      <CmsText path="contact.phoneLabel" value={content.contact.phoneLabel} />
                    </p>
                    <a
                      href={callHref}
                      className="mt-1 inline-block hover:text-accent"
                    >
                      <CmsText path="contact.phone" value={phone} />
                    </a>
                  </div>
                </li>
              )}
              {(email || cms.enabled) && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                      <CmsText path="contact.emailLabel" value={content.contact.emailLabel} />
                    </p>
                    <a href={email ? `mailto:${email}` : undefined} className="mt-1 inline-block hover:text-accent">
                      <CmsText path="contact.email" value={email} />
                    </a>
                  </div>
                </li>
              )}
              {(address || cms.enabled) && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                      <CmsText path="contact.addressLabel" value={content.contact.addressLabel} />
                    </p>
                    <p className="mt-1">
                      <CmsText path="contact.address" value={address} multiline />
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className="relative hidden min-h-[320px] bg-muted lg:block">
            <CmsImage
              path="contact.image"
              src={content.contact.image}
              alt={content.contact.imageAlt || "Kapcsolat"}
              fill
              usageLabel="Kapcsolat kép"
              frameClassName="absolute inset-0 size-full"
              imageClassName="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center bg-surface p-6 sm:p-8">
            <SectionEyebrow path="contact.callEyebrow" value={content.contact.callEyebrow} />
            {(content.contact.callHint.trim() || cms.enabled) && (
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                <CmsText path="contact.callHint" value={content.contact.callHint} multiline />
              </p>
            )}
            {callHref || cms.enabled ? (
              <a
                href={callHref || "#"}
                className="dz-btn-primary w-full gap-2"
                aria-disabled={!callHref}
              >
                <Phone className="h-4 w-4" aria-hidden />
                <CmsText path="contact.callLabel" value={content.contact.callLabel} />
              </a>
            ) : null}
            {phone ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <a href={callHref} className="hover:text-foreground">
                  {phone}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
