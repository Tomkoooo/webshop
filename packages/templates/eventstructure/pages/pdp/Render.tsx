import { CmsText } from "@wse/cms-bridge"
import type { RenderProps, PdpPageDeps } from "@wse/sdk/templates/types"
import type { PdpContent } from "./schema"

export function PdpRender({ content }: RenderProps<PdpContent, PdpPageDeps>) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <p className="text-muted-foreground">
        <CmsText path="title" value={content.title || "Termék nem elérhető."} />
      </p>
    </main>
  )
}
