"use client"

import type { EditorProps } from "@wse/sdk/templates/types"

export function EditorialEditorPanel({}: EditorProps<unknown>) {
  return (
    <p className="text-sm text-muted-foreground">
      Edit this page visually under <strong>/admin/cms/editorial</strong> (draft, publish, discard).
    </p>
  )
}
