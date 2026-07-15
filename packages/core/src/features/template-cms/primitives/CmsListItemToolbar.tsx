"use client"

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"

type ToolbarProps = {
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  className?: string
}

export function CmsListItemToolbar({
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp = true,
  canMoveDown = true,
  className,
}: ToolbarProps) {
  return (
    <div className={cn("cms-preview-action flex flex-wrap items-center gap-1", className)}>
      {onMoveUp ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className="cms-preview-action h-7 gap-1 px-2 text-[10px]"
        >
          <ArrowUp className="h-3 w-3" />
          Fel
        </Button>
      ) : null}
      {onMoveDown ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className="cms-preview-action h-7 gap-1 px-2 text-[10px]"
        >
          <ArrowDown className="h-3 w-3" />
          Le
        </Button>
      ) : null}
      {onRemove ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="cms-preview-action ml-auto h-7 gap-1 px-2 text-[10px] text-destructive"
        >
          <X className="h-3 w-3" />
          Törlés
        </Button>
      ) : null}
    </div>
  )
}

type AddButtonProps = {
  onClick: () => void
  label: string
  className?: string
}

export function CmsListAddButton({ onClick, label, className }: AddButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("cms-preview-action gap-1.5", className)}
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}

export function moveArrayItem<T>(items: T[], index: number, offset: -1 | 1): T[] {
  const nextIndex = index + offset
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const next = [...items]
  const current = next[index]!
  next[index] = next[nextIndex]!
  next[nextIndex] = current
  return next
}
