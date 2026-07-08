"use client"

import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"

export function Breadcrumb({ block }: { block: HomepageBlock | null }) {
  return (
    <div className="px-4 py-2 border-b border-white/10 text-xs uppercase tracking-widest text-neutral-400">
      {block ? `Főoldal / ${block.type}` : "Főoldal"}
    </div>
  )
}
