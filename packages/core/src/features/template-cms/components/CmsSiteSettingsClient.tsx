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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/cms"
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            ← CMS áttekintés
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Weboldal <span className="admin-text-accent">beállítások</span>
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl">
            Sablon: <code className="text-neutral-200">{templateName}</code> — ezek az egész webshopra
            érvényesek (nem egyetlen oldal tartalmához kötöttek).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-56 shrink-0 space-y-1">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={
                section === item.id
                  ? "w-full text-left rounded-lg border border-primary/50 bg-primary/15 px-3 py-2.5"
                  : "w-full text-left rounded-lg border border-transparent px-3 py-2.5 text-neutral-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
              }
            >
              <span className="block text-xs font-black uppercase tracking-widest">{item.label}</span>
              <span className="mt-0.5 block text-[10px] normal-case tracking-normal text-neutral-500">
                {item.description}
              </span>
            </button>
          ))}
        </aside>

        <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 p-6">
          {activeMeta ? (
            <h2 className="text-lg font-black uppercase tracking-wider text-white mb-6">{activeMeta.label}</h2>
          ) : null}

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
              <p className="text-sm text-neutral-400">
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
        </div>
      </div>
    </div>
  )
}
