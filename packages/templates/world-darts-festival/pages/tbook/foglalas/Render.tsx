"use client"

import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { TBookBookingContent } from "../schemas"

export function TBookBookingRender({ content }: { content: TBookBookingContent }) {
  const c = content
  return (
    <div className="space-y-4 px-4 py-10">
      <h1 className="text-2xl font-bold">Foglalás</h1>
      <p className="text-sm text-muted-foreground">
        Lépések:{" "}
        <EditableDocText path="stepTicket" value={c.stepTicket} /> →{" "}
        <EditableDocText path="stepDetails" value={c.stepDetails} /> →{" "}
        <EditableDocText path="stepReview" value={c.stepReview} />
      </p>
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Foglalási űrlap előnézet — a valódi oldalon a tBook API vezérli a folyamatot.
      </div>
    </div>
  )
}
