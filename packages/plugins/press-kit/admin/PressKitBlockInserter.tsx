"use client"

import {
  PRESS_KIT_BLOCK_LABELS,
  createPressKitBlock,
  type PressKitBlockType,
  type PressKitPageBlock,
} from "../lib/page-content"
import { Button } from "@wse/core/components/ui/button"

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
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
      <p className="text-sm font-medium text-muted-foreground mb-3">Blokk hozzáadása</p>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onInsert([...blocks, createPressKitBlock(type)])}
          >
            {PRESS_KIT_BLOCK_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  )
}
