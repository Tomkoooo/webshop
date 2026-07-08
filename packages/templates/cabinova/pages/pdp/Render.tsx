import type { RenderProps, PdpPageDeps } from "@wse/sdk/templates/types"
import { CabinovaProductDetail } from "../../commerce/CabinovaProductDetail"
import type { PdpContent } from "./schema"

export function PdpRender({ content, deps }: RenderProps<PdpContent, PdpPageDeps>) {
  return (
    <CabinovaProductDetail
      product={deps.product}
      initialVariantId={deps.selectedVariantId}
      shopEnabled={deps.shopEnabled}
      content={content}
    />
  )
}
