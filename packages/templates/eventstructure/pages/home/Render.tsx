import { CmsImage } from "@wse/cms-bridge"
import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

export function HomeRender({ content }: RenderProps<HomeContent, HomePageDeps>) {
  const alt = content.meta.seoTitle || "Event Structure"

  return (
    <main className="fixed inset-0 flex min-h-svh w-full items-center justify-center bg-background">
      <div className="relative aspect-video h-auto max-h-svh w-full max-w-[min(100vw,calc(100svh*16/9))]">
        <CmsImage
          path="heroImage"
          src={content.heroImage}
          alt={alt}
          className="absolute inset-0 size-full"
          frameClassName="size-full"
          imageClassName="size-full object-cover"
          fill
          usageLabel="Hero kép (16:9)"
        />
      </div>
    </main>
  )
}
