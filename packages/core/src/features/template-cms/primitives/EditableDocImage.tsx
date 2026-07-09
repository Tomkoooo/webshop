"use client"

import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { MediaFillFrame } from "@wse/core/components/common/MediaFillFrame"
import { Input } from "@wse/core/components/ui/input"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

type Props = {
  path: string
  src: string
  alt?: string
  className?: string
  imageClassName?: string
  frameClassName?: string
  fill?: boolean
  width?: number
  height?: number
  flexibleCrop?: boolean
  usageLabel?: string
}

export function EditableDocImage({
  path,
  src,
  alt = "",
  className,
  imageClassName,
  frameClassName,
  fill = false,
  width = 1200,
  height = 800,
  flexibleCrop = true,
  usageLabel,
}: Props) {
  const cms = useSurfaceDocEdit()
  const resolved = mediaImageSrc(src)
  const useFill = fill || Boolean(frameClassName)

  const imageNode = useFill ? (
    <FallbackImage
      src={resolved}
      alt={alt}
      fill
      className={cn("object-cover", imageClassName)}
      showFallbackOnError={cms.enabled ? false : undefined}
    />
  ) : (
    <FallbackImage
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={imageClassName}
      showFallbackOnError={cms.enabled ? false : undefined}
    />
  )

  const framedImage = useFill ? (
    <MediaFillFrame
      className={frameClassName ?? "w-full"}
      aspectRatio={frameClassName ? undefined : width / height}
    >
      {imageNode}
    </MediaFillFrame>
  ) : (
    imageNode
  )

  if (!cms.enabled) {
    return framedImage
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {framedImage}
      <div className="cms-admin-control relative z-10 space-y-2">
        <UploadSheet
          onUploaded={(next) => cms.setPath(path, next)}
          label="Kép feltöltése"
          usageLabel={usageLabel}
          recommendedSize={{ width, height }}
          aspect={width / height}
          allowRectangleCrop={flexibleCrop}
          allowSkipCrop={flexibleCrop}
        />
        <Input
          value={src}
          onChange={(event) => cms.setPath(path, event.target.value)}
          placeholder="/api/media/..."
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}
