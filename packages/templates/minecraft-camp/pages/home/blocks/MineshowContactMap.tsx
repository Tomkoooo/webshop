"use client"

import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"

const BLOCK_ID = "contact-venue"

type Props = {
  addressTitle: string
  email?: string
  companyName?: string
  mapEmbedUrl: string
}

export function MineshowContactMap({
  addressTitle,
  email,
  companyName,
  mapEmbedUrl,
}: Props) {
  const cms = useCmsEdit()

  if (!mapEmbedUrl && !cms.enabled) return null

  return (
    <div className="px-4 pt-12 pb-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {addressTitle || cms.enabled ? (
          <h2 className="font-minecraft text-center text-xs md:text-sm text-[#2d2817]">
            <EditableTextInline
              blockType="contact"
              blockId={BLOCK_ID}
              field="title"
              value={addressTitle}
              className="text-[#2d2817] text-xs md:text-sm text-center font-minecraft"
            />
          </h2>
        ) : null}
        {cms.enabled ? (
          <div className="space-y-2">
            <p className="font-minecraft text-[10px] text-[#2d5016]">Google Maps beágyazás URL</p>
            <EditableTextInline
              blockType="contact"
              blockId={BLOCK_ID}
              field="mapEmbedUrl"
              value={mapEmbedUrl}
              multiline
              placeholder="https://www.google.com/maps/embed?..."
              className="text-[#3d2817] text-xs font-mono w-full"
            />
          </div>
        ) : null}
        {mapEmbedUrl ? (
          <div className="minecraft-map-frame overflow-hidden aspect-[21/9] min-h-[240px] bg-[#e8f5d6]">
            <iframe
              title="Térkép"
              src={mapEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        ) : null}
        {(companyName || email || cms.enabled) && (
          <div className="minecraft-panel p-4 text-center font-minecraft text-[10px] text-[#3d2817]">
            {companyName || cms.enabled ? (
              <p className="mb-1">
                <EditableTextInline
                  blockType="contact"
                  blockId={BLOCK_ID}
                  field="companyName"
                  value={companyName ?? ""}
                  className="text-[#3d2817] text-[10px] font-minecraft text-center"
                />
              </p>
            ) : null}
            {email || cms.enabled ? (
              <p>
                {cms.enabled ? (
                  <EditableTextInline
                    blockType="contact"
                    blockId={BLOCK_ID}
                    field="email"
                    value={email ?? ""}
                    className="text-[#1a3d5c] text-[10px] font-minecraft text-center underline"
                  />
                ) : (
                  <a href={`mailto:${email}`} className="text-[#1a3d5c] underline">
                    {email}
                  </a>
                )}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
