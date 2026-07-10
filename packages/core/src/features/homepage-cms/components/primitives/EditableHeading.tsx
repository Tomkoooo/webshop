"use client"

import { cn } from "@wse/core/lib/utils"
import { cmsInlineFieldClass } from "@wse/core/lib/admin-ui"

type Props = {
  value: string
  onChange: (value: string) => void
  editMode: boolean
  className?: string
  placeholder?: string
}

export function EditableHeading({
  value,
  onChange,
  editMode,
  className,
  placeholder = "Heading",
}: Props) {
  if (!editMode) {
    return <h2 className={className}>{value || placeholder}</h2>
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(cmsInlineFieldClass, className)}
    />
  )
}
