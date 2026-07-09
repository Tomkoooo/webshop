"use client"

import type { ComponentType } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DefaultModernVisualCmsChrome } from "@wse/core/features/template-cms/components/DefaultModernVisualCmsChrome"
import { CmsEditorSubtoolbar } from "@wse/core/features/template-cms/components/CmsEditorSubtoolbar"
import { SurfaceDocEditProvider } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { useUndoableJsonDocument } from "@wse/core/features/template-cms/hooks/use-undoable-json-document"
import { useSurfaceDraftPersistence } from "@wse/core/features/template-cms/hooks/use-surface-draft-persistence"
import {
  discardTemplatePageDraft,
  publishTemplatePageContent,
} from "@wse/core/features/template-cms/api/template-page-client-api"
import { FALLBACK_TEMPLATE_ID, getTemplateById } from "@wse/core/templates/registry"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import type { TemplateModule } from "@wse/sdk/templates/types"
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

type TBookPageKey = keyof NonNullable<TemplateModule["tBookPages"]>

const TBOOK_PAGE_KEY_MAP: Record<string, TBookPageKey> = {
  "page:jegyek": "jegyek",
  "page:tbook-foglalas": "foglalas",
  "page:tbook-foglalas-siker": "foglalasSiker",
}

export function TBookSurfaceVisualEditor({
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
  void seo
  void themeResetBaseline
  const router = useRouter()
  const mod = getTemplateById(templateId) ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
  const tBookKey = TBOOK_PAGE_KEY_MAP[pageKey]
  const def = tBookKey ? mod.tBookPages?.[tBookKey] : undefined
  if (!def) throw new Error(`tBook page '${pageKey}' is not registered on template '${mod.manifest.id}'`)

  const RenderCmp = def.Render as ComponentType<{ content: unknown; deps?: unknown }>

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
    <CmsEditorSubtoolbar
      title={`tBook oldal: ${pageLabel}`}
      description="A szövegeket közvetlenül az előnézeten szerkesztheted. Az eseménylista és a foglalási folyamat működése változatlan marad — csak a megjelenő szövegek módosulnak."
    />
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
      renderMain={(ctx) =>
        ctx.mode === "edit" ? (
          <SurfaceDocEditProvider enabled setPath={setPath}>
            <RenderCmp content={draft} deps={{}} />
          </SurfaceDocEditProvider>
        ) : (
          <RenderCmp content={draft} deps={{}} />
        )
      }
    />
  )
}
