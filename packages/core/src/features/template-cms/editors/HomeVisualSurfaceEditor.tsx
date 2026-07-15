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
import { extractTBookHomeChrome, navCtaFromTBookChrome, navItemsFromTBookChrome } from "@wse/plugin-t-book/lib/storefront-chrome"
import type { HomePageDeps } from "@wse/sdk/templates/types"
import { normalizeCampaignContent } from "@wse/template-keramia-shared/lib/normalize-campaign-content"
import { normalizeWdfHomeContent } from "@wse/template-world-darts-festival/lib/normalize-wdf-home-content"
import {
  WDF_SECTION_LABELS,
  type WdfHomeSectionId,
} from "@wse/template-world-darts-festival/lib/wdf-home-sections"
import type { HomeContent } from "@wse/template-world-darts-festival/pages/home/schema"
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

  const normalizeDraft = (value: Record<string, unknown>) => {
    if (templateId === "world-darts-festival") {
      return normalizeWdfHomeContent(
        value,
        mod.pages.home.defaultContent as HomeContent
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

  const wdfChromePanels =
    templateId === "world-darts-festival"
      ? (ctx: {
          footerSettings: FooterSettings
          setFooterSettings: React.Dispatch<React.SetStateAction<FooterSettings>>
        }) => {
          const normalized = normalizeDraft(draft) as HomeContent
          return [
            {
              id: "nav",
              label: "Navigáció",
              content: <CmsNavChromeSidebar draft={draft} setPath={setPath} />,
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
                <CmsSectionsSidebar<WdfHomeSectionId>
                  layout={normalized.sectionLayout}
                  labels={WDF_SECTION_LABELS}
                  onChange={(next) => setPath("sectionLayout", next)}
                />
              ),
            },
          ]
        }
      : undefined

  const eventNavItems =
    templateId === "world-darts-festival"
      ? navItemsFromTBookChrome(extractTBookHomeChrome(draft))
      : undefined

  const eventNavCta =
    templateId === "world-darts-festival"
      ? navCtaFromTBookChrome(extractTBookHomeChrome(draft))
      : undefined

  const toolbar = (
    <CmsEditorSubtoolbar
      title={`Főoldal: ${pageLabel}`}
      description={
        templateId === "world-darts-festival" ? (
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
        {templateId === "world-darts-festival" ? (
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
                      }
                      if (!res.ok || !data.ok) {
                        throw new Error(data.error ?? "Kapcsolat teszt sikertelen.")
                      }
                      toast.success(
                        `Kapcsolat rendben — ${data.eventCount ?? 0} aktív esemény érhető el.`
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
      buildChromePanels={wdfChromePanels}
      footerCmsEditable={templateId !== "world-darts-festival"}
      structureSidebar={structureSidebar}
      navItems={eventNavItems}
      navCta={eventNavCta}
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
