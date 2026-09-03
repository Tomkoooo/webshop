import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"
import { SakkmedHomeSections } from "./blocks/SakkmedHomeSections"
import "../../sakkmed.css"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return (
    <div className="sakkmed-root overflow-x-hidden">
      <SakkmedHomeSections snapshot={content} siteContact={deps.siteContact} />
    </div>
  )
}
