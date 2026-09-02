import { CmsText } from "@wse/cms-bridge"
import type { RenderProps, PdpPageDeps } from "@wse/sdk/templates/types"
import type { PdpContent } from "./schema"
import "../../esv2.css"

export function PdpRender({ content }: RenderProps<PdpContent, PdpPageDeps>) {
  return (
    <main className="esv2-root flex min-h-svh items-center justify-center bg-background px-6 py-16">
      <p className="esv2-display text-2xl text-muted-foreground">
        <CmsText path="title" value={content.title || "Product is not available."} />
      </p>
    </main>
  )
}
