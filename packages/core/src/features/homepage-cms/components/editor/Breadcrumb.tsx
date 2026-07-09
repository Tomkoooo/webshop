"use client"

import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"

export function Breadcrumb({ block }: { block: HomepageBlock | null }) {
  return (
    <div className="border-b border-border/40 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
      {block ? (
        <>
          Főoldal <span className="text-foreground/60">/</span>{" "}
          <span className="font-medium text-foreground">{block.type}</span>
        </>
      ) : (
        "Főoldal"
      )}
    </div>
  )
}
