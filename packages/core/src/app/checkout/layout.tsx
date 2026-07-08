import FlowPageTemplateBridge from "@wse/core/components/layout/FlowPageTemplateBridge"
import StorefrontFlowShell from "@wse/core/components/layout/StorefrontFlowShell"

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontFlowShell>
      <FlowPageTemplateBridge route="checkout">{children}</FlowPageTemplateBridge>
    </StorefrontFlowShell>
  )
}
