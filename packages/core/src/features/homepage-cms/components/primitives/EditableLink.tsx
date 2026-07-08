"use client"

import Link from "next/link"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"

type Props = {
  label: string
  href: string
  onLabelChange: (value: string) => void
  onHrefChange: (value: string) => void
  editMode: boolean
  className?: string
}

export function EditableLink({
  label,
  href,
  onLabelChange,
  onHrefChange,
  editMode,
  className,
}: Props) {
  if (!editMode) {
    return (
      <Link href={href || "#"} className={className}>
        {label}
      </Link>
    )
  }

  return (
    <div className="space-y-2">
      <EditableText value={label} onChange={onLabelChange} editMode placeholder="Button label" />
      <EditableText value={href} onChange={onHrefChange} editMode placeholder="Target URL" className="text-xs" />
    </div>
  )
}
