import { flowShellDefinitionAsPageDefinition } from "@wse/core/templates/flow-shell-as-page-definition"
import type { FlowRouteKey, PageDefinition, TemplateModule } from "@wse/sdk/templates/types"

const FLOW_PAGE_KEY_TO_ROUTE: Record<string, FlowRouteKey> = {
  "page:cart": "cart",
  "page:checkout": "checkout",
  "page:profile": "profile",
}

export function findPageDefinition(
  template: TemplateModule,
  pageKey: string
): PageDefinition<unknown> | null {
  if (pageKey === "page:home") return template.pages.home as PageDefinition<unknown>
  if (pageKey === "page:shop") return template.pages.shop as PageDefinition<unknown>
  if (pageKey === "page:pdp") return template.pages.pdp as PageDefinition<unknown>
  if (pageKey.startsWith("page:pdp:product:")) {
    return template.pages.pdp as PageDefinition<unknown>
  }

  const flowRoute = FLOW_PAGE_KEY_TO_ROUTE[pageKey]
  if (flowRoute) {
    const shell = template.flowPages?.[flowRoute]?.shell
    return shell
      ? (flowShellDefinitionAsPageDefinition(shell, pageKey, template.manifest.id) as PageDefinition<unknown>)
      : null
  }

  if (pageKey.startsWith("page:")) {
    const slug = pageKey.slice("page:".length)
    const staticDef = template.staticPages[slug] as PageDefinition<unknown> | undefined
    if (staticDef) return staticDef

    const campKey = CAMP_PAGE_KEY_TO_CAMP[pageKey as keyof typeof CAMP_PAGE_KEY_TO_CAMP]
    if (campKey && template.campPages?.[campKey]) {
      return template.campPages[campKey] as unknown as PageDefinition<unknown>
    }
  }

  return null
}

const CAMP_PAGE_KEY_TO_CAMP = {
  "page:jegyvasarlas": "jegyvasarlas",
  "page:foglalas": "foglalas",
  "page:foglalas-siker": "foglalasSiker",
} as const satisfies Record<string, keyof NonNullable<TemplateModule["campPages"]>>
