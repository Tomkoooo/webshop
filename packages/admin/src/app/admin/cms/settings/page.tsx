import { Suspense } from "react"
import { TemplateService } from "@wse/core/services/template"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { FooterSettingsService } from "@wse/core/services/footer-settings"
import { SeoSettingsService } from "@wse/core/services/seo-settings"
import { ContactEmailsService } from "@wse/core/services/contact-emails"
import { getEffectiveThemeBase, ThemeService } from "@wse/core/services/theme"
import { parseCmsSiteSettingsSection } from "@wse/core/features/template-cms/cms-site-settings"
import { CmsSiteSettingsClient } from "@wse/core/features/template-cms/components/CmsSiteSettingsClient"
import { SiteContactChannelsPanel } from "@wse/core/features/site-settings/components/SiteContactChannelsPanel"
import {
  getAccessibleCmsSiteSettingsSections,
  shouldShowShopOrderContactEmails,
} from "@wse/core/lib/admin-settings-access"
import { isShopEnabled } from "@wse/core/lib/features/shop"

export const dynamic = "force-dynamic"

export default async function CmsSiteSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  const { section: sectionParam } = await searchParams
  const sections = getAccessibleCmsSiteSettingsSections(isShopEnabled())
  const section = parseCmsSiteSettingsSection(sectionParam, sections)
  const showShopOrderEmails = shouldShowShopOrderContactEmails(isShopEnabled())

  const template = await TemplateService.getActive()
  const [
    theme,
    seo,
    branding,
    footer,
    contactEmails,
    invoiceErrorAlertEmails,
    newOrderNotificationEmails,
  ] = await Promise.all([
    ThemeService.getMergedForTemplate(template),
    SeoSettingsService.get(),
    BrandingSettingsService.get(),
    FooterSettingsService.get(),
    ContactEmailsService.list(),
    ContactEmailsService.listInvoiceErrorAlertEmails(),
    ContactEmailsService.listNewOrderNotificationEmails(),
  ])

  const themeResetBaseline = getEffectiveThemeBase(template)
  const themeResetHelpText = template.defaultTheme
    ? "Visszaállítja a sablon alap színeit."
    : "Visszaállítja a motor alapértelmezett palettáját."

  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Betöltés…</div>}>
      {section === "contact" ? <SiteContactChannelsPanel /> : null}
      <CmsSiteSettingsClient
        section={section}
        sections={sections}
        showShopOrderEmails={showShopOrderEmails}
        templateName={template.manifest.name}
        initialTheme={theme}
        themeResetBaseline={themeResetBaseline}
        themeResetHelpText={themeResetHelpText}
        initialSeo={seo}
        initialBranding={branding}
        initialFooter={footer}
        initialContactEmails={contactEmails}
        initialInvoiceErrorAlertEmails={invoiceErrorAlertEmails}
        initialNewOrderNotificationEmails={newOrderNotificationEmails}
      />
    </Suspense>
  )
}
