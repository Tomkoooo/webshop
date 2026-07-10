"use client"

import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

type Props = {
  path: string
  html: string
  className?: string
  minHeight?: string
}

export function PressKitInlineRichEditor({ path, html, className, minHeight }: Props) {
  const cms = useSurfaceDocEdit()

  if (!cms.enabled) {
    return (
      <div
        className={className ?? "prose prose-neutral dark:prose-invert max-w-none"}
        dangerouslySetInnerHTML={{ __html: html || "" }}
      />
    )
  }

  return (
    <RichTextEditor
      variant="mail"
      value={html || "<p></p>"}
      onChange={(next) => cms.setPath(path, next)}
      className="border border-dashed border-primary/35 ring-1 ring-border/60"
      editorClassName={minHeight ?? "min-h-[200px]"}
    />
  )
}
