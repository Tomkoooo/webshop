import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"
import { SakkmedHomeSections } from "./blocks/SakkmedHomeSections"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return <SakkmedHomeSections snapshot={content} siteContact={deps.siteContact} />
}
