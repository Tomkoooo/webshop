"use client"

import type { ProductGridBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"

type Props = {
  block: ProductGridBlock
  onPatch: (field: keyof ProductGridBlock["data"], value: unknown) => void
}

export function ProductGridBlockEditor({ block, onPatch }: Props) {
  return (
    <section className="py-16 border-b border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading value={block.data.title} onChange={(value) => onPatch("title", value)} editMode className="text-3xl text-white font-black" />
        <EditableText value={block.data.description} onChange={(value) => onPatch("description", value)} editMode className="text-neutral-400" />
        <EditableHeading value={block.data.categoriesTitle} onChange={(value) => onPatch("categoriesTitle", value)} editMode className="text-2xl text-white font-black" />
        <EditableText value={block.data.categoriesDescription} onChange={(value) => onPatch("categoriesDescription", value)} editMode className="text-neutral-400" />
      </div>
    </section>
  )
}
