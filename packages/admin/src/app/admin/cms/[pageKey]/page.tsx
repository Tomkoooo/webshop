import { createHash } from "crypto"
import type { ReactNode } from "react"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TemplateService } from "@wse/core/services/template"
import { PageContentService } from "@wse/core/services/page-content"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { getAccessibleCmsSiteSettingsSections } from "@wse/core/lib/admin-settings-access"
import { CmsEditorLoading } from "@wse/core/features/template-cms/components/CmsEditorLoading"
import { CmsVisualEditorPageLayout } from "@wse/core/features/template-cms/components/CmsVisualEditorPageLayout"
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
const TBOOK_PAGE_KEYS = new Set(["page:jegyek", "page:tbook-foglalas", "page:tbook-foglalas-siker"])

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
  const template = await TemplateService.getDbActive()
  const shopEnabled = isShopEnabled()
  const campBookingEnabled = await PluginService.isEnabled("camp-booking")
  const tBookEnabled = await PluginService.isEnabled("t-book")
  const editablePages = listEditablePages(template, shopEnabled, campBookingEnabled, tBookEnabled)
  const cmsSettingsSections = getAccessibleCmsSiteSettingsSections(shopEnabled)
  const entry = editablePages.find((p) => p.adminSegment === pageKey)
  if (!entry) notFound()

  const fullPageKey = entry.pageKey
  const [dependencies, branding, footer, seo, theme] = await Promise.all([
    getHomepageRenderDependencies(),
    BrandingSettingsService.get(),
    FooterSettingsService.getForTemplate(template),
    SeoSettingsService.get(),
    ThemeService.getMergedForTemplate(template),
  ])

  const themeResetBaseline = getEffectiveThemeBase(template)

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

    const { CmsTemplatePageClient } = await import(
      "@wse/core/features/template-cms/components/CmsTemplatePageClient"
    )

    return (
      <CmsVisualEditorPageLayout
        editablePages={editablePages}
        activeSegment={pageKey}
        settingsSections={cmsSettingsSections}
      >
        <Suspense fallback={<CmsEditorLoading label="Főoldal szerkesztő betöltése…" />}>
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
        </Suspense>
      </CmsVisualEditorPageLayout>
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

      const { HomeVisualSurfaceEditor } = await import(
        "@wse/core/features/template-cms/editors/HomeVisualSurfaceEditor"
      )

      return (
        <SurfacePageLayout
          editablePages={editablePages}
          settingsSections={cmsSettingsSections}
          pageKey={pageKey}
        >
          <Suspense fallback={<CmsEditorLoading />}>
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
          </Suspense>
        </SurfacePageLayout>
      )
    }

    case "page:shop": {
      const { ShopVisualSurfaceEditor } = await import(
        "@wse/core/features/template-cms/editors/ShopVisualSurfaceEditor"
      )
      const initialDraft = initialDraftUnknown as ShopContent
      const shopDeps = await getShopCmsPreviewDeps(template, initialDraft.pageSize, shopEnabled)
      return (
        <SurfacePageLayout
          editablePages={editablePages}
          settingsSections={cmsSettingsSections}
          pageKey={pageKey}
        >
          <Suspense fallback={<CmsEditorLoading />}>
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
          </Suspense>
        </SurfacePageLayout>
      )
    }

    case "page:pdp": {
      const { PdpVisualSurfaceEditor } = await import(
        "@wse/core/features/template-cms/editors/PdpVisualSurfaceEditor"
      )
      const product = await getPdpPreviewProduct()
      const pdpDeps = { product, selectedVariantId: undefined, shopEnabled, templateId: template.manifest.id }
      const initialDraft = initialDraftUnknown as PdpContent
      return (
        <SurfacePageLayout
          editablePages={editablePages}
          settingsSections={cmsSettingsSections}
          pageKey={pageKey}
        >
          <Suspense fallback={<CmsEditorLoading />}>
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
          </Suspense>
        </SurfacePageLayout>
      )
    }

    default: {
      const flowRoute = FLOW_PAGE_ROUTE[fullPageKey]
      if (flowRoute) {
        const { FlowShellVisualSurfaceEditor } = await import(
          "@wse/core/features/template-cms/editors/FlowShellVisualSurfaceEditor"
        )
        const initialDraft = initialDraftUnknown as DefaultModernFlowShellContent

        return (
          <SurfacePageLayout
            editablePages={editablePages}
            settingsSections={cmsSettingsSections}
            pageKey={pageKey}
          >
            <Suspense fallback={<CmsEditorLoading />}>
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
            </Suspense>
          </SurfacePageLayout>
        )
      }

      const staticSlug = fullPageKey.startsWith("page:") ? fullPageKey.slice("page:".length) : ""
      if (staticSlug && template.staticPages[staticSlug]) {
        const { StaticPageVisualSurfaceEditor } = await import(
          "@wse/core/features/template-cms/editors/StaticPageVisualSurfaceEditor"
        )
        return (
          <SurfacePageLayout
            editablePages={editablePages}
            settingsSections={cmsSettingsSections}
            pageKey={pageKey}
          >
            <Suspense fallback={<CmsEditorLoading />}>
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
            </Suspense>
          </SurfacePageLayout>
        )
      }

      if (CAMP_PAGE_KEYS.has(fullPageKey) && template.campPages) {
        const { CampSurfaceVisualEditor } = await import(
          "@wse/core/features/template-cms/editors/CampSurfaceVisualEditor"
        )
        return (
          <SurfacePageLayout
            editablePages={editablePages}
            settingsSections={cmsSettingsSections}
            pageKey={pageKey}
          >
            <Suspense fallback={<CmsEditorLoading />}>
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
            </Suspense>
          </SurfacePageLayout>
        )
      }

      if (TBOOK_PAGE_KEYS.has(fullPageKey) && template.tBookPages) {
        const { TBookSurfaceVisualEditor } = await import(
          "@wse/core/features/template-cms/editors/TBookSurfaceVisualEditor"
        )
        const initialHomeDraft = (await PageContentService.getDraft(
          template.manifest.id,
          "page:home"
        )) as Record<string, unknown>
        return (
          <SurfacePageLayout
            editablePages={editablePages}
            settingsSections={cmsSettingsSections}
            pageKey={pageKey}
          >
            <Suspense fallback={<CmsEditorLoading />}>
              <TBookSurfaceVisualEditor
                hydrationKey={editorHydrationKey}
                templateId={template.manifest.id}
                shopEnabled={shopEnabled}
                pageKey={fullPageKey}
                pageLabel={entry.label}
                initialDraft={initialDraftUnknown as Record<string, unknown>}
                initialHomeDraft={initialHomeDraft}
                branding={branding}
                footer={footer}
                seo={seo}
                theme={theme}
                themeResetBaseline={themeResetBaseline}
                homepageDeps={dependencies}
              />
            </Suspense>
          </SurfacePageLayout>
        )
      }

      notFound()
    }
  }
}

function SurfacePageLayout({
  editablePages,
  settingsSections,
  pageKey,
  children,
}: {
  editablePages: ReturnType<typeof listEditablePages>
  settingsSections: Array<{ id: string; label: string }>
  pageKey: string
  children: ReactNode
}) {
  return (
    <CmsVisualEditorPageLayout
      editablePages={editablePages}
      activeSegment={pageKey}
      settingsSections={settingsSections}
    >
      {children}
    </CmsVisualEditorPageLayout>
  )
}
