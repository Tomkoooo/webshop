"use client"

import Link from "next/link"
import { mediaImageSrc } from "@wse/core/lib/images"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"
import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"

const BLOCK_ID = "story-zsdav"

type Props = {
  title: string
  image: string
  boxHeading: string
  body: string
  ctaLabel: string
  ctaHref: string
  bannerText: string
  bannerHref?: string
}

export function MineshowStory({
  title,
  image,
  boxHeading,
  body,
  ctaLabel,
  ctaHref,
  bannerText,
  bannerHref,
}: Props) {
  const cms = useCmsEdit()
  const imageSrc = mediaImageSrc(image || "/generic-hero.svg")
  const showImage = Boolean(image?.trim()) || cms.enabled

  return (
    <section id="rolunk" className="bg-[#b8d88a] px-4 py-12 md:py-16">
      {title || cms.enabled ? (
        <h2 className="font-minecraft text-center text-sm md:text-base text-[#2d2817] mb-10 max-w-3xl mx-auto">
          <EditableTextInline
            blockType="about"
            blockId={BLOCK_ID}
            field="title"
            value={title}
            className="text-[#2d2817] text-sm md:text-base text-center font-minecraft"
          />
        </h2>
      ) : null}

      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col">
          <div className="minecraft-panel-wood overflow-hidden">
            <div className="p-5 sm:p-6 md:p-8">
              {showImage ? (
                <figure className="mb-6 md:mb-4 md:float-right md:ml-8 md:max-w-[min(100%,280px)] lg:max-w-[320px]">
                  <div className="minecraft-map-frame overflow-hidden bg-[#1a3d5c]/15">
                    {cms.enabled ? (
                      <EditableImage
                        src={imageSrc}
                        alt=""
                        editMode
                        className="w-full h-auto max-h-[240px] sm:max-h-[280px] md:max-h-[360px] object-cover object-center"
                        flexibleCrop
                        usageLabel="Történet kép"
                        onChange={(next) =>
                          cms.patchBlockData("about", { image: next }, BLOCK_ID)
                        }
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageSrc}
                        alt=""
                        className="w-full h-auto max-h-[240px] sm:max-h-[280px] md:max-h-[360px] object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                </figure>
              ) : null}

              {boxHeading || cms.enabled ? (
                <h3 className="font-minecraft text-sm text-white mb-4 md:pr-0">
                  <EditableTextInline
                    blockType="about"
                    blockId={BLOCK_ID}
                    field="boxHeading"
                    value={boxHeading}
                    className="text-white text-sm font-minecraft"
                  />
                </h3>
              ) : null}

              <div className="font-minecraft text-white/95 text-xs md:text-sm leading-relaxed md:leading-loose whitespace-pre-line">
                <EditableTextInline
                  blockType="about"
                  blockId={BLOCK_ID}
                  field="paragraph"
                  value={body}
                  multiline
                  className="text-white/95 text-xs md:text-sm font-minecraft leading-relaxed md:leading-loose"
                />
              </div>

              <div className="clear-both pt-6">
                {cms.enabled ? (
                  <EditableLinkInline
                    blockType="about"
                    blockId={BLOCK_ID}
                    labelField="ctaLabel"
                    hrefField="ctaHref"
                    label={ctaLabel}
                    href={ctaHref}
                    className="minecraft-btn-blue w-full text-center"
                  />
                ) : ctaLabel && ctaHref ? (
                  <Link href={ctaHref} className="minecraft-btn-blue w-full text-center block">
                    {ctaLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {bannerText || bannerHref || cms.enabled ? (
            <div className="bg-[#5D9B38] border-4 border-t-0 border-[#4e311f] px-4 py-3 text-center space-y-2">
              {cms.enabled ? (
                <>
                  <p className="font-minecraft text-[10px] md:text-xs text-[#1a2e0f] leading-relaxed">
                    <EditableTextInline
                      blockType="about"
                      blockId={BLOCK_ID}
                      field="bannerText"
                      value={bannerText}
                      multiline
                      className="text-[#1a2e0f] text-[10px] md:text-xs font-minecraft leading-relaxed text-center"
                    />
                  </p>
                  <p className="cms-admin-control text-left">
                    <span className="block text-[9px] uppercase tracking-widest text-[#1a2e0f]/80 mb-1">
                      Facebook esemény link
                    </span>
                    <EditableTextInline
                      blockType="about"
                      blockId={BLOCK_ID}
                      field="bannerHref"
                      value={bannerHref ?? ""}
                      className="text-[#1a2e0f] text-[9px] font-mono w-full text-left bg-black/10 px-1 py-0.5"
                      placeholder="https://www.facebook.com/events/…"
                    />
                  </p>
                </>
              ) : bannerHref ? (
                <a
                  href={bannerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-minecraft text-[10px] md:text-xs text-[#1a2e0f] leading-relaxed underline block"
                >
                  {bannerText}
                </a>
              ) : (
                <p className="font-minecraft text-[10px] md:text-xs text-[#1a2e0f] leading-relaxed">
                  {bannerText}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
