import { Calendar, Coins, MapPin, Trophy, Users } from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import { mediaImageSrc } from "@wse/core/lib/images"
import { LocaleLink } from "@wse/core/lib/locale-navigation"
import { formatHuf, type TBookPublicEvent } from "./tbook-public-api"
import { formatEventDateTime } from "../lib/event-schedule"
import { getEventSalesState } from "../lib/event-sales"
import type { TDartsTournamentOverview } from "../lib/tdarts-embed-client"
import {
  TDARTS_BADGE_TONE_CLASSES,
  TDARTS_STATUS_TONE_CLASSES,
  tdartsFormatLabel,
  tdartsParticipationModeInfo,
  tdartsStatusInfo,
} from "../lib/tdarts-format-labels"

export type TBookTournamentCardCopy = {
  buyTickets: string
  viewTournament: string
  entryListOnly: string
  salesClosed: string
  salesUpcoming: string
  playersLabel: string
  freeEntry: string
}

export function TBookTournamentCard({
  event,
  overview,
  copy,
  locale,
  currency,
}: {
  event: TBookPublicEvent
  /** Resolved tDarts overview for `event.tdarts`-linked events; null while unresolved/failed, undefined when not tDarts-linked. */
  overview?: TDartsTournamentOverview | null
  copy: TBookTournamentCardCopy
  locale?: string
  currency: string
}) {
  const salesState = getEventSalesState(event)
  const onSale = salesState === "on_sale"
  const formatLabel = overview ? tdartsFormatLabel(overview.format, locale) : null
  const participationInfo = overview ? tdartsParticipationModeInfo(overview.participationMode, locale) : null
  const statusInfo = overview ? tdartsStatusInfo(overview.status, locale) : null
  const detailHref = `/verseny/${event.id}`

  return (
    <article className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-stretch">
      <LocaleLink
        href={detailHref}
        className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-auto sm:w-40"
      >
        {event.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaImageSrc(event.heroImage)} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Trophy className="size-10 text-muted-foreground" aria-hidden />
          </div>
        )}
      </LocaleLink>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <LocaleLink href={detailHref} className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-foreground hover:underline">{event.name}</h3>
        </LocaleLink>

        <div className="flex flex-wrap items-center gap-1.5">
          {statusInfo ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                TDARTS_STATUS_TONE_CLASSES[statusInfo.tone]
              )}
            >
              {statusInfo.label}
            </span>
          ) : null}
          {formatLabel ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                TDARTS_BADGE_TONE_CLASSES.primary
              )}
            >
              {formatLabel}
            </span>
          ) : null}
          {participationInfo ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                TDARTS_BADGE_TONE_CLASSES[participationInfo.tone]
              )}
            >
              {participationInfo.label}
            </span>
          ) : null}
          {!event.tdarts && event.publicEntryList ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                TDARTS_BADGE_TONE_CLASSES.muted
              )}
            >
              {copy.entryListOnly}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" aria-hidden />
            {formatEventDateTime(event.startDate, event.startTime, locale)}
          </span>
          {event.location?.address ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {event.location.address}
            </span>
          ) : null}
          {overview ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden />
              {overview.playerCount}/{overview.maxPlayers} {copy.playersLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <Coins className="size-3.5" aria-hidden />
            {event.ticketFeeHuf > 0 ? formatHuf(event.ticketFeeHuf, event.currency ?? currency) : copy.freeEntry}
          </p>
          <div className="flex flex-wrap gap-2">
            <LocaleLink
              href={detailHref}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:border-primary/40"
            >
              {copy.viewTournament}
            </LocaleLink>
            {onSale ? (
              <LocaleLink
                href={`/foglalas/${event.id}`}
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {copy.buyTickets}
              </LocaleLink>
            ) : (
              <span className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-muted px-4 text-sm font-medium text-muted-foreground">
                {salesState === "closed" ? copy.salesClosed : copy.salesUpcoming}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
