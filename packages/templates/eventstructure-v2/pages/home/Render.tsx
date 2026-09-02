import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"
import { EsHomeSections } from "./blocks/EsHomeSections"
import { EsJsonLd } from "../../components/EsJsonLd"
import "../../esv2.css"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return (
    <div className="esv2-root overflow-x-hidden">
      <EsJsonLd />
      <EsHomeSections snapshot={content} siteContact={deps.siteContact} />
    </div>
  )
}
