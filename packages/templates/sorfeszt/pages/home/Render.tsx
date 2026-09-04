"use client"

import type { ReactNode } from "react"
import { CalendarClock, ImageIcon } from "lucide-react"
import { CmsImage } from "@wse/cms-bridge"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { EditableDocLink } from "@wse/core/features/template-cms/primitives/EditableDocLink"
import { CmsListAddButton, CmsListItemToolbar } from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { Reveal } from "@wse/core/components/motion/css-reveal"
import { cn } from "@wse/core/lib/utils"
import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"
import { SORFESZT_SECTION_ANCHORS, type SorfesztHomeSectionId } from "../../lib/sorfeszt-home-sections"
import { WaveRibbon } from "../../components/WaveRibbon"
import { SorfesztCmsBeerCard, SorfesztLiveTickets, ticketKindFromName } from "../../components/SorfesztTickets"

function SectionHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("font-heading text-3xl font-bold tracking-tight sm:text-4xl", className)}>
      {children}
    </h2>
  )
}

const DAY_HEADER: Record<"primary" | "secondary" | "accent", string> = {
  primary: "sorfeszt-schedule-head sorfeszt-schedule-head--primary",
  secondary: "sorfeszt-schedule-head sorfeszt-schedule-head--secondary",
  accent: "sorfeszt-schedule-head sorfeszt-schedule-head--accent",
}

