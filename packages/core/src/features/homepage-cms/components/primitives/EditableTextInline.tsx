"use client"

import { useEffect, useState } from "react"
import { cn } from "@wse/core/lib/utils"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"

const editableFieldClass =
  "w-full border border-dashed border-primary/40 bg-[color-mix(in_oklab,var(--theme-surface)_75%,transparent)] px-2 py-1 text-inherit"

export function EditableTextInline({
  blockType,
  blockId,
  field,
  value,
  className,
  multiline = false,
  placeholder = "Text",
  onCommit,
}: {
  blockType: HomepageBlock["type"]
  blockId?: string
  field: string
  value: string
  className?: string
  multiline?: boolean
  placeholder?: string
  /** When set (e.g. hero slides), overrides default top-level `updateField`. */
  onCommit?: (value: string) => void
}) {
  const cms = useCmsEdit()
  const [localValue, setLocalValue] = useState(value || "")

  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  const commit = () => {
    if (onCommit) onCommit(localValue)
    else cms.updateField(blockType, field, localValue, blockId)
  }

  if (!cms.enabled) {
    return <>{value || placeholder}</>
  }

  if (multiline) {
    return (
      <textarea
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        rows={4}
        className={cn(editableFieldClass, "min-h-24 resize-y", className)}
      />
    )
  }

  return (
    <input
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      className={cn(editableFieldClass, className)}
    />
  )
}
