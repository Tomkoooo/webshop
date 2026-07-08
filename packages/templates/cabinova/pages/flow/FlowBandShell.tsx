"use client"

import type { FlowShellDeps } from "@wse/sdk/templates/types"
import type { AtelierFlowShellContent } from "./flow-shell-schema"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

export function AtelierFlowBandShell({
  content,
  deps,
  children,
}: {
  content: unknown
  deps: FlowShellDeps
  children: React.ReactNode
}) {
  void deps
  const cms = useSurfaceDocEdit()
  const c = content as AtelierFlowShellContent
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 border-b border-border bg-muted/30 px-4 py-8 sm:px-6">
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          <EditableDocText path="headline" value={c.headline ?? ""} />
        </h1>
        {(c.subhead || cms.enabled) && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            <EditableDocText path="subhead" value={c.subhead ?? ""} multiline />
          </p>
        )}
      </header>
      {children}
    </div>
  )
}
