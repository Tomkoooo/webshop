"use client"

import type { ComponentType } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DefaultModernVisualCmsChrome } from "@wse/core/features/template-cms/components/DefaultModernVisualCmsChrome"
import { SurfaceDocEditProvider } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { useUndoableJsonDocument } from "@wse/core/features/template-cms/hooks/use-undoable-json-document"
import { useSurfaceDraftPersistence } from "@wse/core/features/template-cms/hooks/use-surface-draft-persistence"
import { useTemplateModule } from "@wse/core/features/template-cms/hooks/use-template-module"
import {
  discardTemplatePageDraft,
  publishTemplatePageContent,
} from "@wse/core/features/template-cms/api/template-page-client-api"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import type { StaticPageDeps } from "@wse/sdk/templates/types"
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

/**
 * CMS chrome for arbitrary template `staticPages[slug]` (e.g. a future `/about`, legal page, landing).
 * Persisted JSON is edited inline when the Render uses {@link SurfaceDocEditProvider} patterns.
 */
export function StaticPageVisualSurfaceEditor({
  hydrationKey,
  templateId,
  shopEnabled,
  pageKey,
  slug,
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
  slug: string
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
  const mod = useTemplateModule(templateId)

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

  if (!mod) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-6 py-10 text-sm text-neutral-400">
        Sablon betöltése…
      </div>
    )
  }

  const def = mod.staticPages[slug]
  if (!def) {
    throw new Error(`Static page '${slug}' is not registered on template '${mod.manifest.id}'`)
  }

  const RenderCmp = def.Render as ComponentType<{ content: unknown; deps: StaticPageDeps }>

  const staticDeps: StaticPageDeps = {
    branding: {
      brandName: branding.brandName,
      logoNav: branding.logoNav,
      logoFooter: branding.logoFooter,
    },
  }

  const categoriesMapped = homepageDeps.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    depth: 0,
  }))

  const toolbar = (
    <div className="px-4 py-3 border-b border-white/10 bg-black/25 text-xs text-neutral-400 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
        Sablon statikus lap: <span className="text-neutral-200">{slug}</span>
      </p>
      <p>
        A sablon előnézetén közvetlenül szerkeszthetővé tett szöveget és médiumokat itt változtatod —
        előnézet mód a jobb oldali eszközöknél ellenőrzéshez.
      </p>
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
      renderMain={(ctx) =>
        ctx.mode === "edit" ? (
          <SurfaceDocEditProvider enabled setPath={setPath}>
            <RenderCmp content={draft} deps={staticDeps} />
          </SurfaceDocEditProvider>
        ) : (
          <RenderCmp content={draft} deps={staticDeps} />
        )
      }
    />
  )
}
