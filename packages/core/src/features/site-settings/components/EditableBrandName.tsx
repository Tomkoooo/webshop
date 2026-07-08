"use client"

import { cn } from "@wse/core/lib/utils"

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
        className={cn(
          "h-9 px-2 bg-transparent border border-dashed border-white/20 text-white text-sm",
          inputClassName
        )}
      />
    </div>
  )
}
