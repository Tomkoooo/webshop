"use client"

import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { TBookSuccessContent } from "../schemas"

export function TBookSuccessRender({ content }: { content: TBookSuccessContent }) {
  const c = content
  return (
    <div className="space-y-4 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold">
        <EditableDocText path="successTitle" value={c.successTitle} />
      </h1>
      <p className="text-muted-foreground">
        <EditableDocText path="successBody" value={c.successBody} multiline />
      </p>
    </div>
  )
}
