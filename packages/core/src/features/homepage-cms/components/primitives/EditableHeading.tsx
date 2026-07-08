"use client"

import { cn } from "@wse/core/lib/utils"

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
