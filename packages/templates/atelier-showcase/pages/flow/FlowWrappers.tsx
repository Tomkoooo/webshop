"use client"

import type { FlowPageBodyProps, FlowPageWrapperProps } from "@wse/sdk/templates/types"

export function AtelierFlowPageShell({ children }: FlowPageWrapperProps) {
  return (
    <div className="min-h-screen w-full min-w-0 bg-background pt-36 text-foreground md:pt-40">
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">{children}</div>
    </div>
  )
}

export function AtelierCartFlowBody({ children, route }: FlowPageBodyProps) {
  void route
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface/50 p-4 shadow-sm">
      {children}
    </div>
  )
}
