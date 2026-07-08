"use client"

import * as React from "react"
import type { FlowPageBodyProps, FlowPageWrapperProps } from "@wse/sdk/templates/types"
import { STOREFRONT_MAIN_TOP_PADDING } from "@wse/core/lib/storefront-layout"

/** Reserved for future layout tweaks; keeps flow routes inside a predictable full-width column. */
export function DefaultModernFlowPageShell({ children }: FlowPageWrapperProps) {
  return <div className={`w-full min-h-0 ${STOREFRONT_MAIN_TOP_PADDING}`}>{children}</div>
}

/** `flowPages.cart.Body` — shell already shows page title; hide duplicate heading in engine cart view. */
export function DefaultModernCartFlowBody({ children, route }: FlowPageBodyProps) {
  void route
  const inner =
    React.isValidElement(children) &&
    typeof children.type !== "string"
      ? React.cloneElement(children as React.ReactElement<{ showPageHeading?: boolean }>, {
          showPageHeading: false,
        })
      : children
  return (
    <div className="min-w-0" data-template-flow-body="cart">
      {inner}
    </div>
  )
}
