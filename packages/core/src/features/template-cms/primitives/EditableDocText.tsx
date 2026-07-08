"use client"

import { useEffect, useState } from "react"
import { cn } from "@wse/core/lib/utils"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

const editableDocFieldClass =
  "w-full rounded border border-dashed border-primary/40 bg-[color-mix(in_oklab,var(--theme-surface)_75%,transparent)] px-2 py-1 text-inherit"

export function EditableDocText({
  path,
  value,
  className,
  multiline = false,
  placeholder = "…",
}: {
  path: string
  value: string
  className?: string
  multiline?: boolean
  placeholder?: string
}) {
  const cms = useSurfaceDocEdit()
  const [local, setLocal] = useState(value ?? "")

  useEffect(() => {
    setLocal(value ?? "")
  }, [value])

  if (!cms.enabled) {
    return <span className={className}>{value || (multiline ? "" : null)}</span>
  }

  if (multiline) {
    return (
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => cms.setPath(path, local)}
        placeholder={placeholder}
        className={cn(editableDocFieldClass, "min-h-[72px] py-1.5", className)}
      />
    )
  }

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => cms.setPath(path, local)}
      placeholder={placeholder}
      className={cn(editableDocFieldClass, className)}
    />
  )
}
