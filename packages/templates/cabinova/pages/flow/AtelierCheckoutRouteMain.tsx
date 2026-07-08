"use client"

import type { FlowRouteMainProps } from "@wse/sdk/templates/types"
import { AtelierCheckoutExperience } from "./AtelierCheckoutExperience"

export function AtelierCheckoutRouteMain(props: FlowRouteMainProps) {
  return <AtelierCheckoutExperience {...props} />
}
