"use client"

import type { FlowRouteMainProps } from "@wse/sdk/templates/types"
import { AtelierProfileAccountBody } from "./AtelierProfileAccountBody"

export function AtelierProfileRouteMain(props: FlowRouteMainProps) {
  return <AtelierProfileAccountBody {...props} />
}
