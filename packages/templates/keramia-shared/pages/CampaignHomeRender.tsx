import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import { FALLBACK_TEMPLATE_ID, getTemplateById } from "@wse/core/templates/registry"
import { CampaignLanding } from "../components/CampaignLanding"
import { KeramiaRoot } from "../components/KeramiaRoot"
import { KERAMIA_ADDRESS, KERAMIA_EMAIL, KERAMIA_PHONE } from "../lib/constants"
import { normalizeCampaignContent } from "../lib/normalize-campaign-content"
import type { CampaignPageContent } from "../static-pages/shared/schema"

export function CampaignHomeRender({
  content,
  deps,
}: RenderProps<CampaignPageContent, HomePageDeps>) {
  const mod = getTemplateById(deps.templateId) ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
  const fallback = mod.pages.home.defaultContent as CampaignPageContent
  const normalized = normalizeCampaignContent(content, fallback)
  const emails =
    deps.siteContact.emails.length > 0
      ? deps.siteContact.emails
      : [{ id: "default", label: "Fogászat", email: KERAMIA_EMAIL }]

  return (
    <KeramiaRoot>
      <CampaignLanding
        content={normalized}
        siteContact={{
          emails,
          phone: KERAMIA_PHONE,
          address: KERAMIA_ADDRESS,
        }}
      />
    </KeramiaRoot>
  )
}
