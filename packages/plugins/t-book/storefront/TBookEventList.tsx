"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Calendar, MapPin, Ticket } from "lucide-react"
import {
  formatHuf,
  listEvents,
  type TBookPublicEvent,
} from "./tbook-public-api"
import { formatEventSchedule } from "../lib/event-schedule"

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
}: {
  apiKey: string
  copy: Copy
  /** When set, events were loaded on the server — no browser API call needed. */
  initialEvents?: TBookPublicEvent[]
  initialError?: string | null
  currency?: string
}) {
  const serverProvided = initialEvents !== undefined
  const [events, setEvents] = useState<TBookPublicEvent[]>(initialEvents ?? [])
  const [currency, setCurrency] = useState(currencyProp)
  const [loading, setLoading] = useState(!serverProvided)
  const [error, setError] = useState<string | null>(initialError)

  useEffect(() => {
    if (serverProvided) return
    const normalizedKey = apiKey.trim()
    if (!normalizedKey) {
      setLoading(false)
      setError("A tBook API kulcs nincs beállítva. Add meg a CMS-ben a főoldal integrációs beállításainál.")
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Nem sikerült betölteni az eseményeket.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiKey, serverProvided])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Események betöltése">
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

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <Ticket className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">{copy.emptyTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">{copy.pageTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.pageIntro}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {events.map((event) => {
          const feeLabel =
            event.ticketFeeMode === "per_person" ? copy.perPerson : copy.perBooking
          return (
            <article
              key={event.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
            >
              {event.heroImage ? (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${event.heroImage})` }}
                  role="img"
                  aria-label={event.name}
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-muted">
                  <Ticket className="size-10 text-muted-foreground" aria-hidden />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h2 className="text-xl font-semibold">{event.name}</h2>
                {event.description ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5" aria-hidden />
                    {formatEventSchedule(
                      event.startDate,
                      event.endDate,
                      event.startTime,
                      event.endTime
                    )}
                  </span>
                  {event.location.address ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden />
                      {event.location.address}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-primary">
                  {formatHuf(event.ticketFeeHuf, event.currency ?? currency)} {feeLabel}
                </p>
                <Link
                  href={`/foglalas/${event.id}`}
                  className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {copy.bookCta}
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
