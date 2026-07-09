"use client"

import { Button } from "@wse/core/components/ui/button"
import { getAllDefinitions } from "@wse/core/features/homepage-cms/registry/block-registry"
import type { HomepageBlockType } from "@wse/core/features/homepage-cms/types/block-types"

export function Inserter({
  onInsert,
  allowedTypes,
}: {
  onInsert: (type: HomepageBlockType) => void
  allowedTypes?: HomepageBlockType[]
}) {
  const allow = allowedTypes?.length ? new Set(allowedTypes) : null
  const definitions = getAllDefinitions().filter((d) => (allow ? allow.has(d.type) : true))

  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium text-foreground">Blokk könyvtár (sablon szerint)</p>
      {definitions.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nincs beszúrható blokk — mind szerepel az oldalon.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {definitions.map((definition) => (
            <Button
              key={definition.type}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onInsert(definition.type)}
            >
              {definition.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
