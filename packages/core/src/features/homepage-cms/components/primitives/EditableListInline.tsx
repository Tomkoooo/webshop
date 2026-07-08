"use client"

import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"

export function EditableListInline<T>({
  blockType,
  blockId,
  field,
  items,
  onRenderItem,
  onCreateItem,
  className,
}: {
  blockType: HomepageBlock["type"]
  blockId?: string
  field: string
  items: T[]
  onRenderItem: (item: T, index: number, helpers: { remove: () => void }) => React.ReactNode
  onCreateItem: () => T
  className?: string
}) {
  const cms = useCmsEdit()

  return (
    <div className={className}>
      {items.map((item, index) =>
        onRenderItem(item, index, {
          remove: () =>
            cms.updateField(
              blockType,
              field,
              items.filter((_, idx) => idx !== index),
              blockId
            ),
        })
      )}
      {cms.enabled ? (
        <button
          type="button"
          onClick={() =>
            cms.updateField(blockType, field, [...items, onCreateItem()], blockId)
          }
          className="px-3 h-8 border border-primary/40 text-xs uppercase text-inherit mt-2"
        >
          Add item
        </button>
      ) : null}
    </div>
  )
}
