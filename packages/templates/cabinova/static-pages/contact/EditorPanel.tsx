"use client"

import type { EditorProps } from "@wse/sdk/templates/types"

export function ContactEditorPanel({}: EditorProps<unknown>) {
  return (
    <p className="text-sm text-muted-foreground">
      Edit this page visually at <strong>/admin/cms/contact</strong>.
    </p>
  )
}
