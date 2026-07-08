"use client"

import type { FlowRouteMainProps } from "@wse/sdk/templates/types"
import { AtelierCartPageBody } from "./AtelierCartPageBody"

/** Full custom cart UI — see `AtelierCartPageBody` (does not render `DefaultCartPageView`). */
export function AtelierCartRouteMain(props: FlowRouteMainProps) {
  return <AtelierCartPageBody {...props} />
}
