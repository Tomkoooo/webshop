"use client"

import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { TBookListContent } from "../schemas"

export function TBookListRender({ content }: { content: TBookListContent }) {
  const c = content
  return (
    <div className="space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">
        <EditableDocText path="pageTitle" value={c.pageTitle} />
      </h1>
      <p className="text-muted-foreground">
        <EditableDocText path="pageIntro" value={c.pageIntro} multiline />
      </p>
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Eseménylista előnézet — a valódi oldalon a tBook plugin tölti be az eseményeket az API kulcs alapján.
      </div>
    </div>
  )
}
