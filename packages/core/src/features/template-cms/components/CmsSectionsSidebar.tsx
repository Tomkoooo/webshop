"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { CmsStructureSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"
import { Switch } from "@wse/core/components/ui/switch"
import { moveArrayItem } from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"

const iconBtn =
  "rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"

export type SectionLayoutEntry<T extends string = string> = {
  id: T
  enabled: boolean
}

/**
 * Toggle visibility and reorder homepage sections.
 */
export function CmsSectionsSidebar<T extends string>({
  title = "Főoldal szekciók",
  layout,
  labels,
  onChange,
}: {
  title?: string
  layout: SectionLayoutEntry<T>[]
  labels: Record<T, string>
  onChange: (next: SectionLayoutEntry<T>[]) => void
}) {
  const setEnabled = (id: T, enabled: boolean) => {
    onChange(layout.map((row) => (row.id === id ? { ...row, enabled } : row)))
  }

  const move = (index: number, offset: -1 | 1) => {
    onChange(moveArrayItem(layout, index, offset))
  }

  return (
    <CmsStructureSidebar title={title}>
      <p className="text-xs text-muted-foreground">
        Kapcsold ki a nem kívánt szekciókat, és állítsd a megjelenítési sorrendet.
      </p>
      <div className="space-y-1.5">
        {layout.map((entry, index) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2"
          >
            <Switch
              checked={entry.enabled}
              onCheckedChange={(checked) => setEnabled(entry.id, checked)}
              aria-label={`${labels[entry.id]} megjelenítése`}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">
              {labels[entry.id]}
            </span>
            <button
              type="button"
              title="Fel"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              className={iconBtn}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Le"
              disabled={index === layout.length - 1}
              onClick={() => move(index, 1)}
              className={iconBtn}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </CmsStructureSidebar>
  )
}
