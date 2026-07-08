"use client"

import type { DividerBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"

type Props = {
  block: DividerBlock
  onPatch: (field: keyof DividerBlock["data"], value: unknown) => void
}

export function DividerBlockEditor({ block, onPatch }: Props) {
  return (
    <section className="py-8 border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 space-y-2">
        <div className="h-px bg-white/10" />
        <EditableText value={block.data.label} onChange={(value) => onPatch("label", value)} editMode placeholder="Divider label (optional)" className="text-xs text-neutral-400" />
      </div>
    </section>
  )
}
