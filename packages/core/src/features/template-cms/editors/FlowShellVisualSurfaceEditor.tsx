"use client"

import * as React from "react"
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
import { FlowRouteInteractivePreview } from "@wse/core/features/flow-cms/FlowRouteInteractivePreview"
import { FALLBACK_TEMPLATE_ID, getTemplateById } from "@wse/core/templates/registry"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import type { FlowRouteKey } from "@wse/sdk/templates/types"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import type { SeoSettings } from "@wse/core/services/seo-settings"
import type { ThemeTokens } from "@wse/core/services/theme"
import type { DefaultModernFlowShellContent } from "@wse/template-default-modern/pages/flow/flow-shell-schema"

type Branding = {
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

type HomepageDeps = Awaited<ReturnType<typeof getHomepageRenderDependencies>>

export function FlowShellVisualSurfaceEditor({
  hydrationKey,
  templateId,
  shopEnabled,
  pageKey,
  flowRoute,
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
  flowRoute: FlowRouteKey
  initialDraft: DefaultModernFlowShellContent
  branding: Branding
  footer: FooterSettings
  seo: SeoSettings
  theme: ThemeTokens
  themeResetBaseline: ThemeTokens
  homepageDeps: HomepageDeps
}) {
  const router = useRouter()
  const mod = getTemplateById(templateId) ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
  const flowDef = mod.flowPages![flowRoute]!
  const FlowShellPreviewPassthrough = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const Wrapper = flowDef.Wrapper ?? FlowShellPreviewPassthrough
  const Shell = flowDef.shell!.Shell

  const flowDeps = {
    branding: {
      brandName: branding.brandName,
      logoNav: branding.logoNav,
      logoFooter: branding.logoFooter,
    },
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

  const categoriesMapped = homepageDeps.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    depth: 0,
  }))

  const toolbar = (
    <CmsEditorSubtoolbar
      title="Folyamat oldal felirat"
      description="A működő kosár/pénztár/fiók UI előnézet a lenti ablakban. A fejléc szövege szerkeszthető közvetlenül az oldalon."
    />
  )

  return (
    <DefaultModernVisualCmsChrome
      templateId={templateId}
      shopEnabled={shopEnabled}
      reviewTitle={`${flowRoute} előnézet`}
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
            <Wrapper>
              <Shell content={draft} deps={flowDeps}>
                <FlowRouteInteractivePreview route={flowRoute} templateId={templateId} />
              </Shell>
            </Wrapper>
          </SurfaceDocEditProvider>
        ) : (
          <Wrapper>
            <Shell content={draft} deps={flowDeps}>
              <FlowRouteInteractivePreview route={flowRoute} templateId={templateId} />
            </Shell>
          </Wrapper>
        )
      }
    />
  )
}
