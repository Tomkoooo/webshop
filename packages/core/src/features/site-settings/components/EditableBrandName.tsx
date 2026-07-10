"use client"

import { cn } from "@wse/core/lib/utils"
import { cmsInlineFieldClass } from "@wse/core/lib/admin-ui"

export function EditableBrandName({
  value,
  editMode,
  onChange,
  id,
  wrapperClassName,
  inputClassName,
}: {
  value: string
  editMode: boolean
  onChange: (value: string) => void | Promise<void>
  id?: string
  wrapperClassName?: string
  inputClassName?: string
}) {
  if (!editMode) return <span>{value}</span>
  return (
    <div className={cn("inline-flex items-center", wrapperClassName)}>
      <input
        id={id}
        value={value}
        onChange={(event) => void onChange(event.target.value)}
        className={cn(cmsInlineFieldClass, "h-9", inputClassName)}
      />
    </div>
  )
}
