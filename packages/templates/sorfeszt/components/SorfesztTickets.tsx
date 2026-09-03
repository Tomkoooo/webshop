"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { LocaleLink } from "@wse/core/lib/locale-navigation"
import { StorefrontRichHtml } from "@wse/core/components/common/StorefrontRichHtml"
import { formatHuf, listEvents, type TBookPublicEvent } from "@wse/plugin-t-book/storefront/tbook-public-api"
import { formatEventSchedule } from "@wse/plugin-t-book/lib/event-schedule"
import {
  classifyTicketKind,
  formatSalesOpensAt,
  getEventSalesState,
  sortPublicTicketEvents,
} from "@wse/plugin-t-book/lib/event-sales"
import { cn } from "@wse/core/lib/utils"

function SorfesztBeerMug({
  kind,
  onSale,
  className,
  children,
}: {
  kind: "standard" | "vip" | "table"
  onSale: boolean
  className?: string
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
          <div className="sorfeszt-pint-foam" aria-hidden />
          <div className="sorfeszt-pint-label flex flex-1 flex-col">{children}</div>
        </div>
        <div className="sorfeszt-pint-foot" aria-hidden />
      </div>
      <span className="sorfeszt-pint-handle" aria-hidden />
    </article>
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

  const sorted = useMemo(() => sortPublicTicketEvents(events ?? []), [events])

  if (events === null) {
    return (
      <div className="sorfeszt-pint-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[32rem] animate-pulse bg-muted" />
        ))}
      </div>
    )
  }

  if (sorted.length === 0) return <>{fallback}</>

  return (
    <div className="sorfeszt-pint-grid">
      {sorted.map((event) => {
        const kind = classifyTicketKind(event.name)
        const sales = getEventSalesState(event)
        const onSale = sales === "on_sale"
        const isHtml = /<[a-z][\s\S]*>/i.test(event.description || "")
        return (
          <SorfesztBeerMug key={event.id} kind={kind} onSale={onSale}>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {kind === "vip" ? "VIP" : kind === "table" ? "Asztal" : "Napijegy"}
              {sales === "upcoming" ? " · Hamarosan" : sales === "closed" ? " · Lezárva" : " · Kapható"}
            </p>
            <h3 className="mt-1 text-lg font-bold text-primary">{event.name}</h3>
            <p className="mt-1 font-heading text-2xl font-bold text-primary">
              {formatHuf(event.ticketFeeHuf, event.currency ?? "HUF")}
            </p>
            <p className="mt-2 text-sm text-primary">
              {formatEventSchedule(event.startDate, event.endDate, event.startTime, event.endTime, "hu")}
            </p>
            {sales === "upcoming" && event.salesOpensAt ? (
              <p className="mt-1 text-sm font-semibold text-primary">
                Vásárolható: {formatSalesOpensAt(event.salesOpensAt, "hu")}
              </p>
            ) : null}
            {event.description ? (
              isHtml ? (
                <StorefrontRichHtml html={event.description} className="mt-3 text-sm text-primary [&_p]:my-1" />
              ) : (
                <p className="mt-3 text-sm text-primary/85">{event.description.replace(/<[^>]+>/g, " ")}</p>
              )
            ) : null}
            <div className="mt-auto pt-4">
              {onSale ? (
                <LocaleLink
                  href={`/foglalas/${event.id}`}
                  className="inline-flex min-h-11 w-full items-center justify-center bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Jegyvásárlás
                </LocaleLink>
              ) : (
                <span className="inline-flex min-h-11 w-full items-center justify-center border border-primary/20 bg-muted px-4 text-sm font-semibold text-muted-foreground">
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

export function SorfesztCmsBeerCard({
  kind,
  onSale,
  children,
}: {
  kind: "standard" | "vip" | "table"
  onSale: boolean
  children: ReactNode
}) {
  return (
    <SorfesztBeerMug kind={kind} onSale={onSale}>
      {children}
    </SorfesztBeerMug>
  )
}

export function ticketKindFromName(name: string) {
  return classifyTicketKind(name)
}
