"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import {
  parseCmsSiteSettingsSection,
  type CmsSiteSettingsSection,
} from "@wse/core/features/template-cms/cms-site-settings"
import { ThemeEditor } from "@wse/core/features/theme/components/ThemeEditor"
import { SeoEditor } from "@wse/core/features/site-settings/components/SeoEditor"
import { FooterEditor } from "@wse/core/features/site-settings/components/FooterEditor"
import { ContactEmailsEditor } from "@wse/core/features/site-settings/components/ContactEmailsEditor"
import { CmsChromeBrandingToolbar } from "@wse/core/features/template-cms/components/CmsChromeBrandingToolbar"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { adminLinkAccent, adminNavItem, adminNavItemActive } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
import type { ThemeTokens } from "@wse/core/services/theme"
import type { SeoSettings } from "@wse/core/services/seo-settings"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import type { ContactEmailEntry } from "@wse/core/lib/contact-emails"
import type { CmsBrandingToolbarState } from "@wse/core/features/template-cms/components/CmsChromeBrandingToolbar"

type SettingsSectionMeta = {
  id: CmsSiteSettingsSection
  label: string
  description: string
}

type Props = {
  section: CmsSiteSettingsSection
  sections: SettingsSectionMeta[]
  showShopOrderEmails: boolean
  templateName: string
  themeResetBaseline: ThemeTokens
  themeResetHelpText: string
  initialTheme: ThemeTokens
  initialSeo: SeoSettings
  initialBranding: CmsBrandingToolbarState
  initialFooter: FooterSettings
  initialContactEmails: ContactEmailEntry[]
  initialInvoiceErrorAlertEmails: string[]
  initialNewOrderNotificationEmails: string[]
}

export function CmsSiteSettingsClient({
  section: initialSection,
  sections,
  showShopOrderEmails,
  templateName,
  themeResetBaseline,
  themeResetHelpText,
  initialTheme,
  initialSeo,
  initialBranding,
  initialFooter,
  initialContactEmails,
  initialInvoiceErrorAlertEmails,
  initialNewOrderNotificationEmails,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const section = parseCmsSiteSettingsSection(
    searchParams.get("section") ?? initialSection,
    sections
  )

  const [branding, setBranding] = useState(initialBranding)

  const setSection = (next: CmsSiteSettingsSection) => {
    router.push(`/admin/cms/settings?section=${next}`)
  }

  const activeMeta = sections.find((s) => s.id === section)

  return (
    <AdminPageScaffold
      title="Weboldal beállítások"
      description={
        <>
          Sablon: <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{templateName}</code> — ezek az
          egész webshopra érvényesek (nem egyetlen oldal tartalmához kötöttek).
        </>
      }
      actions={
        <Link href="/admin/cms" className={cn("text-sm font-medium", adminLinkAccent)}>
          ← CMS áttekintés
        </Link>
      }
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <Card className="shrink-0 lg:w-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Szakaszok</CardTitle>
            <CardDescription>Válassz beállítási területet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={section === item.id ? adminNavItemActive : adminNavItem}
              >
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {item.description}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle className="text-lg">{activeMeta?.label ?? "Beállítások"}</CardTitle>
            {activeMeta?.description ? (
              <CardDescription>{activeMeta.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            {section === "theme" ? (
              <ThemeEditor
                initial={initialTheme}
                resetBaseline={themeResetBaseline}
                resetHelpText={themeResetHelpText}
              />
            ) : null}
            {section === "seo" ? <SeoEditor initial={initialSeo} /> : null}
            {section === "branding" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A logók és a bolt neve a CMS oldalszerkesztők fejlécében is gyorsan módosíthatók.
                </p>
                <CmsChromeBrandingToolbar branding={branding} setBranding={setBranding} />
              </div>
            ) : null}
            {section === "footer" ? <FooterEditor initial={initialFooter} /> : null}
            {section === "contact" ? (
              <ContactEmailsEditor
                initial={initialContactEmails}
                initialInvoiceErrorAlertEmails={initialInvoiceErrorAlertEmails}
                initialNewOrderNotificationEmails={initialNewOrderNotificationEmails}
                showShopOrderEmails={showShopOrderEmails}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminPageScaffold>
  )
}
