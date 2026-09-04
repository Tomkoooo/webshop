"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { LocaleLink } from "@wse/core/lib/locale-navigation"
import { formatHuf, listEvents, type TBookPublicEvent } from "@wse/plugin-t-book/storefront/tbook-public-api"
import { formatEventSchedule } from "@wse/plugin-t-book/lib/event-schedule"
import {
  classifyTicketKind,
  filterSorfesztAvailableTickets,
  formatSalesOpensAt,
  getEventSalesState,
  sortPublicTicketEvents,
} from "@wse/plugin-t-book/lib/event-sales"
import { TBookDayTabs } from "@wse/plugin-t-book/storefront/TBookDayTabs"
import { cn } from "@wse/core/lib/utils"

function SorfesztBeerMug({
  kind,
  onSale,
  className,
  foamSlot,
  children,
}: {
  kind: "standard" | "vip" | "table"
  onSale: boolean
  className?: string
  /** Content rendered inside the foam head (badge + title) */
  foamSlot?: ReactNode
  children: ReactNode
}) {
  return (
    <article
      className={cn(
        "sorfeszt-pint sorfeszt-card-lift",
        `sorfeszt-pint--${kind}`,
        !onSale && "sorfeszt-pint--soon",
        className
      )}
    >
      <div className="sorfeszt-pint-body">
        <div className="sorfeszt-pint-glass">
          <div className="sorfeszt-pint-foam">
            {foamSlot}
          </div>
          <div className="sorfeszt-pint-label flex flex-1 flex-col">{children}</div>
        </div>
        <span className="sorfeszt-pint-handle" aria-hidden />
      </div>
    </article>
  )
}

function descriptionIncludes(raw: string): string[] {
  const stripped = raw.replace(/<[^>]+>/g, "\n")
  return stripped
    .split(/\n|;|•/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 1)
}

function SorfesztTicketGrid({ events }: { events: TBookPublicEvent[] }) {
  return (
    <div className="sorfeszt-pint-grid">
      {events.map((event) => {
        const kind = classifyTicketKind(event.name)
        const sales = getEventSalesState(event)
        const onSale = sales === "on_sale"
        const includes = event.description ? descriptionIncludes(event.description) : []
        return (
          <SorfesztBeerMug
            key={event.id}
            kind={kind}
            onSale={onSale}
            foamSlot={
              <>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a6331" }}>
                  {kind === "vip" ? "VIP" : kind === "table" ? "Asztal" : "Napijegy"}
                  {sales === "upcoming" ? " · Hamarosan" : sales === "closed" ? " · Lezárva" : " · Kapható"}
                </p>
                <h3 className="mt-1 text-lg font-bold text-primary leading-tight">{event.name}</h3>
              </>
            }
          >
            <p className="font-heading text-3xl font-black text-primary">
              {formatHuf(event.ticketFeeHuf, event.currency ?? "HUF")}
            </p>
            <p className="mt-2 text-sm font-semibold text-primary border-b pb-3 mb-3" style={{ borderColor: "#c09138" }}>
              {formatEventSchedule(event.startDate, event.endDate, event.startTime, event.endTime, "hu")}
            </p>
            {sales === "upcoming" && event.salesOpensAt ? (
              <p className="mb-3 text-sm font-semibold text-primary">
                Vásárolható: {formatSalesOpensAt(event.salesOpensAt, "hu")}
              </p>
            ) : null}
            {includes.length > 0 ? (
              <ul className="sorfeszt-pint-features flex-1">
                {includes.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-auto pt-4">
              {onSale ? (
                <LocaleLink
                  href={`/foglalas/${event.id}`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Jegyvásárlás
                </LocaleLink>
              ) : (
                <span className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary/20 bg-muted px-4 text-sm font-semibold text-muted-foreground">
                  Hamarosan
                </span>
              )}
            </div>
          </SorfesztBeerMug>
        )
      })}
    </div>
  )
}

export function SorfesztLiveTickets({
  apiKey,
  fallback,
}: {
  apiKey: string
  fallback: ReactNode
}) {
  const [events, setEvents] = useState<TBookPublicEvent[] | null>(null)

  useEffect(() => {
    const key = apiKey.trim()
    if (!key) {
      setEvents([])
      return
    }
    let cancelled = false
    void listEvents(key)
      .then((res) => {
        if (!cancelled) setEvents(res.events)
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
    return () => {
      cancelled = true
    }
  }, [apiKey])

  const available = useMemo(
    () => sortPublicTicketEvents(filterSorfesztAvailableTickets(events ?? [])),
    [events]
  )

  if (events === null) {
    return (
      <div className="sorfeszt-pint-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[32rem] animate-pulse bg-muted" />
        ))}
      </div>
    )
  }

  if (available.length === 0) return <>{fallback}</>

  return (
    <TBookDayTabs
      events={available}
      locale="hu"
      listClassName="sorfeszt-day-tabs"
      renderDay={(dayEvents) => <SorfesztTicketGrid events={dayEvents} />}
    />
  )
}

export function SorfesztCmsBeerCard({
  kind,
  onSale,
  foamSlot,
  children,
}: {
  kind: "standard" | "vip" | "table"
  onSale: boolean
  foamSlot?: ReactNode
  children: ReactNode
}) {
  return (
    <SorfesztBeerMug kind={kind} onSale={onSale} foamSlot={foamSlot}>
      {children}
    </SorfesztBeerMug>
  )
}

export function ticketKindFromName(name: string) {
  return classifyTicketKind(name)
}
