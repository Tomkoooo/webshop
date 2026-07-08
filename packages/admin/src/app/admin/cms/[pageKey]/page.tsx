import { createHash } from "crypto"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { TemplateService } from "@wse/core/services/template"
import { PageContentService } from "@wse/core/services/page-content"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { getAccessibleCmsSiteSettingsSections } from "@wse/core/lib/admin-settings-access"
import { CmsTemplatePageClient } from "@wse/core/features/template-cms/components/CmsTemplatePageClient"
import { ShopVisualSurfaceEditor } from "@wse/core/features/template-cms/editors/ShopVisualSurfaceEditor"
import { StaticPageVisualSurfaceEditor } from "@wse/core/features/template-cms/editors/StaticPageVisualSurfaceEditor"
import { PdpVisualSurfaceEditor } from "@wse/core/features/template-cms/editors/PdpVisualSurfaceEditor"
import { FlowShellVisualSurfaceEditor } from "@wse/core/features/template-cms/editors/FlowShellVisualSurfaceEditor"
import { CampSurfaceVisualEditor } from "@wse/core/features/template-cms/editors/CampSurfaceVisualEditor"
import { HomeVisualSurfaceEditor } from "@wse/core/features/template-cms/editors/HomeVisualSurfaceEditor"
import { AdminCmsPageNav } from "@wse/core/components/admin/AdminCmsPageNav"
import { PluginService } from "@wse/core/services/plugin"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { FooterSettingsService } from "@wse/core/services/footer-settings"
import { SeoSettingsService } from "@wse/core/services/seo-settings"
import { getEffectiveThemeBase, ThemeService } from "@wse/core/services/theme"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { resolveContactDisplayField } from "@wse/core/lib/contact-display"
import type { FlowRouteKey } from "@wse/sdk/templates/types"
import { getShopCmsPreviewDeps, getPdpPreviewProduct } from "@wse/core/features/template-cms/resolve-cms-preview-deps"
import type { ShopContent } from "@wse/template-default-modern/pages/shop/schema"
import type { PdpContent } from "@wse/template-default-modern/pages/pdp/schema"
import type { DefaultModernFlowShellContent } from "@wse/template-default-modern/pages/flow/flow-shell-schema"

export const dynamic = "force-dynamic"

const CAMP_PAGE_KEYS = new Set(["page:jegyvasarlas", "page:foglalas", "page:foglalas-siker"])

const FLOW_PAGE_ROUTE: Partial<Record<string, FlowRouteKey>> = {
  "page:cart": "cart",
  "page:checkout": "checkout",
  "page:profile": "profile",
}

function cmsEditorHydrationFingerprint(parts: unknown[]): string {
  const h = createHash("sha256")
  for (const p of parts) {
    h.update(JSON.stringify(p))
  }
  return h.digest("hex").slice(0, 22)
}

