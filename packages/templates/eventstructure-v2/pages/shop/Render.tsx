import { CmsText } from "@wse/cms-bridge"
import type { RenderProps, ShopPageDeps } from "@wse/sdk/templates/types"
import type { ShopContent } from "./schema"
import "../../esv2.css"

export function ShopRender({ content }: RenderProps<ShopContent, ShopPageDeps>) {
  return (
    <main className="esv2-root flex min-h-svh items-center justify-center bg-background px-6 py-16">
      <p className="esv2-display text-2xl text-muted-foreground">
        <CmsText path="heading" value={content.heading || "Shop is not available."} />
      </p>
    </main>
  )
}
