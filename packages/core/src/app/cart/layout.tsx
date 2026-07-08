import FlowPageTemplateBridge from "@wse/core/components/layout/FlowPageTemplateBridge"
import StorefrontFlowShell from "@wse/core/components/layout/StorefrontFlowShell"

export default async function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontFlowShell>
      <FlowPageTemplateBridge route="cart">{children}</FlowPageTemplateBridge>
    </StorefrontFlowShell>
  )
}
