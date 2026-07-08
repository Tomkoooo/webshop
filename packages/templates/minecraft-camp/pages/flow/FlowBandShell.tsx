"use client"

import type { FlowShellDeps } from "@wse/sdk/templates/types"
import type { DefaultModernFlowShellContent } from "./flow-shell-schema"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

export function DefaultModernFlowBandShell({
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
  const c = content as DefaultModernFlowShellContent
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6">
      <header className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
          <EditableDocText path="headline" value={c.headline ?? ""} className="uppercase" />
        </h1>
        {(c.subhead || cms.enabled) && (
          <p className="max-w-2xl text-sm text-neutral-400 md:text-base">
            <EditableDocText path="subhead" value={c.subhead ?? ""} multiline />
          </p>
        )}
      </header>
      {children}
    </div>
  )
}
