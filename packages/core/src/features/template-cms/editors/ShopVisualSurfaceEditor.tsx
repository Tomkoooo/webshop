"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DefaultModernVisualCmsChrome } from "@wse/core/features/template-cms/components/DefaultModernVisualCmsChrome"
import { CmsEditorSubtoolbar } from "@wse/core/features/template-cms/components/CmsEditorSubtoolbar"
import { buildListFieldsSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
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
  const { mod, error: templateLoadError } = useTemplateModule(templateId)

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
    return <CmsEditorErrorState title="Bolt szerkesztő nem elérhető" description={templateLoadError} />
  }

  if (!mod) {
    return <CmsEditorTemplateLoading />
  }

  const ShopRender = mod.pages.shop.Render

  const categoriesMapped = homepageDeps.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    depth: 0,
  }))

  const toolbar = (
    <CmsEditorSubtoolbar title="Bolt oldal beállítások">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Szűrők</Label>
          <select
            className="h-9 rounded-md border-0 bg-background px-2 text-sm shadow-sm ring-1 ring-border/60"
            value={draft.filtersPosition}
            onChange={(e) =>
              setPath("filtersPosition", e.target.value as ShopContent["filtersPosition"])
            }
          >
            <option value="sidebar">Oldalsáv</option>
            <option value="top">Felül</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Oszlopok</Label>
          <select
            className="h-9 rounded-md border-0 bg-background px-2 text-sm shadow-sm ring-1 ring-border/60"
            value={draft.productGridColumns}
            onChange={(e) => setPath("productGridColumns", Number(e.target.value) as 2 | 3 | 4)}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Laponként</Label>
          <Input
            type="number"
            min={4}
            max={48}
            className="h-9 w-20"
            value={draft.pageSize}
            onChange={(e) => setPath("pageSize", Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>SEO cím</Label>
          <Input
            className="h-9"
            value={draft.meta.seoTitle}
            onChange={(e) => setPath("meta.seoTitle", e.target.value)}
          />
        </div>
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>SEO leírás</Label>
          <Input
            className="h-9"
            value={draft.meta.seoDescription}
            onChange={(e) => setPath("meta.seoDescription", e.target.value)}
          />
        </div>
      </div>
    </CmsEditorSubtoolbar>
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
