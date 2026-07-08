"use client"

import type { RichTextBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableRichText } from "@wse/core/features/homepage-cms/components/primitives/EditableRichText"

type Props = {
  block: RichTextBlock
  onPatch: (field: keyof RichTextBlock["data"], value: unknown) => void
}

export function RichTextBlockEditor({ block, onPatch }: Props) {
  return (
    <section className="py-20 border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading value={block.data.title} onChange={(value) => onPatch("title", value)} editMode className="text-3xl text-white font-black" />
        <EditableRichText html={block.data.html} onChange={(value) => onPatch("html", value)} editMode />
      </div>
    </section>
  )
}
