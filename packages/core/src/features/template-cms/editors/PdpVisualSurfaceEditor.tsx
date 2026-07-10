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
import type { PdpContent } from "@wse/template-default-modern/pages/pdp/schema"
import type { PdpPageDeps } from "@wse/sdk/templates/types"
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

export function PdpVisualSurfaceEditor({
  hydrationKey,
  templateId,
  shopEnabled,
  pageKey,
  initialDraft,
  pdpDeps,
  branding,
  footer: initialFooter,
  seo,
  theme,
  themeResetBaseline,
  homepageDeps,
  editorTitle = "Termék oldal · keret",
  editorSubtitle,
}: {
  hydrationKey: string
  templateId: string
  shopEnabled: boolean
  pageKey: string
  initialDraft: PdpContent
  pdpDeps: PdpPageDeps
  branding: Branding
  footer: FooterSettings
  seo: SeoSettings
  theme: ThemeTokens
  themeResetBaseline: ThemeTokens
  homepageDeps: HomepageDeps
  editorTitle?: string
  editorSubtitle?: string
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
    return <CmsEditorErrorState title="Termékoldal szerkesztő nem elérhető" description={templateLoadError} />
  }

  if (!mod) {
    return <CmsEditorTemplateLoading />
  }

  const PdpRender = mod.pages.pdp.Render

  const categoriesMapped = homepageDeps.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    depth: 0,
  }))

  const mergedForRender: PdpContent = {
    ...draft,
    editorial: {
      ...draft.editorial,
      ctaLabel: draft.editorial.ctaLabel?.trim() || draft.ctaLabel,
    },
  }

  const toolbar = (
    <CmsEditorSubtoolbar
      title={
        <>
          {editorTitle}
          {editorSubtitle ? ` · ${editorSubtitle}` : ""}
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Bevezető helye</Label>
          <select
            className="h-9 rounded-md border-0 bg-background px-2 text-sm shadow-sm ring-1 ring-border/60"
            value={draft.introPlacement}
            onChange={(e) =>
              setPath("introPlacement", e.target.value as PdpContent["introPlacement"])
            }
          >
            <option value="aboveGrid">Rács felett</option>
            <option value="belowHero">Hős alatt</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Galéria</Label>
          <select
            className="h-9 rounded-md border-0 bg-background px-2 text-sm shadow-sm ring-1 ring-border/60"
            value={draft.galleryStyle}
            onChange={(e) => setPath("galleryStyle", e.target.value as PdpContent["galleryStyle"])}
          >
            <option value="thumbs">Bélyegképek</option>
            <option value="carousel">Körhinta</option>
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={draft.showRelatedProducts}
            onChange={(e) => setPath("showRelatedProducts", e.target.checked)}
          />
          Kapcsolódó termékek
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={draft.showRecentlyViewed}
            onChange={(e) => setPath("showRecentlyViewed", e.target.checked)}
          />
          Legutóbb nézett
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[160px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>Kosár gomb felirata</Label>
          <Input
            className="h-9"
            value={draft.ctaLabel}
            onChange={(e) => setPath("ctaLabel", e.target.value)}
          />
        </div>
        <div className="min-w-[160px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>Elfogyott felirat</Label>
          <Input
            className="h-9"
            value={draft.outOfStockLabel}
            onChange={(e) => setPath("outOfStockLabel", e.target.value)}
          />
        </div>
      </div>
    </CmsEditorSubtoolbar>
  )

  const hasProduct = Boolean(pdpDeps.product)

  return (
    <DefaultModernVisualCmsChrome
      templateId={templateId}
      shopEnabled={shopEnabled}
      reviewTitle="Termék oldal előnézet"
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
      structureSidebar={buildListFieldsSidebar({ specs: mod.pages.pdp.listFields, draft, setPath })}
      renderMain={(ctx) =>
        !hasProduct ? (
          <div className="px-8 py-20 text-center text-sm text-neutral-500">
            Nincs előnézetre alkalmas aktív termék a katalógusban — add hozzá legalább egy látható terméket.
          </div>
        ) : ctx.mode === "edit" ? (
          <SurfaceDocEditProvider enabled setPath={setPath}>
            <PdpRender content={mergedForRender} deps={pdpDeps} />
          </SurfaceDocEditProvider>
        ) : (
          <PdpRender content={mergedForRender} deps={pdpDeps} />
        )
      }
    />
  )
}
