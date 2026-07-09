import { CmsText } from "@wse/cms-bridge"
import type { RenderProps, ShopPageDeps } from "@wse/sdk/templates/types"
import type { ShopContent } from "./schema"

export function ShopRender({ content }: RenderProps<ShopContent, ShopPageDeps>) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <p className="text-muted-foreground">
        <CmsText path="heading" value={content.heading || "Shop nem elérhető."} />
      </p>
    </main>
  )
}
