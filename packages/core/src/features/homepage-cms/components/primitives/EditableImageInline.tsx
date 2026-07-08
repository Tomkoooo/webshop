"use client"

import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"

export function EditableImageInline({
  blockType,
  field,
  src,
  alt,
  className,
  width,
  height,
  usageLabel,
  flexibleCrop,
}: {
  blockType: HomepageBlock["type"]
  field: string
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  usageLabel?: string
  flexibleCrop?: boolean
}) {
  const cms = useCmsEdit()
  return (
    <EditableImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      usageLabel={usageLabel}
      flexibleCrop={flexibleCrop}
      editMode={cms.enabled}
      onChange={(next) => cms.updateField(blockType, field, next)}
    />
  )
}

