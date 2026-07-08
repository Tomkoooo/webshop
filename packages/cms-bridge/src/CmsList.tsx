"use client"

import type { ElementType, ReactNode } from "react"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { cn } from "@wse/core/lib/utils"

type CmsListProps<T> = {
  /** Array path in the page document, e.g. `testimonials`. */
  path: string
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  /** Factory for the "add" button; omit to hide adding on canvas. */
  createItem?: () => T
  addLabel?: string
  as?: ElementType
  className?: string
  itemClassName?: string
  /** Max items (add button hides at the limit). */
  maxItems?: number
}

/**
 * Array field renderer. Read mode renders items untouched; in the visual CMS
 * every item gets reorder/delete controls and the list exposes
 * `data-cms-list` for the structured sidebar editor.
 */
export function CmsList<T>({
  path,
  items,
  renderItem,
  createItem,
  addLabel = "Új elem",
  as,
  className,
  itemClassName,
  maxItems,
}: CmsListProps<T>) {
  const cms = useSurfaceDocEdit()
  const Tag = (as ?? "div") as ElementType

  if (!cms.enabled) {
    return (
      <Tag className={className}>
        {items.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </Tag>
    )
  }

  const commit = (next: T[]) => cms.setPath(path, next)

  return (
    <Tag className={className} data-cms-list={path}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn("relative", itemClassName)}
          data-cms-list-item={`${path}.${index}`}
        >
          <CmsListItemToolbar
            onMoveUp={() => commit(moveArrayItem(items, index, -1))}
            onMoveDown={() => commit(moveArrayItem(items, index, 1))}
            onRemove={() => commit(items.filter((_, i) => i !== index))}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            className="mb-1"
          />
          {renderItem(item, index)}
        </div>
      ))}
      {createItem && (maxItems == null || items.length < maxItems) ? (
        <CmsListAddButton onClick={() => commit([...items, createItem()])} label={addLabel} />
      ) : null}
    </Tag>
  )
}
