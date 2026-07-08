"use client"

import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"

export function EditableLogo({
  src,
  alt,
  editMode,
  onChange,
  usageLabel,
  recommendedSize,
  flexibleCrop = true,
}: {
  src: string
  alt: string
  editMode: boolean
  onChange: (value: string) => void
  usageLabel?: string
  recommendedSize?: { width: number; height: number }
  /** Lets editors pick crop shape (square, logo strip, full image, etc.). */
  flexibleCrop?: boolean
}) {
  return (
    <div className="space-y-2">
      <FallbackImage src={src} alt={alt} width={180} height={60} className="object-contain h-10 w-auto" />
      {editMode ? (
        <UploadSheet
          onUploaded={onChange}
          label="Change logo"
          usageLabel={usageLabel}
          recommendedSize={recommendedSize}
          aspect={recommendedSize ? recommendedSize.width / recommendedSize.height : undefined}
          allowRectangleCrop={flexibleCrop}
          allowSkipCrop={flexibleCrop}
        />
      ) : null}
    </div>
  )
}