export default async function CmsPageEditor({
  params,
}: {
  params: Promise<{ pageKey: string }>
}) {
  const { pageKey } = await params
  const template = await TemplateService.getActive()
  const dbActiveTemplate = await TemplateService.getDbActive()
  const shopEnabled = isShopEnabled()
  const campBookingEnabled = await PluginService.isEnabled("camp-booking")
  const editablePages = listEditablePages(template, shopEnabled, campBookingEnabled)
  const cmsSettingsSections = getAccessibleCmsSiteSettingsSections(shopEnabled)
  const entry = editablePages.find((p) => p.adminSegment === pageKey)
  if (!entry) notFound()

  const fullPageKey = entry.pageKey
  const [dependencies, branding, footer, seo, theme] = await Promise.all([
    getHomepageRenderDependencies(),
    BrandingSettingsService.get(),
    FooterSettingsService.get(),
    SeoSettingsService.get(),
    ThemeService.getMergedForTemplate(dbActiveTemplate),
  ])

  const themeResetBaseline = getEffectiveThemeBase(dbActiveTemplate)

  if (entry.editorKind === "homepage-blocks") {
    if (template.pages.home.cmsPageKind !== "homepage-blocks") notFound()

    const initialDraft = await PageContentService.getDraft(template.manifest.id, fullPageKey)
    const draftSnapshot = initialDraft as HomepageSnapshot
    const hydratedSnapshot: HomepageSnapshot = {
      ...draftSnapshot,
      blocks: (draftSnapshot.blocks ?? []).map((block) =>
        block.type === "contact"
          ? {
              ...block,
              data: {
                ...block.data,
                companyName: block.data.companyName || dependencies.company.name,
                address: resolveContactDisplayField(
                  block.data.address,
                  dependencies.company.address
                ),
                phone: resolveContactDisplayField(
                  block.data.phone,
                  dependencies.company.phone
                ),
              },
            }
          : block
      ),
    }

    const editorHydrationKey = cmsEditorHydrationFingerprint([
      template.manifest.id,
      fullPageKey,
      initialDraft,
    ])

    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-4">
          <Link
            href="/admin/cms"
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white w-fit"
          >
            ← CMS áttekintés
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white">
                CMS: {entry.label}
              </h1>
              <p className="text-xs text-neutral-500">
                Sablon: <code>{template.manifest.name}</code> · Kulcs: <code>{fullPageKey}</code>
                <span className="ml-2 admin-text-accent">· Blokkos főoldal</span>
              </p>
            </div>
            <AdminCmsPageNav
              editablePages={editablePages}
              activeSegment={pageKey}
              settingsSections={cmsSettingsSections}
            />
          </div>
        </header>

        <CmsTemplatePageClient
          hydrationKey={editorHydrationKey}
          templateId={template.manifest.id}
          shopEnabled={shopEnabled}
          initialSnapshot={hydratedSnapshot}
          initialBranding={branding}
          initialFooter={footer}
          initialTheme={theme}
          dependencies={dependencies}
        />
      </div>
    )
  }

  const initialDraftUnknown = await PageContentService.getDraft(template.manifest.id, fullPageKey)
  const editorHydrationKey = cmsEditorHydrationFingerprint([
    template.manifest.id,
    fullPageKey,
    initialDraftUnknown,
    shopEnabled,
  ])

  switch (fullPageKey) {
    case "page:home": {
      if (entry.editorKind !== "surface-json") notFound()

      return (
        <SurfacePageLayout
          label={entry.label}
          subtitle="Főoldal · JSON felület"
          editablePages={editablePages}
          settingsSections={cmsSettingsSections}
          pageKey={pageKey}
          manifestName={template.manifest.name}
          fullPageKey={fullPageKey}
        >
          <HomeVisualSurfaceEditor
            hydrationKey={editorHydrationKey}
            templateId={template.manifest.id}
            shopEnabled={shopEnabled}
            pageKey={fullPageKey}
            pageLabel={entry.label}
            initialDraft={initialDraftUnknown as Record<string, unknown>}
            branding={branding}
            footer={footer}
            seo={seo}
            theme={theme}
            themeResetBaseline={themeResetBaseline}
            homepageDeps={dependencies}
          />
        </SurfacePageLayout>
      )
    }

    case "page:shop": {
      const initialDraft = initialDraftUnknown as ShopContent
      const shopDeps = await getShopCmsPreviewDeps(template, initialDraft.pageSize, shopEnabled)
      return (
        <SurfacePageLayout
          label={entry.label}
          subtitle="Bolt · szerkesztő"
          editablePages={editablePages}
          settingsSections={cmsSettingsSections}
          pageKey={pageKey}
          manifestName={template.manifest.name}
          fullPageKey={fullPageKey}
        >
          <ShopVisualSurfaceEditor
            hydrationKey={editorHydrationKey}
            templateId={template.manifest.id}
            shopEnabled={shopEnabled}
            pageKey={fullPageKey}
            initialDraft={initialDraft}
            shopDeps={shopDeps}
            branding={branding}
            footer={footer}
            seo={seo}
            theme={theme}
            themeResetBaseline={themeResetBaseline}
            homepageDeps={dependencies}
          />
        </SurfacePageLayout>
      )
    }

    case "page:pdp": {
      const product = await getPdpPreviewProduct()
      const pdpDeps = { product, selectedVariantId: undefined, shopEnabled, templateId: template.manifest.id }
      const initialDraft = initialDraftUnknown as PdpContent
      return (
        <SurfacePageLayout
          label={entry.label}
          subtitle="Termék oldal · keret szerkesztő"
          editablePages={editablePages}
          settingsSections={cmsSettingsSections}
          pageKey={pageKey}
          manifestName={template.manifest.name}
          fullPageKey={fullPageKey}
        >
          <PdpVisualSurfaceEditor
            hydrationKey={editorHydrationKey}
            templateId={template.manifest.id}
            shopEnabled={shopEnabled}
            pageKey={fullPageKey}
            initialDraft={initialDraft}
            pdpDeps={pdpDeps}
            branding={branding}
            footer={footer}
            seo={seo}
            theme={theme}
            themeResetBaseline={themeResetBaseline}
            homepageDeps={dependencies}
          />
        </SurfacePageLayout>
      )
    }

    default: {
      const flowRoute = FLOW_PAGE_ROUTE[fullPageKey]
      if (flowRoute) {
        const initialDraft = initialDraftUnknown as DefaultModernFlowShellContent

        return (
          <SurfacePageLayout
            label={entry.label}
            subtitle="Folyamat oldal · keret szerkesztő"
            editablePages={editablePages}
            settingsSections={cmsSettingsSections}
            pageKey={pageKey}
            manifestName={template.manifest.name}
            fullPageKey={fullPageKey}
          >
            <FlowShellVisualSurfaceEditor
              hydrationKey={editorHydrationKey}
              templateId={template.manifest.id}
              shopEnabled={shopEnabled}
              pageKey={fullPageKey}
              flowRoute={flowRoute}
              initialDraft={initialDraft}
              branding={branding}
              footer={footer}
              seo={seo}
              theme={theme}
              themeResetBaseline={themeResetBaseline}
              homepageDeps={dependencies}
            />
          </SurfacePageLayout>
        )
      }

      const staticSlug = fullPageKey.startsWith("page:") ? fullPageKey.slice("page:".length) : ""
      if (staticSlug && template.staticPages[staticSlug]) {
        return (
          <SurfacePageLayout
            label={entry.label}
            subtitle={`Statikus lap · /${staticSlug}`}
            editablePages={editablePages}
            settingsSections={cmsSettingsSections}
            pageKey={pageKey}
            manifestName={template.manifest.name}
            fullPageKey={fullPageKey}
          >
            <StaticPageVisualSurfaceEditor
              hydrationKey={editorHydrationKey}
              templateId={template.manifest.id}
              shopEnabled={shopEnabled}
              pageKey={fullPageKey}
              slug={staticSlug}
              pageLabel={entry.label}
              initialDraft={initialDraftUnknown as Record<string, unknown>}
              branding={branding}
              footer={footer}
              seo={seo}
              theme={theme}
              themeResetBaseline={themeResetBaseline}
              homepageDeps={dependencies}
            />
          </SurfacePageLayout>
        )
      }

      if (CAMP_PAGE_KEYS.has(fullPageKey) && template.campPages) {
        return (
          <SurfacePageLayout
            label={entry.label}
            subtitle="Tábor foglalás · szövegek"
            editablePages={editablePages}
            settingsSections={cmsSettingsSections}
            pageKey={pageKey}
            manifestName={template.manifest.name}
            fullPageKey={fullPageKey}
          >
            <CampSurfaceVisualEditor
              hydrationKey={editorHydrationKey}
              templateId={template.manifest.id}
              shopEnabled={shopEnabled}
              pageKey={fullPageKey}
              pageLabel={entry.label}
              initialDraft={initialDraftUnknown as Record<string, unknown>}
              branding={branding}
              footer={footer}
              seo={seo}
              theme={theme}
              themeResetBaseline={themeResetBaseline}
              homepageDeps={dependencies}
            />
          </SurfacePageLayout>
        )
      }

      notFound()
    }
  }
}

function SurfacePageLayout({
  label,
  subtitle,
  editablePages,
  settingsSections,
  pageKey,
  manifestName,
  fullPageKey,
  children,
}: {
  label: string
  subtitle: string
  editablePages: ReturnType<typeof listEditablePages>
  settingsSections: Array<{ id: string; label: string }>
  pageKey: string
  manifestName: string
  fullPageKey: string
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <Link
          href="/admin/cms"
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white w-fit"
        >
          ← CMS áttekintés
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">CMS: {label}</h1>
            <p className="text-xs text-neutral-500">
              Sablon: <code>{manifestName}</code> · Kulcs: <code>{fullPageKey}</code>
              <span className="ml-2 admin-text-accent">· {subtitle}</span>
            </p>
          </div>
          <AdminCmsPageNav
            editablePages={editablePages}
            activeSegment={pageKey}
            settingsSections={settingsSections}
          />
        </div>
      </header>

      <div>{children}</div>
    </div>
  )
}
