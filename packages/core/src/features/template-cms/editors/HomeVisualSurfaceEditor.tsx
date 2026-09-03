"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DefaultModernVisualCmsChrome } from "@wse/core/features/template-cms/components/DefaultModernVisualCmsChrome"
import { CmsEditorSubtoolbar } from "@wse/core/features/template-cms/components/CmsEditorSubtoolbar"
import { CmsNavChromeSidebar } from "@wse/core/features/template-cms/components/CmsNavChromeSidebar"
import { CmsFooterChromeSidebar } from "@wse/core/features/template-cms/components/CmsFooterChromeSidebar"
import { CmsSectionsSidebar } from "@wse/core/features/template-cms/components/CmsSectionsSidebar"
import { buildListFieldsSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { SurfaceDocEditProvider } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { useUndoableJsonDocument } from "@wse/core/features/template-cms/hooks/use-undoable-json-document"
import { useSurfaceDraftPersistence } from "@wse/core/features/template-cms/hooks/use-surface-draft-persistence"
import { useTemplateModule } from "@wse/core/features/template-cms/hooks/use-template-module"
import { CmsEditorTemplateLoading } from "@wse/core/features/template-cms/components/CmsEditorTemplateLoading"
import { CmsEditorErrorState } from "@wse/core/features/template-cms/components/CmsEditorErrorState"
import {
  discardTemplatePageDraft,
  publishTemplatePageContent,
} from "@wse/core/features/template-cms/api/template-page-client-api"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import { extractTBookHomeChrome, navCtaFromTBookChrome, navItemsFromTBookChrome, tickerTextFromTBookChrome } from "@wse/plugin-t-book/lib/storefront-chrome"
import type { HomePageDeps } from "@wse/sdk/templates/types"
import { normalizeCampaignContent } from "@wse/template-keramia-shared/lib/normalize-campaign-content"
import { normalizeWdfHomeContent } from "@wse/template-world-darts-festival/lib/normalize-wdf-home-content"
import { WDF_SECTION_LABELS } from "@wse/template-world-darts-festival/lib/wdf-home-sections"
import type { HomeContent as WdfHomeContent } from "@wse/template-world-darts-festival/pages/home/schema"
import { normalizeSorfesztHomeContent } from "@wse/template-sorfeszt/lib/normalize-sorfeszt-home-content"
import { SORFESZT_SECTION_LABELS } from "@wse/template-sorfeszt/lib/sorfeszt-home-sections"
import type { HomeContent as SorfesztHomeContent } from "@wse/template-sorfeszt/pages/home/schema"
import type { CampaignPageContent } from "@wse/template-keramia-shared/static-pages/shared/schema"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import type { SeoSettings } from "@wse/core/services/seo-settings"
import type { ThemeTokens } from "@wse/core/services/theme"

type Branding = {
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

type HomepageDeps = Awaited<ReturnType<typeof getHomepageRenderDependencies>>

/** JSON surface editor for templates whose home page is not block-based (`cmsPageKind !== "homepage-blocks"`). */
export function HomeVisualSurfaceEditor({
  hydrationKey,
  templateId,
  shopEnabled,
  pageKey,
  pageLabel,
  initialDraft,
  branding,
  footer: initialFooter,
  seo,
  theme,
  themeResetBaseline,
  homepageDeps,
}: {
  hydrationKey: string
  templateId: string
  shopEnabled: boolean
  pageKey: string
  pageLabel: string
  initialDraft: Record<string, unknown>
  branding: Branding
  footer: FooterSettings
  seo: SeoSettings
  theme: ThemeTokens
  themeResetBaseline: ThemeTokens
  homepageDeps: HomepageDeps
}) {
  const router = useRouter()
  const { mod, error: templateLoadError } = useTemplateModule(templateId)
  const [testingConnection, setTestingConnection] = useState(false)

  const { draft, setPath, undo, redo, canUndo, canRedo, dirty, markSynced } = useUndoableJsonDocument(
    initialDraft,
    hydrationKey
  )

  const { persistDraft } = useSurfaceDraftPersistence({
    templateId,
    pageKey,
    draft,
    dirty,
    markSynced,
  })

  if (templateLoadError) {
    return (
      <CmsEditorErrorState title="Főoldal szerkesztő nem elérhető" description={templateLoadError} />
    )
  }

  if (!mod) {
    return <CmsEditorTemplateLoading />
  }

  const HomeRender = mod.pages.home.Render
  const campaignFallback =
    mod.manifest.id.startsWith("keramia-")
      ? (mod.pages.home.defaultContent as CampaignPageContent)
      : null

  const isTBookLanding = templateId === "world-darts-festival" || templateId === "sorfeszt"

  const normalizeDraft = (value: Record<string, unknown>) => {
    if (templateId === "world-darts-festival") {
      return normalizeWdfHomeContent(
        value,
        mod.pages.home.defaultContent as WdfHomeContent
      ) as Record<string, unknown>
    }
    if (templateId === "sorfeszt") {
      return normalizeSorfesztHomeContent(
        value,
        mod.pages.home.defaultContent as SorfesztHomeContent
      ) as Record<string, unknown>
    }
    if (!campaignFallback) return value
    return normalizeCampaignContent(value, campaignFallback) as Record<string, unknown>
  }

  const homeDeps: HomePageDeps = {
    templateId,
    products: homepageDeps.products,
    categories: homepageDeps.categories,
    reviews: homepageDeps.reviews,
    siteContact: homepageDeps.siteContact,
    company: homepageDeps.company,
    shopEnabled,
  }

  const categoriesMapped = homepageDeps.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    depth: 0,
  }))

  const meta = (draft as { meta?: { seoTitle?: string; seoDescription?: string } }).meta ?? {
    seoTitle: "",
    seoDescription: "",
  }

  const structureSidebar =
    templateId === "world-darts-festival"
      ? null
      : buildListFieldsSidebar({
          specs: mod.pages.home.listFields,
          draft,
          setPath,
        })

  const tbookChromePanels =
    isTBookLanding
      ? (ctx: {
          footerSettings: FooterSettings
          setFooterSettings: React.Dispatch<React.SetStateAction<FooterSettings>>
        }) => {
          const normalized = normalizeDraft(draft)
          const layout = (normalized as { sectionLayout?: Array<{ id: string; enabled: boolean }> })
            .sectionLayout ?? []
          const labels =
            templateId === "sorfeszt"
              ? (SORFESZT_SECTION_LABELS as Record<string, string>)
              : (WDF_SECTION_LABELS as Record<string, string>)
          return [
            {
              id: "nav",
              label: "Navigáció",
              content: (
                <CmsNavChromeSidebar
                  draft={draft}
                  setPath={setPath}
                  showTicker={templateId === "world-darts-festival"}
                />
              ),
            },
            {
              id: "footer",
              label: "Lábléc",
              content: (
                <CmsFooterChromeSidebar
                  settings={ctx.footerSettings}
                  onChange={async (next) => {
                    ctx.setFooterSettings(next)
                    await fetch("/api/admin/footer", {
                      method: "PUT",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(next),
                    })
                  }}
                />
              ),
            },
            {
              id: "sections",
              label: "Szekciók",
              content: (
                <CmsSectionsSidebar
                  layout={layout}
                  labels={labels}
                  onChange={(next) => setPath("sectionLayout", next)}
                />
              ),
            },
          ]
        }
      : undefined

  const eventNavItems = isTBookLanding
    ? navItemsFromTBookChrome(extractTBookHomeChrome(draft))
    : undefined

  const eventNavCta = isTBookLanding
    ? navCtaFromTBookChrome(extractTBookHomeChrome(draft))
    : undefined

  const eventTickerText = isTBookLanding
    ? tickerTextFromTBookChrome(extractTBookHomeChrome(draft))
    : undefined

  const toolbar = (
    <CmsEditorSubtoolbar
      title={`Főoldal: ${pageLabel}`}
      description={
        isTBookLanding ? (
          <>
            Aktív sablon: <strong>{mod.manifest.name}</strong> — kattintással szerkeszthető szövegek és
            képek. A navigáció, lábléc és szekciók a szerkesztő panelekből érhetők el.
          </>
        ) : (
          "Kattintással szerkeszthető szövegek és képek."
        )
      }
    >
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>SEO cím</Label>
          <Input
            className="h-9"
            value={meta.seoTitle ?? ""}
            onChange={(e) => setPath("meta.seoTitle", e.target.value)}
          />
        </div>
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>SEO leírás</Label>
          <Input
            className="h-9"
            value={meta.seoDescription ?? ""}
            onChange={(e) => setPath("meta.seoDescription", e.target.value)}
          />
        </div>
        {isTBookLanding ? (
          <div className="min-w-[280px] flex-1 space-y-1.5">
            <Label className={adminFieldLabel}>tBook API kulcs (tbk_…)</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                className="h-9 min-w-[200px] flex-1 font-mono text-xs"
                type="password"
                value={
                  (draft as { chrome?: { tbookApiKey?: string } }).chrome?.tbookApiKey ?? ""
                }
                onChange={(e) => setPath("chrome.tbookApiKey", e.target.value)}
                placeholder="tbk_…"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={testingConnection}
                onClick={() => {
                  const apiKey =
                    (draft as { chrome?: { tbookApiKey?: string } }).chrome?.tbookApiKey ?? ""
                  if (!apiKey.trim()) {
                    toast.error("Add meg az API kulcsot a teszteléshez.")
                    return
                  }
                  setTestingConnection(true)
                  void fetch("/api/plugins/t-book/admin/connection-test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ apiKey }),
                  })
                    .then(async (res) => {
                      const data = (await res.json()) as {
                        ok?: boolean
                        eventCount?: number
                        error?: string
                        capabilities?: {
                          apiVersion?: string
                          hotelCount?: number
                          packageHotels?: number
                          packageDeals?: number
                          roomHotels?: number
                          eventsWithRegistrationFields?: number
                          teamEvents?: number
                        }
                      }
                      if (!res.ok || !data.ok) {
                        throw new Error(data.error ?? "Kapcsolat teszt sikertelen.")
                      }
                      const cap = data.capabilities
                      const detailParts: string[] = []
                      if (cap?.hotelCount) {
                        const hotelBits: string[] = []
                        if (cap.packageHotels) {
                          hotelBits.push(
                            `${cap.packageHotels} csomagos (${cap.packageDeals ?? 0} ajánlat)`
                          )
                        }
                        if (cap.roomHotels) hotelBits.push(`${cap.roomHotels} szobás`)
                        detailParts.push(
                          `${cap.hotelCount} szállás${hotelBits.length ? `: ${hotelBits.join(", ")}` : ""}`
                        )
                      }
                      if (cap?.eventsWithRegistrationFields) {
                        detailParts.push(
                          `${cap.eventsWithRegistrationFields} regisztrációs mezővel`
                        )
                      }
                      if (cap?.teamEvents) {
                        detailParts.push(`${cap.teamEvents} csapat esemény`)
                      }
                      if (cap?.apiVersion) detailParts.push(`API v${cap.apiVersion}`)
                      const suffix =
                        detailParts.length > 0 ? ` · ${detailParts.join(" · ")}` : ""
                      toast.success(
                        `Kapcsolat rendben — ${data.eventCount ?? 0} aktív esemény érhető el${suffix}.`
                      )
                    })
                    .catch((err) => {
                      toast.error(
                        err instanceof Error ? err.message : "Kapcsolat teszt sikertelen."
                      )
                    })
                    .finally(() => setTestingConnection(false))
                }}
              >
                {testingConnection ? "Tesztelés…" : "Kapcsolat teszt"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A kulcs csak <strong>közzététel</strong> után jelenik meg az éles /jegyek oldalon.
              Mentés után használd a „Közzététel” gombot.
            </p>
          </div>
        ) : null}
      </div>
    </CmsEditorSubtoolbar>
  )

  return (
    <DefaultModernVisualCmsChrome
      templateId={templateId}
      shopEnabled={shopEnabled}
      reviewTitle={pageLabel}
      branding={branding}
      initialFooter={initialFooter}
      initialTheme={theme}
      dirty={dirty}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={undo}
      onRedo={redo}
      onSaveDraft={async () => {
        try {
          await persistDraft()
          toast.success("Piszkozat mentve")
        } catch {
          toast.error("Mentés sikertelen")
        }
      }}
      onPublish={async () => {
        try {
          await persistDraft()
          await publishTemplatePageContent(templateId, pageKey)
          toast.success("Közzétéve")
          router.refresh()
        } catch {
          toast.error("Közzététel sikertelen")
        }
      }}
      onDiscard={async () => {
        try {
          await discardTemplatePageDraft(templateId, pageKey)
          toast.success("Piszkozat elvetve")
          router.refresh()
        } catch {
          toast.error("Elvetés sikertelen")
        }
      }}
      contactEmail={homepageDeps.company.email}
      contactEmails={homepageDeps.siteContact.emails}
      contactPhone={homepageDeps.company.phone}
      contactAddress={homepageDeps.company.address}
      footerCategories={categoriesMapped}
      toolbarBelowBranding={toolbar}
      buildChromePanels={tbookChromePanels}
      footerCmsEditable={!isTBookLanding}
      structureSidebar={structureSidebar}
      navItems={eventNavItems}
      navCta={eventNavCta}
      tickerText={eventTickerText}
      wrapNavbar={
        isTBookLanding
          ? (navbar) => (
              <SurfaceDocEditProvider enabled setPath={setPath}>
                {navbar}
              </SurfaceDocEditProvider>
            )
          : undefined
      }
      renderMain={(ctx) =>
        ctx.mode === "edit" ? (
          <SurfaceDocEditProvider enabled setPath={setPath}>
            <HomeRender content={normalizeDraft(draft)} deps={homeDeps} />
          </SurfaceDocEditProvider>
        ) : (
          <HomeRender content={normalizeDraft(draft)} deps={homeDeps} />
        )
      }
    />
  )
}
