"use client"

import Link from "next/link"
import { mediaImageSrc } from "@wse/core/lib/images"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"
import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"

const HERO_BLOCK_ID = "hero-mineshow"
const STORY_BLOCK_ID = "story-zsdav"

type Props = {
  heroImage: string
  badge: string
  ctaLabel: string
  ctaHref: string
  tagline: string
}

export function MineshowHero({ heroImage, badge, ctaLabel, ctaHref, tagline }: Props) {
  const cms = useCmsEdit()
  const heroSrc = mediaImageSrc(heroImage)

  return (
    <section className={`minecraft-hero-mineshow relative ${cms.enabled ? "overflow-visible" : "overflow-hidden"}`}>
      {heroImage ? (
        <div className="absolute inset-0 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt=""
            className="h-full w-full object-cover pixelated"
          />
        </div>
      ) : null}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-8 pb-6 min-h-[min(70vh,520px)]">
        {badge || cms.enabled ? (
          <span className="mb-6 inline-block rounded-md bg-[#1a3d5c] px-4 py-2 font-minecraft-body text-sm text-white border-2 border-[#0d2840]">
            <EditableTextInline
              blockType="hero"
              blockId={HERO_BLOCK_ID}
              field="badges"
              value={badge}
              className="text-white text-sm bg-transparent border-none text-center"
              onCommit={(value) =>
                cms.patchBlockData("hero", { badges: [value] }, HERO_BLOCK_ID)
              }
            />
          </span>
        ) : null}
        <div className="max-w-2xl w-full flex justify-center mb-6">
          {heroImage || cms.enabled ? (
            cms.enabled ? (
              <EditableImage
                src={heroSrc}
                alt="Mineshow Camp"
                editMode
                className="max-h-48 md:max-h-64 w-auto object-contain pixelated drop-shadow-[6px_6px_0_#2d5016]"
                flexibleCrop
                usageLabel="Hero kép"
                onChange={(next) =>
                  cms.patchBlockData(
                    "hero",
                    { heroImage: next, heroImages: [next] },
                    HERO_BLOCK_ID
                  )
                }
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroSrc}
                alt="Mineshow Camp"
                className="max-h-48 md:max-h-64 w-auto object-contain pixelated drop-shadow-[6px_6px_0_#2d5016]"
              />
            )
          ) : (
            <span className="font-minecraft text-xl text-white drop-shadow-[4px_4px_0_#2d5016]">
              MINESHOWCAMP
            </span>
          )}
        </div>
        {cms.enabled ? (
          <EditableLinkInline
            blockType="hero"
            blockId={HERO_BLOCK_ID}
            labelField="primaryCtaLabel"
            hrefField="primaryCtaHref"
            label={ctaLabel}
            href={ctaHref}
            className="minecraft-btn bg-[#5D9B38] mb-4"
          />
        ) : (
          <Link href={ctaHref} className="minecraft-btn bg-[#5D9B38] mb-4">
            {ctaLabel}
          </Link>
        )}
      </div>
      {tagline || cms.enabled ? (
        <div className="relative z-10 bg-[#b8d88a] border-t-4 border-[#3d2817] py-4 text-center">
          <h2 className="font-minecraft text-xs md:text-sm text-[#2d2817] px-4">
            <EditableTextInline
              blockType="about"
              blockId={STORY_BLOCK_ID}
              field="title"
              value={tagline}
              className="text-[#2d2817] text-xs md:text-sm text-center font-minecraft"
            />
          </h2>
        </div>
      ) : null}
    </section>
  )
}
