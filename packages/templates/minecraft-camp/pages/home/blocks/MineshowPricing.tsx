"use client"

import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"

const BLOCK_ID = "pricing-info"

type Props = {
  title: string
  body: string
}

export function MineshowPricing({ title, body }: Props) {
  const cms = useCmsEdit()

  return (
    <section className="bg-[#b8d88a] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-minecraft text-center text-sm md:text-base text-[#2d2817] mb-6">
          <EditableTextInline
            blockType="about"
            blockId={BLOCK_ID}
            field="title"
            value={title}
            className="text-[#2d2817] text-sm md:text-base text-center font-minecraft"
          />
        </h2>
        <div className="minecraft-panel-wood p-6 md:p-8">
          <p className="font-minecraft text-white/95 text-[10px] md:text-xs leading-loose whitespace-pre-line">
            <EditableTextInline
              blockType="about"
              blockId={BLOCK_ID}
              field="paragraph"
              value={body}
              multiline
              className="text-white/95 text-[10px] md:text-xs font-minecraft leading-loose"
            />
          </p>
        </div>
      </div>
    </section>
  )
}
