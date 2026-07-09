import Link from "next/link"
import {
  FileText,
  LayoutTemplate,
  Megaphone,
  Palette,
  Search,
  Image,
  PanelBottom,
  Mail,
} from "lucide-react"
import type { ComponentType } from "react"
import { TemplateService } from "@wse/core/services/template"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { getAccessibleCmsSiteSettingsSections } from "@wse/core/lib/admin-settings-access"
import { PluginService } from "@wse/core/services/plugin"
import { AdminNavCard, AdminNavCardGrid } from "@wse/core/components/admin/AdminNavCard"
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import type { CmsSiteSettingsSection } from "@wse/core/features/template-cms/cms-site-settings"

export const dynamic = "force-dynamic"

const settingsIcons: Record<CmsSiteSettingsSection, ComponentType<{ className?: string }>> = {
  theme: Palette,
  seo: Search,
  branding: Image,
  footer: PanelBottom,
  contact: Mail,
}

export default async function AdminCmsHub() {
  const shopEnabled = isShopEnabled()
  const campBookingEnabled = await PluginService.isEnabled("camp-booking")
  const tBookEnabled = await PluginService.isEnabled("t-book")
  const template = await TemplateService.getActive()
  const pages = listEditablePages(template, shopEnabled, campBookingEnabled, tBookEnabled)
  const cmsSettingsSections = getAccessibleCmsSiteSettingsSections(shopEnabled)

  return (
    <AdminPageScaffold
      title="CMS áttekintés"
      description="Oldalanként szerkesztheted a tartalmat, vagy a honlap szintű beállításokat (téma, SEO, márka) egy helyen."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/templates">
            <LayoutTemplate className="size-4" />
            Sablonok kezelése
          </Link>
        </Button>
      }
    >
      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="flex flex-wrap items-center gap-2 py-4 text-sm">
          <span className="font-medium text-foreground">Aktív sablon</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{template.manifest.name}</span>
          <span className="text-muted-foreground">— az alábbi beállítások erre a sablonra érvényesek.</span>
        </CardContent>
      </Card>

      <AdminSection
        title="Marketing"
        description="Popup modálok oldalankénti megjelenítéssel — kép, szöveg, gomb és cél URL."
      >
        <AdminNavCardGrid columns="three">
          <AdminNavCard
            href="/admin/cms/popups"
            title="Popup bannerek"
            description="Kampányok a főoldalra, boltba, kategóriába vagy termékoldalra."
            icon={Megaphone}
            accent="marketing"
          />
        </AdminNavCardGrid>
      </AdminSection>

      <AdminSection
        title="Weboldal beállítások"
        description="Nem oldal-specifikus — az egész honlap megjelenésére és működésére hat."
      >
        <AdminNavCardGrid>
          {cmsSettingsSections.map((item) => {
            const Icon = settingsIcons[item.id]
            return (
              <AdminNavCard
                key={item.id}
                href={`/admin/cms/settings?section=${item.id}`}
                title={item.label}
                description={item.description}
                icon={Icon}
                accent="settings"
              />
            )
          })}
        </AdminNavCardGrid>
      </AdminSection>

      <AdminSection
        title="Oldalak szerkesztése"
        description="Válassz egy oldalt a vizuális szerkesztőhöz. A főoldal blokkos CMS; a többi oldal sablon JSON felületet használ."
      >
        <AdminNavCardGrid>
          {pages.map((p) => (
            <AdminNavCard
              key={p.adminSegment}
              href={`/admin/cms/${p.adminSegment}`}
              title={p.label}
              description={p.category}
              meta={p.pageKey}
              icon={FileText}
            />
          ))}
        </AdminNavCardGrid>
      </AdminSection>
    </AdminPageScaffold>
  )
}
