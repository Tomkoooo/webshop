"use client"

import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"
import { TBookField } from "./t-book-admin-ui"

export function TBookRichTextField({
  label,
  value,
  onChange,
  minHeight = "min-h-[160px]",
}: {
  label: string
  value: string
  onChange: (html: string) => void
  minHeight?: string
}) {
  return (
    <TBookField label={label}>
      <RichTextEditor
        variant="mail"
        value={value || "<p></p>"}
        onChange={onChange}
        className="rounded-lg overflow-hidden ring-1 ring-inset ring-border/20"
        editorClassName={minHeight}
      />
    </TBookField>
  )
}
