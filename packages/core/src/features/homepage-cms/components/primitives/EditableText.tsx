"use client"

import { cn } from "@wse/core/lib/utils"

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
        onChange={(event) => {
          onChange(event.target.value)
        }}
        placeholder={placeholder}
        className={cn(
          "w-full min-h-[96px] bg-transparent border border-dashed border-white/20 px-2 py-1 text-white focus:outline-none focus:border-primary-foreground/50",
          className
        )}
      />
    )
  }

  return (
    <input
      value={value}
      onChange={(event) => {
        onChange(event.target.value)
      }}
      placeholder={placeholder}
      className={cn(
        "w-full bg-transparent border border-dashed border-white/20 px-2 py-1 text-white focus:outline-none focus:border-primary-foreground/50",
        className
      )}
    />
  )
}
