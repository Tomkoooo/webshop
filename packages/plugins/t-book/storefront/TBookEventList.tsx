"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Calendar, Check, MapPin, Ticket } from "lucide-react"
import { mediaImageSrc } from "@wse/core/lib/images"
import {
  formatHuf,
  listEvents,
  type TBookPublicEvent,
} from "./tbook-public-api"
import { formatEventSchedule } from "../lib/event-schedule"

export type TBookListVariant = "default" | "wdf"

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
}: {
  apiKey: string
  copy: Copy
  /** When set, events were loaded on the server — no browser API call needed. */
  initialEvents?: TBookPublicEvent[]
  initialError?: string | null
  currency?: string
  variant?: TBookListVariant
}) {
  const router = useRouter()
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
      router.push(`/foglalas/${selectedIds[0]}`)
      return
    }
    router.push(`/foglalas/${selectedIds[0]}?events=${selectedIds.join(",")}`)
  }

  useEffect(() => {
    if (serverProvided) return
    const normalizedKey = apiKey.trim()
    if (!normalizedKey) {
      setLoading(false)
      setError("The tBook API key is not configured. Add it in the CMS home integration settings.")
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load events.")
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
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading events">
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
    <div className={`space-y-6 ${selectedIds.length > 0 ? "pb-28" : ""}`}>
      <header className={variant === "wdf" ? "wdf-tbook-header max-w-2xl" : "max-w-2xl"}>
        <h1 className="text-3xl font-bold tracking-tight">{copy.pageTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.pageIntro}</p>
        {events.length > 1 ? (
          <p className="mt-4 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <strong className="font-semibold">Tip:</strong> tick one or more events below, then continue
            once to register for all of them together — or use <em>Book this event</em> for a single
            entry.
          </p>
        ) : null}
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {events.map((event) => {
          const feeLabel =
            event.ticketFeeMode === "per_person" ? copy.perPerson : copy.perBooking
          const isSelected = selectedIds.includes(event.id)
          return (
            <article
              key={event.id}
              className={
                variant === "wdf"
                  ? `wdf-event-card wdf-card-lift flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm ${
                      isSelected ? "border-primary ring-2 ring-primary/25" : "border-border"
                    }`
                  : `flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-shadow hover:shadow-md ${
                      isSelected ? "border-primary ring-2 ring-primary/25" : "border-border"
                    }`
              }
            >
              {event.heroImage ? (
                <div className="relative h-40 overflow-hidden bg-muted">
                  {/* Prefer <img> over CSS background so SVG covers stay vector-sharp. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaImageSrc(event.heroImage)}
                    alt=""
                    className={
                      /\.svg($|\?)/i.test(event.heroImage) ||
                      event.heroImage.includes("image/svg")
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
              <div className="flex flex-1 flex-col gap-3 p-5">
                <button
                  type="button"
                  onClick={() => toggleSelected(event.id)}
                  className={`flex w-full items-start gap-3 rounded-lg text-left transition-colors ${
                    isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                  } p-2 -m-2`}
                  aria-pressed={isSelected}
                  aria-label={
                    isSelected ? `Deselect ${event.name}` : `Select ${event.name} for multi-event booking`
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
                    <span className="block text-xl font-semibold">{event.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {isSelected ? "Selected for booking" : "Tap to include in a multi-event booking"}
                    </span>
                  </span>
                </button>
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
                  className={
                    variant === "wdf"
                      ? "wdf-cta-pulse mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
                      : "mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
                  }
                >
                  Book this event only
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-4 shadow-lg backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedIds.length} event{selectedIds.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Continue to enter players and choose hotel stays for all selected events.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                onClick={continueWithSelection}
              >
                Continue with selected
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
