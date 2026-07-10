"use client"

import { cn } from "@wse/core/lib/utils"
import { cmsInlineFieldClass, cmsInlineTextareaClass } from "@wse/core/lib/admin-ui"

type Props = {
  value: string
  onChange: (value: string) => void
  editMode: boolean
  className?: string
  placeholder?: string
  multiline?: boolean
}

export function EditableText({
  value,
  onChange,
  editMode,
  className,
  placeholder = "Text",
  multiline = false,
}: Props) {
  if (!editMode) {
    return <p className={className}>{value || placeholder}</p>
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(cmsInlineTextareaClass, className)}
      />
    )
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
