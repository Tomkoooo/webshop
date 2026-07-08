import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"
import { ErdwegRoot } from "../../components/ErdwegRoot"
import { ErdwegHomeSections } from "./blocks/ErdwegHomeSections"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return (
    <ErdwegRoot>
      <ErdwegHomeSections snapshot={content} siteContact={deps.siteContact} />
    </ErdwegRoot>
  )
}
