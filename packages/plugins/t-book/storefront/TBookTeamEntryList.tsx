import { cn } from "@wse/core/lib/utils"
import type { TBookPublicEntryListTeam } from "../lib/fetch-public-storefront"

export type TBookTeamEntryListCopy = {
  heading: string
  empty: string
}

const DEFAULT_COPY: TBookTeamEntryListCopy = {
  heading: "Nevezett csapatok",
  empty: "Még nincs nevezett csapat.",
}

/**
 * Read-only entry list for team events with no tDarts tournament link (large
 * rosters — see `TBookEventService.getPublicEntryList`). No contact info,
 * team/member display names only.
 */
export function TBookTeamEntryList({
  teams,
  copy,
}: {
  teams: TBookPublicEntryListTeam[]
  copy?: Partial<TBookTeamEntryListCopy>
}) {
  const c = { ...DEFAULT_COPY, ...copy }
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{c.heading}</h2>
      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">{c.empty}</p>
      ) : (
        <div className={cn("grid gap-3", "sm:grid-cols-2")}>
          {teams.map((team, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-background/50 p-3">
              <p className="text-sm font-semibold text-foreground">{team.label}</p>
              {team.members.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5">
                  {team.members.map((member, mi) => (
                    <li key={mi} className="text-xs text-muted-foreground">
                      {member}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
