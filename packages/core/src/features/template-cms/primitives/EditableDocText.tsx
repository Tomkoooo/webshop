"use client"

import { useEffect, useState } from "react"
import { cn } from "@wse/core/lib/utils"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

const editableDocFieldClass =
  "cms-admin-control w-full rounded border border-dashed border-primary/50 bg-card px-2 py-1 text-foreground shadow-sm"

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
    // Sync local draft when CMS reloads content from the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled field must mirror prop updates
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
