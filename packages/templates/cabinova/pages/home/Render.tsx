import { CabinovaHomeSections } from "./blocks/CabinovaHomeSections"
import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return (
    <div className="cabinova-root overflow-x-hidden pb-0 pt-0">
      <CabinovaHomeSections snapshot={content} deps={deps} />
    </div>
  )
}
