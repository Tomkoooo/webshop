"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Check, MapPin, Ticket } from "lucide-react"
import { mediaImageSrc } from "@wse/core/lib/images"
import { StorefrontRichHtml } from "@wse/core/components/common/StorefrontRichHtml"
import { LocaleLink, useLocaleNavigate } from "@wse/core/lib/locale-navigation"
import {
  formatHuf,
  listEvents,
  type TBookPublicEvent,
} from "./tbook-public-api"
import { formatEventSchedule } from "../lib/event-schedule"
import {
  classifyTicketKind,
  filterSorfesztAvailableTickets,
  formatSalesOpensAt,
  getEventSalesState,
  sortPublicTicketEvents,
} from "../lib/event-sales"
import { tbookT } from "../lib/i18n"
import { TBookDayTabs } from "./TBookDayTabs"

export type TBookListVariant = "default" | "wdf" | "sorfeszt"

function descriptionIncludes(raw: string): string[] {
  const stripped = raw.replace(/<[^>]+>/g, "\n")
  return stripped
    .split(/\n|;|•/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 1)
}

type Copy = {
  pageTitle: string
  pageIntro: string
  emptyTitle: string
  emptyBody: string
  bookCta: string
  perPerson: string
  perBooking: string
}

export function TBookEventList({
  apiKey,
  copy,
  initialEvents,
  initialError = null,
  currency: currencyProp = "HUF",
  variant = "default",
  locale,
}: {
  apiKey: string
  copy: Copy
  /** When set, events were loaded on the server — no browser API call needed. */
  initialEvents?: TBookPublicEvent[]
  initialError?: string | null
  currency?: string
  variant?: TBookListVariant
  locale?: string
}) {
  const navigate = useLocaleNavigate()
  const serverProvided = initialEvents !== undefined
  const [events, setEvents] = useState<TBookPublicEvent[]>(initialEvents ?? [])
  const [currency, setCurrency] = useState(currencyProp)
  const [loading, setLoading] = useState(!serverProvided)
  const [error, setError] = useState<string | null>(initialError)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelected = (eventId: string) => {
    setSelectedIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    )
  }

  const continueWithSelection = () => {
    if (selectedIds.length === 0) return
    if (selectedIds.length === 1) {
      navigate(`/foglalas/${selectedIds[0]}`)
      return
    }
    navigate(`/foglalas/${selectedIds[0]}?events=${selectedIds.join(",")}`)
  }

  useEffect(() => {
    if (serverProvided) return
    const normalizedKey = apiKey.trim()
    if (!normalizedKey) {
      setLoading(false)
      setError(tbookT(locale, "apiKeyMissing"))
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await listEvents(normalizedKey)
        if (!cancelled) {
          setEvents(res.events)
          if (res.currency) setCurrency(res.currency)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : tbookT(locale, "eventsLoadError"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiKey, serverProvided, locale])

  const sortedEvents = useMemo(() => {
    const base = variant === "sorfeszt" ? filterSorfesztAvailableTickets(events) : events
    return sortPublicTicketEvents(base)
  }, [events, variant])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label={tbookT(locale, "loadingEvents")}>
        {[1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-destructive">{error}</p>
      </div>
    )
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <Ticket className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">{copy.emptyTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p>
      </div>
    )
  }

  const renderEventCard = (event: TBookPublicEvent) => {
    const feeLabel = event.ticketFeeMode === "per_person" ? copy.perPerson : copy.perBooking
    const isSelected = selectedIds.includes(event.id)
    const salesState = getEventSalesState(event)
    const onSale = salesState === "on_sale"
    const kind = classifyTicketKind(event.name)
    const isHtml = /<[a-z][\s\S]*>/i.test(event.description || "")
    const includes =
      variant === "sorfeszt" && event.description
        ? descriptionIncludes(event.description)
        : []
    const cardClass =
      variant === "wdf"
        ? `wdf-event-card wdf-card-lift flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm ${
            isSelected ? "border-primary ring-2 ring-primary/25" : "border-border"
          }`
        : variant === "sorfeszt"
          ? `sorfeszt-pint sorfeszt-pint--${kind} ${
              onSale ? "" : "sorfeszt-pint--soon"
            } sorfeszt-card-lift ${isSelected ? "ring-2 ring-primary/40" : ""}`
          : `flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-shadow hover:shadow-md ${
              isSelected ? "border-primary ring-2 ring-primary/25" : "border-border"
            }`
    const eventCardBody = (
      <>
        <button
          type="button"
          onClick={() => onSale && toggleSelected(event.id)}
          disabled={!onSale}
          className={`flex w-full items-start gap-3 rounded-lg text-left transition-colors ${
            !onSale ? "cursor-not-allowed opacity-80" : isSelected ? "bg-primary/5" : "hover:bg-muted/40"
          } -m-2 p-2`}
          aria-pressed={isSelected}
          aria-label={
            isSelected
              ? tbookT(locale, "deselectEvent", { name: event.name })
              : tbookT(locale, "selectEventForMulti", { name: event.name })
          }
        >
          <span
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background"
            }`}
            aria-hidden
          >
            {isSelected ? <Check className="size-3.5" strokeWidth={3} /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-xl font-semibold ${variant === "sorfeszt" ? "text-primary" : ""}`}>
              {event.name}
            </span>
            <span
              className={`mt-0.5 block text-xs ${
                variant === "sorfeszt" ? "text-primary/80" : "text-muted-foreground"
              }`}
            >
              {isSelected ? tbookT(locale, "selectedForBooking") : tbookT(locale, "tapToInclude")}
            </span>
          </span>
        </button>
        {includes.length > 0 ? (
          <ul className={`sorfeszt-pint-features space-y-1.5 text-sm ${variant === "sorfeszt" ? "text-primary" : "text-foreground"}`}>
            {includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : event.description && variant !== "sorfeszt" ? (
          isHtml ? (
            <StorefrontRichHtml
              html={event.description}
              className="text-sm [&_p]:my-1 [&_ul]:my-1 text-foreground"
            />
          ) : (
            <p className="line-clamp-4 text-sm text-foreground/80">{event.description}</p>
          )
        ) : null}
        <div
          className={`flex flex-wrap gap-3 text-xs ${
            variant === "sorfeszt" ? "text-primary" : "text-foreground/70"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" aria-hidden />
            {formatEventSchedule(
              event.startDate,
              event.endDate,
              event.startTime,
              event.endTime,
              locale
            )}
          </span>
          {event.location.address ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {event.location.address}
            </span>
          ) : null}
        </div>
        {salesState === "upcoming" && event.salesOpensAt ? (
          <p className="text-xs font-semibold text-primary">
            {tbookT(locale, "salesOpensAt", {
              when: formatSalesOpensAt(event.salesOpensAt, locale) ?? "",
            })}
          </p>
        ) : null}
        <p className="text-sm font-semibold text-primary">
          {formatHuf(event.ticketFeeHuf, event.currency ?? currency)} {feeLabel}
        </p>
        {onSale ? (
          <LocaleLink
            href={`/foglalas/${event.id}`}
            className={
              variant === "wdf"
                ? "wdf-cta-pulse mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
                : variant === "sorfeszt"
                  ? "mt-auto inline-flex min-h-11 items-center justify-center bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  : "mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
            }
          >
            {tbookT(locale, "bookThisEventOnly")}
          </LocaleLink>
        ) : (
          <span className="mt-auto inline-flex min-h-11 items-center justify-center border border-border bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground">
            {salesState === "closed" ? tbookT(locale, "salesClosed") : tbookT(locale, "salesUpcoming")}
          </span>
        )}
      </>
    )
    return (
      <article key={event.id} className={cardClass}>
        {variant === "sorfeszt" ? (
          <div className="sorfeszt-pint-body">
            <div className="sorfeszt-pint-glass">
              <div className="sorfeszt-pint-foam" aria-hidden />
              <div className="sorfeszt-pint-label flex flex-1 flex-col gap-3">{eventCardBody}</div>
            </div>
            <span className="sorfeszt-pint-handle" aria-hidden />
          </div>
        ) : event.heroImage ? (
          <div className="relative h-40 overflow-hidden bg-muted">
            {/* Prefer <img> over CSS background so SVG covers stay vector-sharp. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaImageSrc(event.heroImage)}
              alt=""
              className={
                /\.svg($|\?)/i.test(event.heroImage) || event.heroImage.includes("image/svg")
                  ? "absolute inset-0 size-full object-contain p-3"
                  : "absolute inset-0 size-full object-cover"
              }
            />
            <span className="sr-only">{event.name}</span>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center bg-muted">
            <Ticket className="size-10 text-muted-foreground" aria-hidden />
          </div>
        )}
        {variant === "sorfeszt" ? null : (
          <div className="flex flex-1 flex-col gap-3 p-5">{eventCardBody}</div>
        )}
      </article>
    )
  }

  const eventGrid = (dayEvents: TBookPublicEvent[]) => (
    <div className={variant === "sorfeszt" ? "sorfeszt-pint-grid" : "grid gap-5 sm:grid-cols-2"}>
      {dayEvents.map((event) => renderEventCard(event))}
    </div>
  )

  return (
    <div className={`space-y-6 ${selectedIds.length > 0 ? "pb-28" : ""}`}>
      <header className={variant === "wdf" || variant === "sorfeszt" ? "wdf-tbook-header max-w-2xl" : "max-w-2xl"}>
        <h1 className="text-3xl font-bold tracking-tight">{copy.pageTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.pageIntro}</p>
        {sortedEvents.length > 1 ? (
          <p className="mt-4 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {tbookT(locale, "multiEventTip")}
          </p>
        ) : null}
      </header>

      {variant === "sorfeszt" ? (
        <TBookDayTabs
          events={sortedEvents}
          locale={locale ?? "hu"}
          listClassName="sorfeszt-day-tabs"
          renderDay={(dayEvents) => eventGrid(dayEvents)}
        />
      ) : (
        eventGrid(sortedEvents)
      )}

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-4 shadow-lg backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {tbookT(locale, "eventsSelectedCount", {
                  count: selectedIds.length,
                  plural: selectedIds.length === 1 ? "" : "s",
                })}
              </p>
              <p className="text-xs text-muted-foreground">{tbookT(locale, "continueMultiHint")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
                onClick={() => setSelectedIds([])}
              >
                {tbookT(locale, "clear")}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                onClick={continueWithSelection}
              >
                {tbookT(locale, "continueWithSelected")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
