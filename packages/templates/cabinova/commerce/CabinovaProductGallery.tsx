"use client"

import { useMemo } from "react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { MediaLightbox, useMediaLightbox, type MediaLightboxItem } from "@wse/core/components/common/MediaLightbox"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { mediaImageSrc } from "@wse/core/lib/images"

function galleryTileClass(index: number, total: number): string {
  if (total <= 1) return "col-span-2 row-span-2 md:col-span-4"
  if (total === 2) return "col-span-1 row-span-2 md:col-span-2 md:row-span-2"
  if (index === 0) return "col-span-2 row-span-2 md:col-span-2 md:row-span-2"
  if (index === 3 && total >= 4) return "col-span-2 md:col-span-2"
  return "col-span-1 row-span-1"
}

export function CabinovaProductGallery({
  productName,
  images,
}: {
  productName: string
  images: string[]
}) {
  const galleryImages = useMemo<MediaLightboxItem[]>(
    () =>
      images.map((src, index) => ({
        src,
        alt: index === 0 ? productName : `${productName} — ${index + 1}`,
      })),
    [images, productName]
  )
  const lightbox = useMediaLightbox({ images: galleryImages })

  if (images.length < 2) return null

  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="cabinova-page">
        <Reveal>
          <p className="cabinova-eyebrow mb-10">Gallery</p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[minmax(140px,1fr)] md:auto-rows-[200px]">
          {images.map((img, index) => (
            <Reveal
              key={`${img}-${index}`}
              delayMs={index * REVEAL_STAGGER_MS}
              className={galleryTileClass(index, images.length)}
            >
              <button
                type="button"
                onClick={() => lightbox.openAt(index)}
                className="group relative h-full min-h-[140px] md:min-h-[200px] w-full overflow-hidden bg-muted"
                aria-label={`Open image ${index + 1} of ${images.length}`}
              >
                <FallbackImage
                  src={mediaImageSrc(img)}
                  alt={galleryImages[index]?.alt ?? productName}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <MediaLightbox
        open={lightbox.open}
        onOpenChange={lightbox.setOpen}
        images={galleryImages}
        index={lightbox.index}
        onIndexChange={lightbox.setIndex}
      />
    </section>
  )
}
