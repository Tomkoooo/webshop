"use client"

import {
  PRESS_KIT_BLOCK_LABELS,
  createPressKitBlock,
  type PressKitBlockType,
  type PressKitPageBlock,
} from "../lib/page-content"

export function PressKitBlockInserter({
  blocks,
  onInsert,
}: {
  blocks: PressKitPageBlock[]
  onInsert: (blocks: PressKitPageBlock[]) => void
}) {
  const hasHero = blocks.some((b) => b.type === "hero")

  const types = (Object.keys(PRESS_KIT_BLOCK_LABELS) as PressKitBlockType[]).filter(
    (t) => !(t === "hero" && hasHero)
  )

  return (
    <div className="border border-dashed border-white/20 p-4 bg-black/50 rounded-lg">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
        Blokk hozzáadása
      </p>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onInsert([...blocks, createPressKitBlock(type)])}
            className="px-3 h-8 border border-white/20 text-[10px] uppercase font-black tracking-widest text-white hover:border-primary hover:text-primary transition-colors"
          >
            {PRESS_KIT_BLOCK_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  )
}
