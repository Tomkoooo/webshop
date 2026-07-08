"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DefaultModernVisualCmsChrome } from "@wse/core/features/template-cms/components/DefaultModernVisualCmsChrome"
import { buildListFieldsSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"
import { SurfaceDocEditProvider } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { useUndoableJsonDocument } from "@wse/core/features/template-cms/hooks/use-undoable-json-document"
import { useSurfaceDraftPersistence } from "@wse/core/features/template-cms/hooks/use-surface-draft-persistence"
import {
  discardTemplatePageDraft,
  publishTemplatePageContent,
} from "@wse/core/features/template-cms/api/template-page-client-api"
import { FALLBACK_TEMPLATE_ID, getTemplateById } from "@wse/core/templates/registry"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import type { HomePageDeps } from "@wse/sdk/templates/types"
import { normalizeCampaignContent } from "@wse/template-keramia-shared/lib/normalize-campaign-content"
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
  const mod = getTemplateById(templateId) ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
  const HomeRender = mod.pages.home.Render
  const campaignFallback =
    mod.manifest.id.startsWith("keramia-")
      ? (mod.pages.home.defaultContent as CampaignPageContent)
      : null

  const normalizeDraft = (value: Record<string, unknown>) => {
    if (!campaignFallback) return value
    return normalizeCampaignContent(value, campaignFallback) as Record<string, unknown>
  }

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

  const structureSidebar = buildListFieldsSidebar({
    specs: mod.pages.home.listFields,
    draft,
    setPath,
  })

  const toolbar = (
    <div className="space-y-3 border-b border-white/10 bg-black/25 px-4 py-3 text-xs text-neutral-400">
      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
        Főoldal JSON felület: <span className="text-neutral-200">{pageLabel}</span>
      </p>
      <p>
        Kattintással szerkeszthető szövegek és képek — előnézet mód a jobb oldali eszközöknél.
      </p>
      <div className="flex flex-wrap gap-3">
        <label className="min-w-[180px] flex-1 space-y-1 text-xs">
          <span className="text-neutral-500">SEO cím</span>
          <input
            className="h-9 w-full rounded border border-white/15 bg-black/50 px-2 text-white"
            value={meta.seoTitle ?? ""}
            onChange={(e) => setPath("meta.seoTitle", e.target.value)}
          />
        </label>
        <label className="min-w-[220px] flex-1 space-y-1 text-xs">
          <span className="text-neutral-500">SEO leírás</span>
          <input
            className="h-9 w-full rounded border border-white/15 bg-black/50 px-2 text-white"
            value={meta.seoDescription ?? ""}
            onChange={(e) => setPath("meta.seoDescription", e.target.value)}
          />
        </label>
      </div>
    </div>
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
      structureSidebar={structureSidebar}
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
