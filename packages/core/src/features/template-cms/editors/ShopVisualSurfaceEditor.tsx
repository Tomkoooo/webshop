"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DefaultModernVisualCmsChrome } from "@wse/core/features/template-cms/components/DefaultModernVisualCmsChrome"
import { buildListFieldsSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"
import { SurfaceDocEditProvider } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { useUndoableJsonDocument } from "@wse/core/features/template-cms/hooks/use-undoable-json-document"
import {
  discardTemplatePageDraft,
  publishTemplatePageContent,
} from "@wse/core/features/template-cms/api/template-page-client-api"
import { FALLBACK_TEMPLATE_ID, getTemplateById } from "@wse/core/templates/registry"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import { useSurfaceDraftPersistence } from "@wse/core/features/template-cms/hooks/use-surface-draft-persistence"
import type { ShopPageDeps } from "@wse/sdk/templates/types"
import type { ShopContent } from "@wse/template-default-modern/pages/shop/schema"
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

export function ShopVisualSurfaceEditor({
  hydrationKey,
  templateId,
  shopEnabled,
  pageKey,
  initialDraft,
  shopDeps,
  branding: initialBranding,
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
  initialDraft: ShopContent
  shopDeps: ShopPageDeps
  branding: Branding
  footer: FooterSettings
  seo: SeoSettings
  theme: ThemeTokens
  themeResetBaseline: ThemeTokens
  homepageDeps: HomepageDeps
}) {
  const router = useRouter()
  const mod = getTemplateById(templateId) ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
  const ShopRender = mod.pages.shop.Render

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

  const categoriesMapped = homepageDeps.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    depth: 0,
  }))

  const toolbar = (
    <div className="px-4 py-3 border-b border-white/10 bg-black/25 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400">Bolt oldal beállítások</p>
      <div className="flex flex-wrap gap-4 items-end text-xs text-neutral-200">
        <label className="space-y-1">
          <span className="text-neutral-500">Szűrők</span>
          <select
            className="h-9 rounded border border-white/15 bg-black/50 px-2"
            value={draft.filtersPosition}
            onChange={(e) =>
              setPath("filtersPosition", e.target.value as ShopContent["filtersPosition"])
            }
          >
            <option value="sidebar">Oldalsáv</option>
            <option value="top">Felül</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-neutral-500">Oszlopok</span>
          <select
            className="h-9 rounded border border-white/15 bg-black/50 px-2"
            value={draft.productGridColumns}
            onChange={(e) => setPath("productGridColumns", Number(e.target.value) as 2 | 3 | 4)}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-neutral-500">Laponként</span>
          <input
            type="number"
            min={4}
            max={48}
            className="h-9 w-20 rounded border border-white/15 bg-black/50 px-2"
            value={draft.pageSize}
            onChange={(e) => setPath("pageSize", Number(e.target.value))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex-1 min-w-[180px] space-y-1 text-xs">
          <span className="text-neutral-500">SEO cím</span>
          <input
            className="w-full h-9 rounded border border-white/15 bg-black/50 px-2 text-white"
            value={draft.meta.seoTitle}
            onChange={(e) => setPath("meta.seoTitle", e.target.value)}
          />
        </label>
        <label className="flex-1 min-w-[220px] space-y-1 text-xs">
          <span className="text-neutral-500">SEO leírás</span>
          <input
            className="w-full h-9 rounded border border-white/15 bg-black/50 px-2 text-white"
            value={draft.meta.seoDescription}
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
      reviewTitle="Bolt előnézet"
      branding={initialBranding}
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
      structureSidebar={buildListFieldsSidebar({ specs: mod.pages.shop.listFields, draft, setPath })}
      renderMain={(ctx) =>
        ctx.mode === "edit" ? (
          <SurfaceDocEditProvider enabled setPath={setPath}>
            <ShopRender content={draft} deps={shopDeps} />
          </SurfaceDocEditProvider>
        ) : (
          <ShopRender content={draft} deps={shopDeps} />
        )
      }
    />
  )
}
