"use client"

import { CheckCircle2 } from "lucide-react"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { TBookSuccessContent } from "../schemas"

export function TBookSuccessRender({ content }: { content: TBookSuccessContent }) {
  const c = content
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="size-9" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        <EditableDocText path="successTitle" value={c.successTitle} />
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        <EditableDocText path="successBody" value={c.successBody} multiline />
      </p>
      <span className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground">
        <EditableDocText path="successCta" value={c.successCta} />
      </span>
      <p className="mt-8 text-xs text-muted-foreground">
        Előnézet — sikeres foglalás állapot. Hibaállapot szövegei a jobb oldali panelen szerkeszthetők.
      </p>
    </div>
  )
}
