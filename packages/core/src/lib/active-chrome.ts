import { cache } from "react"
import {
  getRequestActiveTemplateInfo,
  getRequestBrandingSettings,
  getCachedFooterSettingsForTemplate,
} from "@wse/core/lib/cached-storefront"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { resolveCommerceSlots } from "@wse/core/templates/resolve-commerce-slots"
import { readPreviewTemplateId } from "@wse/core/services/template-preview"
import { loadTemplateModule } from "@wse/core/templates/registry"
import { timeDevMetric } from "@wse/core/lib/dev-metrics"
import { FooterSettingsService } from "@wse/core/services/footer-settings"
import { getRequestLocale } from "@wse/core/lib/locale"
import type { NavbarSearchSlotProps, TemplateModule } from "@wse/sdk/templates/types"
import type { ComponentType } from "react"

export type ActiveChrome = {
  template: TemplateModule
  branding: { brandName: string; logoNav: string; logoFooter: string; logoHero: string }
  footerSettings: Awaited<ReturnType<typeof FooterSettingsService.getForTemplate>>
  shopEnabled: boolean
  locale: string
  Navbar: TemplateModule["chrome"]["Navbar"]
  Footer: TemplateModule["chrome"]["Footer"]
  NavbarSearch?: ComponentType<NavbarSearchSlotProps>
}

export const getActiveChrome = cache(async function getActiveChrome(): Promise<ActiveChrome> {
  const [previewTemplateId, activeInfo, branding, locale] = await Promise.all([
    timeDevMetric("activeChrome.previewTemplate", () => readPreviewTemplateId(), { category: "page-data" }),
    timeDevMetric("activeChrome.templateInfo", () => getRequestActiveTemplateInfo(), { category: "page-data" }),
    timeDevMetric("activeChrome.branding", () => getRequestBrandingSettings(), { category: "page-data" }),
    timeDevMetric("activeChrome.locale", () => getRequestLocale(), { category: "page-data" }),
  ])
  const template = await timeDevMetric(
    "activeChrome.templateModule",
    () => loadTemplateModule(previewTemplateId ?? activeInfo.templateId),
    { category: "page-data", metadata: { templateId: previewTemplateId ?? activeInfo.templateId } }
  )
  const footerSettings = await timeDevMetric(
    "activeChrome.footerSettings",
    () => getCachedFooterSettingsForTemplate(template, locale),
    { category: "page-data", metadata: { templateId: template.manifest.id } }
  )
  const shopEnabled = isShopEnabled()
  const { NavbarSearch } = resolveCommerceSlots(template)
  return {
    template,
    branding,
    footerSettings,
    shopEnabled,
    locale,
    Navbar: template.chrome.Navbar,
    Footer: template.chrome.Footer,
    NavbarSearch,
  }
})
