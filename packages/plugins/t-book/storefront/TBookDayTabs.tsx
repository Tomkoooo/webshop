"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wse/core/components/ui/tabs"
import { groupByEventDate, formatDateGroupHeading } from "../lib/event-schedule"
import { cn } from "@wse/core/lib/utils"

/**
 * Groups events by calendar day and renders a tab selector (hidden when only one day).
 */
export function TBookDayTabs<T extends { startDate: string | Date }>({
  events,
  locale,
  className,
  listClassName,
  renderDay,
}: {
  events: T[]
  locale?: string
  className?: string
  listClassName?: string
  renderDay: (items: T[], dateKey: string) => ReactNode
}) {
  const groups = useMemo(() => groupByEventDate(events, (e) => e.startDate), [events])
  const defaultKey = groups[0]?.dateKey ?? ""
  const [active, setActive] = useState(defaultKey)

  if (groups.length === 0) return null

  if (groups.length === 1) {
    return <div className={className}>{renderDay(groups[0].items, groups[0].dateKey)}</div>
  }

  const value = groups.some((g) => g.dateKey === active) ? active : defaultKey

  return (
    <Tabs value={value} onValueChange={setActive} className={cn("gap-5", className)}>
      <TabsList
        className={cn(
          "flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit",
          listClassName
        )}
      >
        {groups.map(({ dateKey, items }) => (
          <TabsTrigger key={dateKey} value={dateKey} className="flex-none px-4 py-2">
            {formatDateGroupHeading(dateKey, locale)}
            <span className="ml-1.5 text-xs opacity-70">({items.length})</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map(({ dateKey, items }) => (
        <TabsContent key={dateKey} value={dateKey} className="mt-0">
          {renderDay(items, dateKey)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
