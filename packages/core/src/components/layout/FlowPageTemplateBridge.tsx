import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { PageContentService } from "@wse/core/services/page-content"
import type { FlowPageWrapperProps, FlowRouteKey } from "@wse/sdk/templates/types"

function FlowPassthrough({ children }: FlowPageWrapperProps) {
  return <>{children}</>
}

/**
 * Composes optional `flowPages[route]` pieces.
 *
 * - **`flowPageCompose: 'routeOnly'`** — renders **`children` only** (no `Wrapper`, `shell`, or `Body`).
 *   Use with **`RouteMain`** for homepage‑grade full control between Navbar and Footer.
 * - **Default** — `Wrapper` → `shell` (if any) → `Body` (if any) → `children`.
 */
export default async function FlowPageTemplateBridge({
  route,
  children,
}: {
  route: FlowRouteKey
  children: React.ReactNode
}) {
  const { template, branding } = await getActiveChrome()
  const flowDef = template.flowPages?.[route]

  if (flowDef?.flowPageCompose === "routeOnly") {
    return <>{children}</>
  }

  const Wrapper = flowDef?.Wrapper ?? FlowPassthrough
  const shellDef = flowDef?.shell
  const Body = flowDef?.Body

  let inner: React.ReactNode = children
  if (Body) {
    const BodyCmp = Body
    inner = <BodyCmp route={route}>{inner}</BodyCmp>
  }
  if (shellDef) {
    const content = await PageContentService.getPublished<unknown>(
      template.manifest.id,
      `page:${route}`
    )
    const Shell = shellDef.Shell
    inner = (
      <Shell
        content={content}
        deps={{
          branding: {
            brandName: branding.brandName,
            logoNav: branding.logoNav,
            logoFooter: branding.logoFooter,
          },
        }}
      >
        {inner}
      </Shell>
    )
  }

  return <Wrapper>{inner}</Wrapper>
}
