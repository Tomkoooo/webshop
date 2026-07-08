"use client"

import type { CtaBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"
import { EditableLink } from "@wse/core/features/homepage-cms/components/primitives/EditableLink"

type Props = {
  block: CtaBlock
  onPatch: (field: keyof CtaBlock["data"], value: unknown) => void
}

export function CtaBlockEditor({ block, onPatch }: Props) {
  return (
    <section className="py-20 border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 text-center space-y-4">
        <EditableHeading value={block.data.title} onChange={(value) => onPatch("title", value)} editMode className="text-3xl text-white font-black" />
        <EditableText value={block.data.description} onChange={(value) => onPatch("description", value)} editMode className="text-neutral-400" />
        <div className="grid md:grid-cols-2 gap-3">
          <EditableLink label={block.data.primaryLabel} href={block.data.primaryHref} onLabelChange={(value) => onPatch("primaryLabel", value)} onHrefChange={(value) => onPatch("primaryHref", value)} editMode />
          <EditableLink label={block.data.secondaryLabel} href={block.data.secondaryHref} onLabelChange={(value) => onPatch("secondaryLabel", value)} onHrefChange={(value) => onPatch("secondaryHref", value)} editMode />
        </div>
      </div>
    </section>
  )
}
