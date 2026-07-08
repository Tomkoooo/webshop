import { RealHomepageSections } from "@wse/core/features/homepage-cms/render/RealHomepageSections"
import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return <RealHomepageSections snapshot={content} dependencies={deps} />
}
