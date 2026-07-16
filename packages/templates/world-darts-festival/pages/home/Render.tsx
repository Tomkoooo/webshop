"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
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
import { WDF_SECTION_ANCHORS, type WdfHomeSectionId } from "../../lib/wdf-home-sections"

function SectionHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-2xl font-bold tracking-tight sm:text-3xl", className)}>{children}</h2>
  )
}

function ScheduleDay({
  index,
  date,
  title,
  items,
}: {
  index: number
  date: string
  title: string
  items: string[]
}) {
  const [open, setOpen] = useState(index === 0)
  const edit = useSurfaceDocEdit()
  const panelId = `schedule-day-${index}`
  const itemsPath = `schedule.days.${index}.items`

  return (
    <div className="rounded-xl border border-border/60 bg-surface overflow-hidden">
      <button
        type="button"
        id={`${panelId}-btn`}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="text-sm font-medium text-primary">
            <EditableDocText path={`schedule.days.${index}.date`} value={date} />
          </p>
          <p className="font-semibold">
            <EditableDocText path={`schedule.days.${index}.title`} value={title} />
          </p>
        </div>
        <ChevronDown className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={`${panelId}-btn`} className="space-y-2 border-t border-border/60 px-5 py-4">
          <ul className="space-y-2">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="relative flex items-start gap-2 text-sm text-muted-foreground">
                {edit.enabled ? (
                  <CmsListItemToolbar
                    onRemove={() =>
                      edit.setPath(
                        itemsPath,
                        items.filter((_, i) => i !== itemIndex)
                      )
                    }
                  />
                ) : null}
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <EditableDocText
                  path={`schedule.days.${index}.items.${itemIndex}`}
                  value={item}
                  multiline
                />
              </li>
            ))}
          </ul>
          {edit.enabled ? (
            <CmsListAddButton
              label="Programpont hozzáadása"
              onClick={() => edit.setPath(itemsPath, [...items, "New schedule item"])}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PrizeMoneyTable({
  tableIndex,
  title,
  subtitle,
  headers,
  rows,
}: {
  tableIndex: number
  title: string
  subtitle: string
  headers: string[]
  rows: string[][]
}) {
  const edit = useSurfaceDocEdit()
  const basePath = `prizeMoney.tables.${tableIndex}`
  const headersPath = `${basePath}.headers`
  const rowsPath = `${basePath}.rows`

  const addColumn = () => {
    edit.setPath(headersPath, [...headers, "Column"])
    edit.setPath(
      rowsPath,
      rows.map((row) => [...row, ""])
    )
  }

  const removeColumn = (colIndex: number) => {
    if (headers.length <= 1) return
    edit.setPath(
      headersPath,
      headers.filter((_, i) => i !== colIndex)
    )
    edit.setPath(
      rowsPath,
      rows.map((row) => row.filter((_, i) => i !== colIndex))
    )
  }

  const addRow = () => {
    edit.setPath(rowsPath, [...rows, headers.map(() => "")])
  }

  const removeRow = (rowIndex: number) => {
    edit.setPath(
      rowsPath,
      rows.filter((_, i) => i !== rowIndex)
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <h3 className="text-lg font-semibold">
          <EditableDocText path={`${basePath}.title`} value={title} />
        </h3>
        {subtitle || edit.enabled ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <EditableDocText
              path={`${basePath}.subtitle`}
              value={subtitle}
              placeholder="Másodlagos szöveg a táblázat alatt"
            />
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {headers.map((header, colIndex) => (
                <th key={colIndex} className="px-4 py-3 text-left font-semibold">
                  <div className="flex items-start justify-between gap-2">
                    <EditableDocText path={`${headersPath}.${colIndex}`} value={header} />
                    {edit.enabled && headers.length > 1 ? (
                      <button
                        type="button"
                        className="cms-admin-control shrink-0 rounded px-1 text-xs text-destructive hover:bg-destructive/10"
                        aria-label="Oszlop törlése"
                        onClick={() => removeColumn(colIndex)}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
              {edit.enabled ? <th className="w-10 px-2" aria-hidden /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-muted-foreground">
                    <EditableDocText path={`${rowsPath}.${rowIndex}.${colIndex}`} value={cell} />
                  </td>
                ))}
                {edit.enabled ? (
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      className="cms-admin-control rounded px-1 text-xs text-destructive hover:bg-destructive/10"
                      aria-label="Sor törlése"
                      onClick={() => removeRow(rowIndex)}
                    >
                      ×
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit.enabled ? (
        <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3">
          <CmsListAddButton label="Sor hozzáadása" onClick={addRow} />
          <CmsListAddButton label="Oszlop hozzáadása" onClick={addColumn} />
        </div>
      ) : null}
    </div>
  )
}

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  const c = content
  const edit = useSurfaceDocEdit()
  const contactEmails = deps?.siteContact?.emails ?? []
  const sectionLayout = c.sectionLayout ?? []

  const sections: Record<WdfHomeSectionId, ReactNode> = {
    hero: (
      <section
        className={cn(
          "relative flex min-h-[min(90svh,720px)] items-end wdf-hero-glow",
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
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div
          className={cn(
            "relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-32 sm:pb-16",
            // Let hero image CMS controls receive hover/clicks under this layer.
            edit.enabled &&
              "pointer-events-none [&_.cms-inline-edit-field]:pointer-events-auto [&_.cms-editable-cta-wrap]:pointer-events-auto"
          )}
        >
          <Reveal mode="mount" variant="fade" delayMs={0}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              <EditableDocText path="hero.tagline" value={c.hero.tagline} />
            </p>
          </Reveal>
          <Reveal mode="mount" variant="up" delayMs={80}>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              <EditableDocText path="hero.title" value={c.hero.title} multiline />
            </h1>
          </Reveal>
          <Reveal mode="mount" variant="up" delayMs={160}>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
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
                className="inline-flex min-h-11 items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              />
              <EditableDocLink
                labelPath="hero.secondaryCtaLabel"
                hrefPath="hero.secondaryCtaHref"
                label={c.hero.secondaryCtaLabel}
                href={c.hero.secondaryCtaHref}
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface/90 px-6 py-2.5 text-sm font-semibold text-foreground backdrop-blur hover:bg-muted"
              />
            </div>
          </Reveal>
        </div>
      </section>
    ),
    festival: (
      <section className="border-y border-border/60 bg-surface py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <Reveal variant="left" className="space-y-4">
            <SectionHeading>
              <EditableDocText path="festival.title" value={c.festival.title} />
            </SectionHeading>
            <p className="text-muted-foreground leading-relaxed">
              <EditableDocText path="festival.body" value={c.festival.body} multiline />
            </p>
            <EditableDocLink
              labelPath="festival.ctaLabel"
              hrefPath="festival.ctaHref"
              label={c.festival.ctaLabel}
              href={c.festival.ctaHref}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            />
          </Reveal>
          <Reveal variant="right">
            <CmsImage
              path="festival.image"
              src={c.festival.image}
              alt={c.festival.title}
              className="aspect-video w-full overflow-hidden rounded-2xl"
              frameClassName="size-full"
              imageClassName="size-full object-cover"
              width={800}
              height={450}
              usageLabel="Fesztivál kép"
            />
          </Reveal>
        </div>
      </section>
    ),
    infoCards: (
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
          {c.infoCards.map((card, index) => (
            <article
              key={index}
              className="wdf-card-lift relative flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              {edit.enabled ? (
                <CmsListItemToolbar
                  onRemove={() =>
                    edit.setPath(
                      "infoCards",
                      c.infoCards.filter((_, i) => i !== index)
                    )
                  }
                />
              ) : null}
              <h3 className="text-xl font-semibold">
                <EditableDocText path={`infoCards.${index}.title`} value={card.title} />
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                <EditableDocText path={`infoCards.${index}.body`} value={card.body} multiline />
              </p>
              <EditableDocLink
                labelPath={`infoCards.${index}.ctaLabel`}
                hrefPath={`infoCards.${index}.ctaHref`}
                label={card.ctaLabel}
                href={card.ctaHref}
                className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline"
              />
            </article>
          ))}
          {edit.enabled ? (
            <CmsListAddButton
              label="Info kártya hozzáadása"
              onClick={() =>
                edit.setPath("infoCards", [
                  ...c.infoCards,
                  {
                    title: "New section",
                    body: "Description",
                    ctaLabel: "Learn more",
                    ctaHref: "/jegyek",
                  },
                ])
              }
            />
          ) : null}
        </div>
      </section>
    ),
    venue: (
      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading className="mb-8">
            <EditableDocText path="venue.heading" value={c.venue.heading} />
          </SectionHeading>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                <EditableDocText path="venue.name" value={c.venue.name} />
              </h3>
              <p className="text-muted-foreground">
                <EditableDocText path="venue.body" value={c.venue.body} multiline />
              </p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-semibold">
                <EditableDocText path="venue.accessHeading" value={c.venue.accessHeading} />
              </h3>
              <p className="text-sm text-muted-foreground">
                <EditableDocText path="venue.accessBody" value={c.venue.accessBody} multiline />
              </p>
              <EditableDocLink
                labelPath="venue.mapLabel"
                hrefPath="venue.mapHref"
                label={c.venue.mapLabel}
                href={c.venue.mapHref}
                className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline"
              />
            </div>
          </div>
        </div>
      </section>
    ),
    schedule: (
      <section className="py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4">
          <SectionHeading>
            <EditableDocText path="schedule.heading" value={c.schedule.heading} />
          </SectionHeading>
          <div className="space-y-3">
            {c.schedule.days.map((day, index) => (
              <div key={index} className="relative">
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
                <ScheduleDay index={index} date={day.date} title={day.title} items={day.items} />
              </div>
            ))}
            {edit.enabled ? (
              <CmsListAddButton
                label="Nap hozzáadása"
                onClick={() =>
                  edit.setPath("schedule.days", [
                    ...c.schedule.days,
                    { date: "New date", title: "Event", items: ["Schedule item"] },
                  ])
                }
              />
            ) : null}
          </div>
        </div>
      </section>
    ),
    fees: (
      <section className="border-y border-border/60 bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4">
          <SectionHeading className="mb-8 text-center">
            <EditableDocText path="fees.heading" value={c.fees.heading} />
          </SectionHeading>
          <ul className="space-y-3">
            {c.fees.items.map((item, index) => (
              <li
                key={index}
                className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-5 py-4"
              >
                {edit.enabled ? (
                  <CmsListItemToolbar
                    onRemove={() =>
                      edit.setPath(
                        "fees.items",
                        c.fees.items.filter((_, i) => i !== index)
                      )
                    }
                  />
                ) : null}
                <span className="font-medium">
                  <EditableDocText path={`fees.items.${index}.label`} value={item.label} />
                </span>
                <div className="flex items-center gap-3">
                  {item.badge ? (
                    <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-foreground">
                      <EditableDocText path={`fees.items.${index}.badge`} value={item.badge} />
                    </span>
                  ) : null}
                  <span className="font-semibold text-primary">
                    <EditableDocText path={`fees.items.${index}.price`} value={item.price} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {edit.enabled ? (
            <div className="mt-4">
              <CmsListAddButton
                label="Díj hozzáadása"
                onClick={() =>
                  edit.setPath("fees.items", [
                    ...c.fees.items,
                    { label: "New fee", price: "€0", badge: "" },
                  ])
                }
              />
            </div>
          ) : null}
          <div className="mt-8 text-center">
            <EditableDocLink
              labelPath="fees.ctaLabel"
              hrefPath="fees.ctaHref"
              label={c.fees.ctaLabel}
              href={c.fees.ctaHref}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground"
            />
          </div>
        </div>
      </section>
    ),
    prizeMoney: (
      <section className="py-16">
        <div className="mx-auto max-w-5xl space-y-8 px-4">
          <div className="text-center">
            <SectionHeading className="mb-3">
              <EditableDocText path="prizeMoney.heading" value={c.prizeMoney.heading} />
            </SectionHeading>
            {c.prizeMoney.intro || edit.enabled ? (
              <p className="mx-auto max-w-2xl text-muted-foreground">
                <EditableDocText path="prizeMoney.intro" value={c.prizeMoney.intro} multiline />
              </p>
            ) : null}
          </div>
          <div className="space-y-6">
            {c.prizeMoney.tables.map((table, index) => (
              <div key={index} className="relative">
                {edit.enabled ? (
                  <CmsListItemToolbar
                    onRemove={() =>
                      edit.setPath(
                        "prizeMoney.tables",
                        c.prizeMoney.tables.filter((_, i) => i !== index)
                      )
                    }
                  />
                ) : null}
                <PrizeMoneyTable
                  tableIndex={index}
                  title={table.title}
                  subtitle={table.subtitle ?? ""}
                  headers={table.headers}
                  rows={table.rows}
                />
              </div>
            ))}
          </div>
          {edit.enabled ? (
            <div className="text-center">
              <CmsListAddButton
                label="Verseny táblázat hozzáadása"
                onClick={() =>
                  edit.setPath("prizeMoney.tables", [
                    ...c.prizeMoney.tables,
                    {
                      title: "New tournament",
                      subtitle: "",
                      headers: ["Place", "Prize"],
                      rows: [["Winner", "€0"]],
                    },
                  ])
                }
              />
            </div>
          ) : null}
        </div>
      </section>
    ),
    sponsors: (
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <SectionHeading className="mb-10">
            <EditableDocText path="sponsors.heading" value={c.sponsors.heading} />
          </SectionHeading>
          {edit.enabled ? (
            <CmsListAddButton
              label="Add sponsor logo"
              className="mb-6"
              onClick={() =>
                edit.setPath("sponsors.logos", [
                  ...c.sponsors.logos,
                  { name: "Sponsor", image: "/placeholder.png" },
                ])
              }
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {c.sponsors.logos.map((logo, index) => (
              <div
                key={index}
                className={
                  edit.enabled
                    ? "relative flex min-w-[10rem] flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-4"
                    : "relative"
                }
              >
                {edit.enabled ? (
                  <CmsListItemToolbar
                    onRemove={() =>
                      edit.setPath(
                        "sponsors.logos",
                        c.sponsors.logos.filter((_, i) => i !== index)
                      )
                    }
                  />
                ) : null}
                {/*
                  Do not use frameClassName/fill here — fill mode without a sized
                  frame collapses the edit/upload controls on tiny logo rows.
                */}
                <CmsImage
                  path={`sponsors.logos.${index}.image`}
                  src={logo.image}
                  alt={logo.name}
                  className="w-full max-w-[160px]"
                  imageClassName="mx-auto h-12 w-auto max-w-[160px] object-contain opacity-80 transition hover:opacity-100"
                  width={160}
                  height={48}
                  usageLabel="Sponsor logo"
                />
                {edit.enabled ? (
                  <p className="w-full text-xs text-muted-foreground">
                    <EditableDocText
                      path={`sponsors.logos.${index}.name`}
                      value={logo.name}
                    />
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    contact: (
      <section className="border-t border-border/60 bg-muted/20 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionHeading>
              <EditableDocText path="contact.heading" value={c.contact.heading} />
            </SectionHeading>
            <p className="text-muted-foreground">
              <EditableDocText path="contact.body" value={c.contact.body} multiline />
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <ContactInquiryForm
              contactEmails={contactEmails}
              nameLabel={c.contact.nameLabel}
              emailLabel={c.contact.emailLabel}
              messageLabel={c.contact.messageLabel}
              sendButtonLabel={c.contact.sendButtonLabel}
            />
          </div>
        </div>
      </section>
    ),
  }

  return (
    <div className="bg-background text-foreground">
      {sectionLayout.map((entry, index) =>
        entry.enabled ? (
          <Reveal
            key={entry.id}
            id={WDF_SECTION_ANCHORS[entry.id]}
            data-wdf-section={entry.id}
            variant="up"
            delayMs={index * 40}
            className={WDF_SECTION_ANCHORS[entry.id] ? "scroll-mt-24" : undefined}
          >
            {sections[entry.id]}
          </Reveal>
        ) : null
      )}
    </div>
  )
}
