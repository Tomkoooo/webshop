import { Trophy } from "lucide-react"
import { groupByEventDate, formatDateGroupHeading } from "../lib/event-schedule"
import { TBookTournamentCard, type TBookTournamentCardCopy } from "./TBookTournamentCard"
import type { TBookPublicEvent } from "./tbook-public-api"
import type { TDartsTournamentOverview } from "../lib/tdarts-embed-client"

export type TBookTournamentListCopy = TBookTournamentCardCopy & {
  pageTitle: string
  pageIntro: string
  emptyTitle: string
  emptyBody: string
}

export function TBookTournamentList({
  events,
  overviews,
  copy,
  locale,
  currency,
}: {
  events: TBookPublicEvent[]
  /** Resolved tDarts overview per event id, for events with `event.tdarts` set. */
  overviews: Record<string, TDartsTournamentOverview | null>
  copy: TBookTournamentListCopy
  locale?: string
  currency: string
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <Trophy className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">{copy.emptyTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p>
      </div>
    )
  }

  const groups = groupByEventDate(events, (e) => e.startDate)

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">{copy.pageTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.pageIntro}</p>
      </header>

      <div className="space-y-10">
        {groups.map(({ dateKey, items }) => (
          <section key={dateKey} className="space-y-3">
            <h2 className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-2 text-sm font-semibold text-foreground backdrop-blur-sm">
              {formatDateGroupHeading(dateKey, locale)}
            </h2>
            <div className="space-y-3">
              {items.map((event) => (
                <TBookTournamentCard
                  key={event.id}
                  event={event}
                  overview={event.tdarts ? overviews[event.id] : undefined}
                  copy={copy}
                  locale={locale}
                  currency={currency}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
