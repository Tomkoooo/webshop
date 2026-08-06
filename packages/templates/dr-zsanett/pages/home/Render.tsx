import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import { CmsText } from "@wse/cms-bridge"
import { DrZsanettRoot } from "../../components/DrZsanettRoot"
import { LandingPage } from "../../components/LandingPage"
import type { HomeContent } from "./schema"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return (
    <DrZsanettRoot>
      <main>
        <span className="sr-only">
          <CmsText path="meta.seoTitle" value={content.meta.seoTitle} />
        </span>
        <LandingPage
          content={content}
          siteContact={{
            emails: deps.siteContact.emails,
            phone: deps.siteContact.phone || content.contact.phone,
            address: deps.siteContact.address || content.contact.address,
          }}
        />
      </main>
    </DrZsanettRoot>
  )
}
