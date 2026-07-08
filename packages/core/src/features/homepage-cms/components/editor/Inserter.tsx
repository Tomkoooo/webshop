"use client"

import { getAllDefinitions } from "@wse/core/features/homepage-cms/registry/block-registry"
import type { HomepageBlockType } from "@wse/core/features/homepage-cms/types/block-types"

export function Inserter({
  onInsert,
  allowedTypes,
}: {
  onInsert: (type: HomepageBlockType) => void
  /** When set, only these block kinds can be inserted (template `pages.home.allowedBlocks`). */
  allowedTypes?: HomepageBlockType[]
}) {
  const allow = allowedTypes?.length ? new Set(allowedTypes) : null
  const definitions = getAllDefinitions().filter((d) => (allow ? allow.has(d.type) : true))
  return (
    <div className="border border-dashed border-white/20 p-3 bg-black/50">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Blokk könyvtár (sablon szerint)</p>
      {definitions.length === 0 ? (
        <p className="text-[11px] text-neutral-500">Nincs beszúrható blokk — mind szerepel az oldalon.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {definitions.map((definition) => (
            <button
              key={definition.type}
              type="button"
              onClick={() => onInsert(definition.type)}
              className="px-2 h-7 border border-white/20 text-[10px] uppercase text-white hover:border-primary-foreground/40"
            >
              {definition.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