function ticketOnSale(ctaHref: string, badge: string) {
  if (!ctaHref.trim()) return false
  return !badge.toLowerCase().includes("hamarosan")
}

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  const c = content
  const edit = useSurfaceDocEdit()
  const contactEmails = deps?.siteContact?.emails ?? []
  const sectionLayout = c.sectionLayout ?? []

  const sections: Record<SorfesztHomeSectionId, ReactNode> = {
    hero: (
      <section
        className={cn(
          "relative flex min-h-[min(72svh,560px)] items-center sorfeszt-hero-glow",
          edit.enabled ? "overflow-visible" : "overflow-hidden"
        )}
      >
        <CmsImage
          path="hero.heroImage"
          src={c.hero.heroImage}
          alt={c.hero.title}
          className="absolute inset-0 z-0"
          frameClassName="size-full"
          imageClassName="size-full object-cover"
          fill
          usageLabel="Hero kép"
        />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-primary via-primary/70 to-primary/20" />
        <div
          className={cn(
            "relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-32 sm:pb-16",
            edit.enabled &&
              "pointer-events-none [&_.cms-inline-edit-field]:pointer-events-auto [&_.cms-editable-cta-wrap]:pointer-events-auto"
          )}
        >
          <Reveal mode="mount" variant="fade" delayMs={0}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-secondary">
              <EditableDocText path="hero.tagline" value={c.hero.tagline} />
            </p>
          </Reveal>
          <Reveal mode="mount" variant="up" delayMs={80}>
            <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              <EditableDocText path="hero.title" value={c.hero.title} multiline />
            </h1>
          </Reveal>
          <Reveal mode="mount" variant="up" delayMs={160}>
            <p className="mt-4 max-w-2xl text-base text-primary-foreground sm:text-lg">
              <EditableDocText path="hero.subtitle" value={c.hero.subtitle} multiline />
            </p>
          </Reveal>
          <Reveal mode="mount" variant="up" delayMs={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <EditableDocLink
                labelPath="hero.primaryCtaLabel"
                hrefPath="hero.primaryCtaHref"
                label={c.hero.primaryCtaLabel}
                href={c.hero.primaryCtaHref}
                className="inline-flex min-h-11 items-center rounded-md bg-secondary px-6 py-2.5 text-sm font-semibold text-secondary-foreground hover:opacity-90"
              />
              <EditableDocLink
                labelPath="hero.secondaryCtaLabel"
                hrefPath="hero.secondaryCtaHref"
                label={c.hero.secondaryCtaLabel}
                href={c.hero.secondaryCtaHref}
                className="inline-flex min-h-11 items-center rounded-md border border-primary-foreground/30 bg-primary/30 px-6 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur hover:bg-primary/50"
              />
            </div>
          </Reveal>
        </div>
      </section>
    ),
    venue: (
      <section className="border-y border-border/60 bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading className="mb-8">
            <EditableDocText path="venue.heading" value={c.venue.heading} />
          </SectionHeading>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex min-h-full flex-col space-y-4">
              <h3 className="text-xl font-semibold">
                <EditableDocText path="venue.name" value={c.venue.name} />
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <EditableDocText path="venue.body" value={c.venue.body} multiline />
              </p>
              {c.venue.mapHref || edit.enabled ? (
                <div className="mt-auto pt-4">
                  <EditableDocLink
                    labelPath="venue.mapLabel"
                    hrefPath="venue.mapHref"
                    label={c.venue.mapLabel}
                    href={c.venue.mapHref}
                    className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline"
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-3">
              {c.venue.image || edit.enabled ? (
                <CmsImage
                  path="venue.image"
                  src={c.venue.image}
                  alt={c.venue.name || "Helyszín"}
                  className="overflow-hidden rounded-xl border border-border"
                  imageClassName="aspect-[4/3] w-full object-cover"
                  width={960}
                  height={720}
                  usageLabel="Helyszín fotó"
                />
              ) : null}
            </div>
          </div>
          {c.venue.mapEmbedUrl || edit.enabled ? (
            <div className="mt-8 space-y-3">
              {edit.enabled ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Google Maps beágyazás URL (iframe src)
                  </p>
                  <EditableDocText
                    path="venue.mapEmbedUrl"
                    value={c.venue.mapEmbedUrl}
                    multiline
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                  />
                </div>
              ) : null}
              {c.venue.mapEmbedUrl ? (
                <div className="aspect-[21/9] min-h-[240px] overflow-hidden rounded-xl border border-border bg-muted">
                  <iframe
                    title={c.venue.name || "Térkép"}
                    src={c.venue.mapEmbedUrl}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    ),
    tickets: (
      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionHeading className="mb-3">
              <EditableDocText path="tickets.heading" value={c.tickets.heading} />
            </SectionHeading>
            {c.tickets.intro || edit.enabled ? (
              <p className="text-muted-foreground">
                <EditableDocText path="tickets.intro" value={c.tickets.intro} multiline />
              </p>
            ) : null}
          </div>
          {edit.enabled ? (
          <div className="sorfeszt-pint-grid">
            {c.tickets.cards.map((card, index) => {
              const onSale = ticketOnSale(card.ctaHref, card.badge)
              return (
                <SorfesztCmsBeerCard
                  key={index}
                  kind={ticketKindFromName(card.name)}
                  onSale={onSale}
                  foamSlot={
                    <>
                      {edit.enabled ? (
                        <CmsListItemToolbar
                          onRemove={() =>
                            edit.setPath(
                              "tickets.cards",
                              c.tickets.cards.filter((_, i) => i !== index)
                            )
                          }
                        />
                      ) : null}
                      {card.badge || edit.enabled ? (
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a6331" }}>
                          <EditableDocText path={`tickets.cards.${index}.badge`} value={card.badge} />
                        </p>
                      ) : null}
                      <h3 className="mt-1 text-lg font-bold text-primary leading-tight">
                        <EditableDocText path={`tickets.cards.${index}.name`} value={card.name} />
                      </h3>
                    </>
                  }
                >
                  <p className="font-heading text-3xl font-black text-primary">
                    <EditableDocText path={`tickets.cards.${index}.price`} value={card.price} />
                  </p>
                  <ul className="sorfeszt-pint-features mt-4 flex-1">
                    {card.includes.map((item, itemIndex) => (
                      <li key={itemIndex} className="relative">
                        {edit.enabled ? (
                          <CmsListItemToolbar
                            onRemove={() =>
                              edit.setPath(
                                `tickets.cards.${index}.includes`,
                                card.includes.filter((_, i) => i !== itemIndex)
                              )
                            }
                          />
                        ) : null}
                        <EditableDocText
                          path={`tickets.cards.${index}.includes.${itemIndex}`}
                          value={item}
                        />
                      </li>
                    ))}
                  </ul>
                  {edit.enabled ? (
                    <CmsListAddButton
                      label="Tétel hozzáadása"
                      onClick={() =>
                        edit.setPath(`tickets.cards.${index}.includes`, [
                          ...card.includes,
                          "Új tétel",
                        ])
                      }
                    />
                  ) : null}
                  <div className="mt-5">
                    {onSale || edit.enabled ? (
                      <EditableDocLink
                        labelPath={`tickets.cards.${index}.ctaLabel`}
                        hrefPath={`tickets.cards.${index}.ctaHref`}
                        label={card.ctaLabel}
                        href={card.ctaHref || "/jegyek"}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 transition-colors"
                        
                      />
                    ) : (
                      <span className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary/20 bg-muted px-4 text-sm font-semibold text-muted-foreground" >
                        <EditableDocText
                          path={`tickets.cards.${index}.ctaLabel`}
                          value={card.ctaLabel || "Hamarosan"}
                        />
                      </span>
                    )}
                  </div>
                </SorfesztCmsBeerCard>
              )
            })}
            {edit.enabled ? (
              <CmsListAddButton
                label="Jegykártya hozzáadása"
                onClick={() =>
                  edit.setPath("tickets.cards", [
                    ...c.tickets.cards,
                    {
                      name: "Új jegy",
                      price: "0 Ft",
                      badge: "",
                      includes: ["Belépés"],
                      ctaLabel: "Jegyvásárlás",
                      ctaHref: "/jegyek",
                    },
                  ])
                }
              />
            ) : null}
          </div>
          ) : (
            <SorfesztLiveTickets
              apiKey={c.chrome.tbookApiKey ?? ""}
              fallback={
                <div className="sorfeszt-pint-grid">
                  {c.tickets.cards
                    .filter((card) => ticketOnSale(card.ctaHref, card.badge))
                    .map((card, index) => {
                    const onSale = true
                    return (
                      <SorfesztCmsBeerCard
                        key={index}
                        kind={ticketKindFromName(card.name)}
                        onSale={onSale}
                        foamSlot={
                          <>
                            {card.badge ? (
                              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a6331" }}>
                                {card.badge}
                              </p>
                            ) : null}
                            <h3 className="mt-1 text-lg font-bold text-primary leading-tight">{card.name}</h3>
                          </>
                        }
                      >
                        <p className="font-heading text-3xl font-black text-primary">{card.price}</p>
                        <ul className="sorfeszt-pint-features mt-4 flex-1">
                          {card.includes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <div className="mt-5">
                          <a
                            href={card.ctaHref || "/jegyek"}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 transition-colors"
                          >
                            {card.ctaLabel}
                          </a>
                        </div>
                      </SorfesztCmsBeerCard>
                    )
                  })}
                </div>
              }
            />
          )}
        </div>
      </section>
    ),
    beers: (
      <section className="border-y border-border/60 bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionHeading className="mb-3">
              <EditableDocText path="beers.heading" value={c.beers.heading} />
            </SectionHeading>
            {c.beers.body || edit.enabled ? (
              <p className="text-muted-foreground">
                <EditableDocText path="beers.body" value={c.beers.body} multiline />
              </p>
            ) : null}
          </div>
          {(c.beers.cards?.length ?? 0) === 0 && !edit.enabled ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/60 px-6 py-16 text-center">
              <p className="font-heading text-2xl font-semibold text-primary sm:text-3xl">
                <EditableDocText path="beers.emptyLabel" value={c.beers.emptyLabel ?? "Hamarosan"} />
              </p>
            </div>
          ) : (
            <div className="sorfeszt-beer-grid">
              {(c.beers.cards ?? []).map((card, index) => (
                <article key={index} className="sorfeszt-beer-card relative overflow-hidden">
                  {edit.enabled ? (
                    <CmsListItemToolbar
                      onRemove={() =>
                        edit.setPath(
                          "beers.cards",
                          (c.beers.cards ?? []).filter((_, i) => i !== index)
                        )
                      }
                    />
                  ) : null}
                  <CmsImage
                    path={`beers.cards.${index}.image`}
                    src={card.image}
                    alt={card.name || "Sör"}
                    className="aspect-[4/5] w-full bg-muted"
                    imageClassName="size-full object-cover"
                    width={640}
                    height={800}
                    usageLabel="Sör kép"
                  />
                  <div className="space-y-1 px-4 py-4">
                    {card.brewery || edit.enabled ? (
                      <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                        <EditableDocText path={`beers.cards.${index}.brewery`} value={card.brewery} />
                      </p>
                    ) : null}
                    <h3 className="font-heading text-xl font-bold text-primary">
                      <EditableDocText path={`beers.cards.${index}.name`} value={card.name} />
                    </h3>
                    {card.description || edit.enabled ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <EditableDocText
                          path={`beers.cards.${index}.description`}
                          value={card.description}
                          multiline
                        />
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
          {edit.enabled ? (
            <div className="mt-6 text-center">
              {(c.beers.cards?.length ?? 0) === 0 ? (
                <p className="mb-3 font-heading text-lg font-semibold text-primary">
                  <EditableDocText path="beers.emptyLabel" value={c.beers.emptyLabel ?? "Hamarosan"} />
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">
                    (üres lista — a látogatóknak ezt mutatjuk)
                  </span>
                </p>
              ) : null}
              <CmsListAddButton
                label="Sörkártya hozzáadása"
                onClick={() =>
                  edit.setPath("beers.cards", [
                    ...(c.beers.cards ?? []),
                    {
                      image: "/placeholder.png",
                      name: "Új sör",
                      brewery: "",
                      description: "",
                    },
                  ])
                }
              />
            </div>
          ) : null}
        </div>
      </section>
    ),
    schedule: (
      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <SectionHeading className="mb-3">
              <EditableDocText path="schedule.heading" value={c.schedule.heading} />
            </SectionHeading>
            {c.schedule.intro || edit.enabled ? (
              <p className="text-muted-foreground">
                <EditableDocText path="schedule.intro" value={c.schedule.intro} multiline />
              </p>
            ) : null}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {c.schedule.days.map((day, index) => (
              <div key={index} className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                {edit.enabled ? (
                  <CmsListItemToolbar
                    onRemove={() =>
                      edit.setPath(
                        "schedule.days",
                        c.schedule.days.filter((_, i) => i !== index)
                      )
                    }
                  />
                ) : null}
                <div className={cn("px-5 py-4", DAY_HEADER[day.accent] ?? DAY_HEADER.primary)}>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
                    <EditableDocText path={`schedule.days.${index}.date`} value={day.date} />
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-bold text-inherit">
                    <EditableDocText path={`schedule.days.${index}.title`} value={day.title} />
                  </h3>
                  {day.hours || edit.enabled ? (
                    <p className="mt-1 text-sm opacity-90">
                      <EditableDocText path={`schedule.days.${index}.hours`} value={day.hours} />
                    </p>
                  ) : null}
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {day.items.map((item, itemIndex) => (
                      <tr key={itemIndex} className="border-t border-border/70">
                        <th className="w-24 px-4 py-3 text-left align-top font-semibold text-primary">
                          <div className="relative">
                            {edit.enabled ? (
                              <CmsListItemToolbar
                                onRemove={() =>
                                  edit.setPath(
                                    `schedule.days.${index}.items`,
                                    day.items.filter((_, i) => i !== itemIndex)
                                  )
                                }
                              />
                            ) : null}
                            <EditableDocText
                              path={`schedule.days.${index}.items.${itemIndex}.time`}
                              value={item.time}
                            />
                          </div>
                        </th>
                        <td className="px-4 py-3 text-foreground">
                          <EditableDocText
                            path={`schedule.days.${index}.items.${itemIndex}.title`}
                            value={item.title}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {edit.enabled ? (
                  <div className="border-t border-border px-4 py-3">
                    <CmsListAddButton
                      label="Programsor"
                      onClick={() =>
                        edit.setPath(`schedule.days.${index}.items`, [
                          ...day.items,
                          { time: "00:00", title: "Új program" },
                        ])
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {edit.enabled ? (
            <div className="mt-6">
              <CmsListAddButton
                label="Nap hozzáadása"
                onClick={() =>
                  edit.setPath("schedule.days", [
                    ...c.schedule.days,
                    {
                      date: "Új dátum",
                      title: "Nap",
                      hours: "",
                      accent: "primary",
                      items: [{ time: "00:00", title: "Program" }],
                    },
                  ])
                }
              />
            </div>
          ) : null}
        </div>
      </section>
    ),
    hours: (
      <section className="border-y border-border/60 bg-surface py-16">
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading className="mb-3 text-center">
            <EditableDocText path="hours.heading" value={c.hours.heading} />
          </SectionHeading>
          {c.hours.intro || edit.enabled ? (
            <p className="mb-8 text-center text-muted-foreground">
              <EditableDocText path="hours.intro" value={c.hours.intro} multiline />
            </p>
          ) : null}
          <ul className="space-y-3">
            {c.hours.days.map((row, index) => (
              <li
                key={index}
                className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-5 py-4"
              >
                {edit.enabled ? (
                  <CmsListItemToolbar
                    onRemove={() =>
                      edit.setPath(
                        "hours.days",
                        c.hours.days.filter((_, i) => i !== index)
                      )
                    }
                  />
                ) : null}
                <span className="inline-flex items-center gap-2 font-medium">
                  <CalendarClock className="size-4 text-secondary" aria-hidden />
                  <EditableDocText path={`hours.days.${index}.day`} value={row.day} />
                </span>
                <span className="font-heading text-lg font-semibold text-primary">
                  <EditableDocText path={`hours.days.${index}.hours`} value={row.hours} />
                </span>
              </li>
            ))}
          </ul>
          {edit.enabled ? (
            <div className="mt-4">
              <CmsListAddButton
                label="Nap hozzáadása"
                onClick={() =>
                  edit.setPath("hours.days", [
                    ...c.hours.days,
                    { day: "Új nap", hours: "00:00 – 00:00" },
                  ])
                }
              />
            </div>
          ) : null}
        </div>
      </section>
    ),
    gallery: (
      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading className="mb-8 text-center">
            <EditableDocText path="gallery.heading" value={c.gallery.heading} />
          </SectionHeading>
          {c.gallery.items.length === 0 && !edit.enabled ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <ImageIcon className="mb-3 size-10 text-muted-foreground" aria-hidden />
              <p className="font-heading text-2xl font-semibold text-primary">
                <EditableDocText path="gallery.emptyLabel" value={c.gallery.emptyLabel} />
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.gallery.items.map((item, index) => (
                <figure key={index} className="relative overflow-hidden rounded-xl border border-border bg-surface">
                  {edit.enabled ? (
                    <CmsListItemToolbar
                      onRemove={() =>
                        edit.setPath(
                          "gallery.items",
                          c.gallery.items.filter((_, i) => i !== index)
                        )
                      }
                    />
                  ) : null}
                  <CmsImage
                    path={`gallery.items.${index}.image`}
                    src={item.image}
                    alt={item.caption || "Galéria"}
                    className="aspect-[4/3] w-full"
                    imageClassName="size-full object-cover"
                    width={800}
                    height={600}
                    usageLabel="Galéria kép"
                  />
                  {item.caption || edit.enabled ? (
                    <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                      <EditableDocText
                        path={`gallery.items.${index}.caption`}
                        value={item.caption}
                      />
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          )}
          {edit.enabled ? (
            <div className="mt-6 text-center">
              <CmsListAddButton
                label="Kép hozzáadása"
                onClick={() =>
                  edit.setPath("gallery.items", [
                    ...c.gallery.items,
                    { image: "/placeholder.png", caption: "" },
                  ])
                }
              />
            </div>
          ) : null}
        </div>
      </section>
    ),
    contact: (
      <section className="border-t border-border/60 bg-muted/30 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionHeading>
              <EditableDocText path="contact.heading" value={c.contact.heading} />
            </SectionHeading>
            <p className="text-muted-foreground">
              <EditableDocText path="contact.body" value={c.contact.body} multiline />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <ContactInquiryForm
              contactEmails={contactEmails}
              nameLabel={<EditableDocText path="contact.nameLabel" value={c.contact.nameLabel} />}
              emailLabel={<EditableDocText path="contact.emailLabel" value={c.contact.emailLabel} />}
              messageLabel={
                <EditableDocText path="contact.messageLabel" value={c.contact.messageLabel} />
              }
              sendButtonLabel={c.contact.sendButtonLabel || "Üzenet küldése"}
              namePlaceholder="Kovács Anna"
              emailPlaceholder="nev@pelda.hu"
              messagePlaceholder="Szia — kérdésem van a jegyekkel kapcsolatban…"
              cmsSendButton={
                edit.enabled
                  ? {
                      enabled: true,
                      onLabelCommit: (value) => edit.setPath("contact.sendButtonLabel", value),
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </section>
    ),
  }

  return (
    <div className="relative overflow-x-hidden bg-background text-foreground">
      <div className="relative z-[1]">
        {sectionLayout.flatMap((entry, index) => {
          if (!entry.enabled) return []
          const block = (
            <Reveal
              key={entry.id}
              id={SORFESZT_SECTION_ANCHORS[entry.id]}
              variant="up"
              delayMs={index * 30}
              margin="0px 0px -40px 0px"
              className={SORFESZT_SECTION_ANCHORS[entry.id] ? "scroll-mt-24" : undefined}
            >
              {sections[entry.id]}
            </Reveal>
          )
          const extra: ReactNode[] = []
          if (entry.id === "venue" && (c.ribbons?.beforeTickets || edit.enabled)) {
            extra.push(
              <WaveRibbon key="ribbon-tickets" variant="navy">
                <EditableDocText path="ribbons.beforeTickets" value={c.ribbons?.beforeTickets ?? ""} multiline />
              </WaveRibbon>
            )
          }
          if (entry.id === "beers" && (c.ribbons?.afterBeers || edit.enabled)) {
            extra.push(
              <WaveRibbon key="ribbon-beers" variant="gold">
                <EditableDocText path="ribbons.afterBeers" value={c.ribbons?.afterBeers ?? ""} multiline />
              </WaveRibbon>
            )
          }
          return [block, ...extra]
        })}
      </div>
    </div>
  )
}
