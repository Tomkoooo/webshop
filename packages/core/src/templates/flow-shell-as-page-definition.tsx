import type { ComponentType } from "react"
import { FlowRouteInteractivePreview } from "@wse/core/features/flow-cms/FlowRouteInteractivePreview"
import type { FlowPageShellDefinition, FlowRouteKey, FlowShellDeps, PageDefinition } from "@wse/sdk/templates/types"

const PAGE_KEY_TO_ROUTE: Record<string, FlowRouteKey> = {
  "page:cart": "cart",
  "page:checkout": "checkout",
  "page:profile": "profile",
}

/**
 * Adapts a flow `shell` for the generic CMS + PageContentService, which expect a `PageDefinition.Render`.
 * Renders the real `Shell` with the same interactive engine UI as the live flow route.
 */
export function flowShellDefinitionAsPageDefinition(
  shell: FlowPageShellDefinition,
  pageKey: string,
  templateId: string
): PageDefinition<unknown, FlowShellDeps> {
  const Shell = shell.Shell as ComponentType<{
    content: unknown
    deps: FlowShellDeps
    children: React.ReactNode
  }>
  const route = PAGE_KEY_TO_ROUTE[pageKey]
  return {
    schema: shell.schema,
    defaultContent: shell.defaultContent,
    Render: function FlowShellCmsRender({ content, deps }) {
      return (
        <Shell content={content} deps={deps}>
          {route ? <FlowRouteInteractivePreview route={route} templateId={templateId} /> : null}
        </Shell>
      )
    },
    EditorPanel: shell.EditorPanel,
  }
}
