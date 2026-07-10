import { CmsImage } from "@wse/cms-bridge"
import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

export function HomeRender({ content }: RenderProps<HomeContent, HomePageDeps>) {
  const alt = content.meta.seoTitle || "Event Structure"

  return (
    <main className="relative flex min-h-[min(90svh,720px)] w-full items-center justify-center bg-background">
      <div className="relative aspect-video h-auto max-h-[min(90svh,720px)] w-full max-w-[min(100%,calc(min(90svh,720px)*16/9))]">
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
